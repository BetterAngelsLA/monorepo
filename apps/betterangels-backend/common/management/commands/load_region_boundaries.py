# SPDX-License-Identifier: MIT
"""Load an official region boundary layer into PostGIS.

Accepts Esri Shapefile (`.shp` or a `.zip` bundle), GeoJSON, and GeoPackage —
the three formats the LA open-data catalog actually publishes boundaries in.
This is the "single region" loader for the GIS analytics foundation
(DEV-2570 / DEV-2604). It is deliberately dependency-free: it uses the
GeoDjango/OGR bindings that already ship with Django, so no new packages and
no `ogr2ogr` subprocess/IAM-credential juggling are required.

Usage
-----
    # Council districts from the LA City GeoHub (official, EPSG:3857)
    python manage.py load_region_boundaries \
        --shapefile ./council_districts.zip \
        --layer council_districts \
        --kind council_district \
        --source-url "https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13" \
        --source-vintage 2021 \
        --name-field NAME \
        --code-field District

    # Verify only, touch nothing
    python manage.py load_region_boundaries --shapefile x.geojson --layer y --kind z --dry-run

Why a management command and not a web request
----------------------------------------------
`gunicorn[gevent]` runs `gevent.monkey.patch_all()` (see gunicorn config), so a
CPU-bound GDAL parse loop in a request handler starves the event loop. Loads
must run out-of-band: a Celery task on a dedicated queue, or a one-off ECS
task mirroring `migration_service`.

See docs/gis/dev-2604-shapefile-spike.md for the full writeup.
"""

from __future__ import annotations

import hashlib
import re
import zipfile
from pathlib import Path
from typing import Any, Iterable

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

# LA County bounding box — the cheapest possible guard against a silently
# failed/missing reprojection. Any real LA dataset must fall inside this.
LA_BBOX = (-119.0, 32.8, -117.6, 34.9)

# Upper bound on vertices per geometry before we warn (see DEV-2604 writeup on
# the Google Maps polygon ceiling). Not a hard failure — a signal to simplify.
VERTEX_WARN_THRESHOLD = 2000

# Table/identifier names are interpolated into SQL and therefore must be
# validated. This is the only place a caller-supplied name reaches SQL text.
IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def sha256_file(path: Path) -> str:
    """Stable content hash so an identical re-run can be detected as a no-op."""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def resolve_shapefile(path: Path) -> str:
    """Accept a bare .shp or a .zip bundle and return an OGR-readable path.

    Shapefiles are multi-file (.shp/.shx/.dbf/.prj/.cpg must travel together).
    OGR reads a zip directly via its /vsizip/ virtual filesystem, so there is
    never a reason to unpack to disk.
    """
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as archive:
            members = [n for n in archive.namelist() if n.lower().endswith(".shp")]
        if not members:
            raise CommandError(f"no .shp found inside {path.name}")
        if len(members) > 1:
            raise CommandError(
                f"{path.name} contains {len(members)} shapefiles ({', '.join(members)}); pass --member to disambiguate"
            )
        return f"/vsizip/{path}/{members[0]}"
    if path.suffix.lower() == ".shp":
        return str(path)
    # GeoJSON and GeoPackage are accepted too: much of the LA catalog is only
    # published in one of these, and they carry their CRS more reliably than a
    # shapefile without a .prj.
    if path.suffix.lower() in (".json", ".geojson", ".gpkg"):
        return str(path)
    raise CommandError(f"expected a .shp, .zip, .geojson or .gpkg, got {path.suffix!r}")


def to_multipolygon(geometry: GEOSGeometry, target_srid: int = 4326) -> MultiPolygon:
    """Repair, normalise and reproject one feature geometry.

    Order matters and is load-bearing:
      1. MakeValid   — shapefiles routinely contain self-intersections.
      2. CollectionExtract(...,3) — MakeValid may hand back a GEOMETRYCOLLECTION,
         which will not fit a MultiPolygon column.
      3. transform   — reproject to canonical 4326 *after* repair.
    """
    if geometry.srid is None:
        raise CommandError("source geometry has no SRID; cannot reproject safely")

    if not geometry.valid:
        geometry = geometry.make_valid()  # type: ignore[assignment]

    if geometry.geom_type == "GeometryCollection":
        # Iterate the collection. GEOSGeometry shows no declared __iter__, so we
        # go through Any: a GeometryCollection is genuinely iterable at runtime.
        collection: Any = geometry
        polygons = [g for g in collection if g.geom_type in ("Polygon", "MultiPolygon")]
        geometry = MultiPolygon(
            [p for poly in polygons for p in (poly if poly.geom_type == "MultiPolygon" else [poly])],
            srid=geometry.srid,
        )
    elif geometry.geom_type == "Polygon":
        geometry = MultiPolygon(geometry, srid=geometry.srid)
    elif geometry.geom_type != "MultiPolygon":
        raise CommandError(f"unsupported geometry type {geometry.geom_type!r}")

    if geometry.srid != target_srid:
        geometry = geometry.transform(target_srid, clone=True)  # type: ignore[assignment]

    return geometry  # type: ignore[return-value]


class Command(BaseCommand):
    help = "Load an official region boundary layer into PostGIS (GeoDjango/OGR)."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument("--shapefile", required=True, help="Path to a .shp, .zip bundle, .geojson or .gpkg.")
        parser.add_argument("--layer", required=True, help="Destination table/layer name.")
        parser.add_argument("--kind", required=True, help="Region kind, e.g. council_district, spa, zip.")
        parser.add_argument("--source-url", default="", help="Provenance: where this came from.")
        parser.add_argument("--source-vintage", default="", help="Provenance: vintage/version.")
        parser.add_argument("--name-field", default="", help="Attribute to use as the region label.")
        parser.add_argument("--code-field", default="", help="Attribute to use as the region code.")
        parser.add_argument("--target-srid", type=int, default=4326, help="Canonical SRID (default 4326).")
        parser.add_argument("--member", default="", help="Specific .shp inside the zip.")
        parser.add_argument("--dry-run", action="store_true", help="Parse and validate, write nothing.")
        parser.add_argument("--force", action="store_true", help="Reload even if the hash matches.")

    def handle(self, *args: Any, **options: Any) -> None:
        path = Path(options["shapefile"]).expanduser()
        if not path.exists():
            raise CommandError(f"no such file: {path}")

        # Table names cannot be parameterised in SQL, so they are interpolated.
        # Validate them against a strict identifier pattern rather than trusting
        # the caller — without this, `--layer` is an injection vector.
        if not IDENTIFIER_RE.match(options["layer"]):
            raise CommandError(
                f"--layer {options['layer']!r} is not a valid table name "
                "(letters, digits and underscore only, must not start with a digit)"
            )
        if not IDENTIFIER_RE.match(options["kind"]):
            raise CommandError(f"--kind {options['kind']!r} is not a valid region kind identifier")

        source_hash = sha256_file(path)
        ogr_path = (
            f"/vsizip/{path}/{options['member']}"
            if options["member"] and path.suffix.lower() == ".zip"
            else resolve_shapefile(path)
        )

        self.stdout.write(f"source      : {path.name}  (sha256 {source_hash[:12]}…)")
        self.stdout.write(f"ogr path    : {ogr_path}")

        datasource = DataSource(ogr_path)
        layer = datasource[0]
        srs = layer.srs
        self.stdout.write(f"layer       : {layer.name}  |  {len(layer)} features  |  geom {layer.geom_type.name}")
        self.stdout.write(f"source SRS  : {srs.name if srs else 'UNDECLARED'}")

        if srs is None:
            raise CommandError(
                "the source declares no CRS (missing .prj). Refusing to guess — an "
                "undeclared CRS is the #1 cause of silently mis-located data. Pass an "
                "explicit source SRID by pre-processing the file."
            )

        # --- Parse + validate before touching the database -------------------
        # Resolve the requested attribute names against the real header first,
        # so a typo fails fast instead of producing a table of NULL codes.
        name_field = self._resolve_field(layer.fields, options["name_field"], "name-field")
        code_field = self._resolve_field(layer.fields, options["code_field"], "code-field")

        parsed: list[tuple[str | None, str | None, MultiPolygon]] = []
        total_vertices = 0
        for feature in layer:
            # `.geos` is typed non-optional, but a nil shapefile geometry (a legal
            # state — a shapefile cannot store NULL, so drivers invent one) yields
            # None here. Proven by the guard test; keep it.
            geometry = feature.geom.geos  # type: ignore[assignment]
            if geometry is None:
                continue  # type: ignore[unreachable]
            multipolygon = to_multipolygon(geometry, options["target_srid"])
            total_vertices += multipolygon.num_coords

            code = self._attr(feature, code_field)
            name = self._attr(feature, name_field)
            parsed.append((code, name, multipolygon))

        if not parsed:
            raise CommandError("no usable polygon features found")

        # LA bbox assertion — catches a silent no-op reprojection immediately.
        # GEOSGeometry.extent is (xmin, ymin, xmax, ymax).
        extents = [mp.extent for _, _, mp in parsed]
        min_x = min(e[0] for e in extents)
        min_y = min(e[1] for e in extents)
        max_x = max(e[2] for e in extents)
        max_y = max(e[3] for e in extents)
        self.stdout.write(f"output bbox : ({min_x:.4f}, {min_y:.4f}) -> ({max_x:.4f}, {max_y:.4f})")
        if not (LA_BBOX[0] <= min_x and max_x <= LA_BBOX[2] and LA_BBOX[1] <= min_y and max_y <= LA_BBOX[3]):
            raise CommandError(
                f"output bbox falls outside the LA County envelope {LA_BBOX}. "
                "This almost always means the reprojection silently failed."
            )

        self.stdout.write(f"parsed      : {len(parsed)} polygons, {total_vertices} vertices total")
        if total_vertices > VERTEX_WARN_THRESHOLD * len(parsed):
            self.stdout.write(
                self.style.WARNING(
                    f"  average {total_vertices // len(parsed)} vertices/feature exceeds "
                    f"{VERTEX_WARN_THRESHOLD}; consider ST_CoverageSimplify for the map layer."
                )
            )

        if options["dry_run"]:
            self.stdout.write(self.style.SUCCESS("dry run: nothing written"))
            return

        # --- Promote in a single transaction ---------------------------------
        table = options["layer"]
        with transaction.atomic(), connection.cursor() as cursor:
            cursor.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id           bigserial PRIMARY KEY,
                    kind         text        NOT NULL,
                    code         text,
                    name         text,
                    source_url   text,
                    source_vintage text,
                    source_sha256  char(64),
                    geom         geometry(MultiPolygon, %s) NOT NULL
                )
                """,
                [options["target_srid"]],
            )

            cursor.execute(f"SELECT 1 FROM {table} WHERE source_sha256 = %s LIMIT 1", [source_hash])
            if cursor.fetchone() and not options["force"]:
                self.stdout.write(
                    self.style.SUCCESS(f"{table} already holds sha256 {source_hash[:12]}…; nothing to do")
                )
                return

            cursor.execute(f"DELETE FROM {table} WHERE kind = %s", [options["kind"]])

            cursor.executemany(
                f"""
                INSERT INTO {table}
                    (kind, code, name, source_url, source_vintage, source_sha256, geom)
                VALUES (%s, %s, %s, %s, %s, %s, ST_GeomFromEWKB(decode(%s, 'hex')))
                """,
                [
                    (
                        options["kind"],
                        code,
                        name,
                        options["source_url"],
                        options["source_vintage"],
                        source_hash,
                        multipolygon.ewkb.hex(),
                    )
                    for code, name, multipolygon in parsed
                ],
            )

            # Index after load — building it during insert is markedly slower.
            cursor.execute(f"CREATE INDEX IF NOT EXISTS {table}_geom_gix ON {table} USING GIST (geom)")

        self.stdout.write(self.style.SUCCESS(f"loaded {len(parsed)} features into {table}"))

    @staticmethod
    def _attr(feature: Any, field_name: str) -> str | None:
        """Read an attribute, tolerating case differences.

        Shapefiles are case-insensitive by nature (DBF headers), and their field
        names are truncated to 10 characters. A silently-missing field would
        otherwise produce a table full of NULL codes — so this resolves the
        requested name against the real header rather than trusting it verbatim.
        """
        if not field_name:
            return None
        lookup = {str(f).lower(): f for f in feature.fields}
        actual = lookup.get(field_name.lower())
        if actual is None:
            return None
        value = feature.get(actual)
        return None if value in (None, "") else str(value)

    def _resolve_field(self, fields: Iterable[str], requested: str, role: str) -> str:
        """Fail loudly on an unknown field name instead of writing NULLs."""
        if not requested:
            return ""
        lookup = {str(f).lower(): f for f in fields}
        actual = lookup.get(requested.lower())
        if actual is None:
            raise CommandError(
                f"--{role} {requested!r} is not a field in this layer. "
                f"Available fields: {', '.join(str(f) for f in fields)}"
            )
        if actual != requested:
            self.stdout.write(f"note        : --{role} {requested!r} resolved to field {actual!r}")
        return actual
