# SPDX-License-Identifier: MIT
"""Import official LA region boundary layers into the ``Region`` table.

Pulls each dimension from its publisher's ArcGIS REST endpoint as GeoJSON, honours the
declared CRS, normalises to ``MultiPolygon / EPSG:4326``, and upserts on ``(kind,
code)`` so re-running is idempotent.

    python manage.py import_regions                        # everything
    python manage.py import_regions --kind council_district --kind spa
    python manage.py import_regions --kind zip --dry-run   # verify, write nothing

Live REST rather than vendored shapefiles because the services declare their CRS in
``?f=pjson`` — LA's own GeoJSON sometimes does not, declaring WGS84 while emitting
State Plane feet. ``--source`` takes a local shapefile or GeoPackage for anything
with no service.

Runs against the DB directly. Do not call it from a request: ``gunicorn[gevent]``
patches the event loop and a CPU-bound OGR parse would starve it.
"""

from __future__ import annotations

import json
import tempfile
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, cast

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from regions.models import Region, RegionKind
from regions.services import build_region_pieces

# Envelope for the guard that catches a silently-skipped reprojection. Padded
# because LA County legitimately reaches latitude ~32.80 (Catalina and San
# Clemente islands), so an envelope tight to the mainland would reject real
# county data.
LA_BBOX_PADDED = (-119.5, 32.4, -117.0, 35.2)


@dataclass(frozen=True)
class RegionSource:
    """One boundary layer, and how to read a code and a name out of it."""

    kind: str
    label: str
    endpoint: str
    code_field: str
    name_field: str
    vintage: str = ""
    # Extra ArcGIS query params (a where clause, a spatial filter, ...).
    params: dict[str, str] = field(default_factory=dict)


SOURCES: tuple[RegionSource, ...] = (
    RegionSource(
        kind=RegionKind.COUNCIL_DISTRICT,
        label="LA City Council Districts (Adopted 2021)",
        endpoint="https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13/query",
        code_field="District",
        name_field="District_Name",
        vintage="2021",
        params={"outFields": "District,District_Name", "where": "1=1"},
    ),
    RegionSource(
        kind=RegionKind.SUPERVISORIAL_DISTRICT,
        label="LA County Supervisorial Districts (Current)",
        endpoint=(
            "https://public.gis.lacounty.gov/arcgis/rest/services/"
            "LACounty_Dynamic/Political_Boundaries/FeatureServer/27/query"
        ),
        code_field="DISTRICT",
        name_field="LABEL",
        vintage="Current",
        params={"outFields": "DISTRICT,LABEL", "where": "1=1"},
    ),
    RegionSource(
        kind=RegionKind.CITY,
        label="LA County Cities (consolidated land)",
        endpoint=(
            "https://public.gis.lacounty.gov/arcgis/rest/services/"
            "LACounty_Dynamic/Political_Boundaries/FeatureServer/19/query"
        ),
        code_field="CITY_NAME",
        name_field="CITY_LABEL",
        params={
            "outFields": "CITY_NAME,CITY_LABEL,FEAT_TYPE,CITY_TYPE",
            # Both filters are load-bearing. FEAT_TYPE='Land' drops the breakwater,
            # water and pier pieces of the same city. CITY_TYPE='City' drops the 190
            # `Unincorporated` polygons: that is a legal *status* (the absence of a
            # city), not a city, and loading it would put a pseudo-city holding
            # two-thirds of the county's land into every "top cities" rollup.
            #
            # "Not in a city" needs no dimension: a point falling in none of the 88
            # is unincorporated by definition, and deriving it stays correct when the
            # county annexes a pocket, where a stored blob would go stale.
            "where": "FEAT_TYPE = 'Land' AND CITY_TYPE = 'City'",
        },
    ),
    RegionSource(
        kind=RegionKind.SPA,
        label="LA County Service Planning Areas (2022)",
        endpoint=(
            "https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/"
            "Service_Planning_Areas_2022_view/FeatureServer/4/query"
        ),
        code_field="SPA_NUM",
        name_field="SPA_NAME",
        vintage="2022",
        params={"outFields": "SPA_NUM,SPA_NAME", "where": "1=1"},
    ),
    RegionSource(
        kind=RegionKind.COC,
        label="HUD Continuum of Care grantee areas (LA area)",
        # HUD's own ArcGIS org (`VTyQ9soqVukalItT`), edited 2025-08-19. The other
        # public copy is an Esri re-host (`4yjifSiIG17X0gW4`, "Urban Observatory"),
        # frozen at 2022-04-14 with 21 obsolete CoC codes and 12 missing.
        endpoint=(
            "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/"
            "Continuum_of_Care_Grantee_Areas/FeatureServer/0/query"
        ),
        code_field="COCNUM",
        name_field="COCNAME",
        vintage="HUD",
        # Naming the four is more correct than a spatial guess: an envelope wide
        # enough for LA County also catches Ventura, Santa Barbara and San Diego,
        # while the CoC polygons themselves reach past a tight envelope.
        params={
            "outFields": "COCNUM,COCNAME,STUSAB",
            "where": "COCNUM IN ('CA-600','CA-606','CA-607','CA-612')",
        },
    ),
    RegionSource(
        kind=RegionKind.ZIP,
        label="LA County postal ZIP Codes (parcel-based)",
        endpoint=(
            "https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/"
            "LA_County_ZIP_Codes_Hosted/FeatureServer/0/query"
        ),
        code_field="ZIPCODE",
        name_field="ZIPCODE",
        vintage="postal",
        params={
            "outFields": "ZIPCODE",
            "where": "1=1",
        },
    ),
)


def fetch_service_metadata(source: RegionSource, timeout: int = 60) -> dict[str, str]:
    """The publisher's own claim of ownership for a layer.

    ArcGIS exposes ``copyrightText`` ("This data is maintained by the Los Angeles
    County Department of Registrar-Recorder/County Clerk") and
    ``serviceItemId``. Both are captured so that "is this authoritative?" is
    answerable in SQL rather than by re-probing the endpoint later. Failure is not
    fatal: a layer that exposes neither is worth recording as such, not worth
    aborting an import over.
    """
    url = source.endpoint.removesuffix("/query") + "?f=pjson"
    request = urllib.request.Request(url, headers={"User-Agent": "BetterAngels-GIS-import/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
    except Exception:  # noqa: BLE001 — provenance is best-effort, never blocking
        return {"attribution": "", "item_id": ""}
    if not isinstance(payload, dict) or "error" in payload:
        return {"attribution": "", "item_id": ""}
    return {
        "attribution": " ".join(str(payload.get("copyrightText") or "").split())[:2000],
        "item_id": str(payload.get("serviceItemId") or "")[:64],
    }


def fetch_geojson(source: RegionSource, timeout: int = 120) -> Path:
    """Download one layer as GeoJSON to a temp file and return its path.

    Refuses a truncated response. ArcGIS silently caps results at the layer's
    ``maxRecordCount`` and signals it with ``exceededTransferLimit``; importing
    that would write a partial layer and a partial layer is worse than none,
    because every count downstream would be quietly wrong. Pagination is not
    implemented — the guard fails loudly instead, which is this command's stated
    posture. Today no configured source comes close (max seen: 317 ZIPs against
    a 100,000 limit), but census tracts would.
    """
    params = dict(source.params)
    params.update({"outSR": "4326", "f": "geojson"})
    url = f"{source.endpoint}?{urllib.parse.urlencode(params)}"

    request = urllib.request.Request(url, headers={"User-Agent": "BetterAngels-GIS-import/1.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        payload = json.load(response)

    if isinstance(payload, dict) and "error" in payload:
        raise CommandError(f"{source.kind}: ArcGIS error: {payload['error'].get('message', payload['error'])}")
    if not payload.get("features"):
        raise CommandError(f"{source.kind}: no features returned (check the where clause / envelope)")
    if payload.get("exceededTransferLimit"):
        raise CommandError(
            f"{source.kind}: the service truncated the response (exceededTransferLimit). "
            f"{len(payload['features'])} features returned but more exist; page the query "
            "or narrow the where clause before importing."
        )

    handle = tempfile.NamedTemporaryFile(suffix=".geojson", delete=False, mode="w", encoding="utf-8")
    with handle:
        json.dump(payload, handle, ensure_ascii=False)
    return Path(handle.name)


def normalise(geometry: Any) -> MultiPolygon:
    """Repair and promote one geometry to ``MultiPolygon`` in place.

    Shapefile/FeatureServer layers are single-type, so a ``Polygon`` feature and a
    ``MultiPolygon`` feature cannot share a column without this promotion.
    ``make_valid`` first: self-intersections are routine in published boundaries,
    and it can widen the type to a GeometryCollection, so polygonal parts are
    extracted before the cast.
    """
    if not geometry.valid:
        geometry = geometry.make_valid()

    if geometry.geom_type == "GeometryCollection":
        collection: Any = geometry
        parts = [g for g in collection if g.geom_type in ("Polygon", "MultiPolygon")]
        return MultiPolygon(
            [p for poly in parts for p in (poly if poly.geom_type == "MultiPolygon" else [poly])],
            srid=geometry.srid,
        )
    if geometry.geom_type == "Polygon":
        return MultiPolygon(geometry, srid=geometry.srid)
    if geometry.geom_type == "MultiPolygon":
        return cast(MultiPolygon, geometry)
    raise CommandError(f"unsupported geometry type {geometry.geom_type!r}")


class Command(BaseCommand):
    help = "Import official LA region boundary layers into the Region table."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--kind",
            action="append",
            default=[],
            help="Limit to one or more dimensions (repeatable). Default: all.",
        )
        parser.add_argument(
            "--source",
            default="",
            help="Load ONE local .geojson/.gpkg/.shp instead of fetching. Requires exactly one --kind.",
        )
        parser.add_argument("--dry-run", action="store_true", help="Parse and validate; write nothing.")
        parser.add_argument("--list", action="store_true", help="List the configured sources and exit.")

    def handle(self, *args: Any, **options: Any) -> None:
        if options["list"]:
            for source in SOURCES:
                self.stdout.write(f"  {source.kind:<24}{source.label}")
            return

        selected = [s for s in SOURCES if not options["kind"] or s.kind in options["kind"]]
        if not selected:
            raise CommandError(f"no sources match {options['kind']}; try --list")

        # A local file is a file for ONE dimension. Applying it to every selected
        # source does not merely duplicate data — field names are matched
        # case-insensitively, so a council-district file with `District` also
        # satisfies a supervisorial source's `DISTRICT` code field and the same
        # polygons get written to an unrelated dimension. Require the caller to
        # say which dimension the file is.
        if options["source"] and len(selected) != 1:
            raise CommandError(
                f"--source loads a single file, but {len(selected)} dimensions are selected "
                f"({', '.join(s.kind for s in selected)}). Pass exactly one --kind."
            )

        total = 0
        # One transaction across every dimension, so a failure part-way through a
        # multi-dimension run cannot leave some dimensions loaded and others not
        # behind a command that reported failure. Each source is independently
        # atomic; without this the *command* is not.
        with transaction.atomic():
            for source in selected:
                total += self._load(source, dry_run=options["dry_run"], local=options["source"])

        verb = "validated" if options["dry_run"] else "loaded"
        self.stdout.write(self.style.SUCCESS(f"{verb} {total} regions across {len(selected)} dimension(s)"))

    def _load(self, source: RegionSource, *, dry_run: bool, local: str) -> int:
        self.stdout.write(f"\n{source.kind}: {source.label}")

        downloaded: Path | None = None
        if local:
            path = Path(local)
            if not path.exists():
                raise CommandError(f"no such file: {path}")
        else:
            path = fetch_geojson(source)
            # A ~22 MB temp file per fetch, so it is always removed — including on
            # the failure paths below, which is exactly when it would leak.
            downloaded = path
        try:
            return self._ingest(source, path=path, dry_run=dry_run)
        finally:
            if downloaded is not None:
                downloaded.unlink(missing_ok=True)

    def _ingest(self, source: RegionSource, *, path: Path, dry_run: bool) -> int:
        self.stdout.write(f"  source file: {path}")

        metadata = (
            fetch_service_metadata(source)
            if not path.name.startswith("tmpshape")
            else {
                "attribution": "",
                "item_id": "",
            }
        )
        if metadata["attribution"]:
            self.stdout.write(f"  attributed: {metadata['attribution'][:90]}")
        else:
            self.stdout.write("  attributed: (the publisher exposes no copyrightText)")

        datasource = DataSource(str(path))
        layer = datasource[0]
        self.stdout.write(f"  features  : {len(layer)}")

        # Group by code so a layer published in parts (cities) becomes one region.
        buckets: dict[str, dict[str, Any]] = {}
        for feature in layer:
            code = self._read_field(feature, source.code_field)
            if code is None:
                continue
            geometry = feature.geom.geos
            if geometry is None:
                continue  # type: ignore[unreachable]
            name = self._read_field(feature, source.name_field) or code
            multipolygon = normalise(geometry)
            entry = buckets.setdefault(code, {"name": name, "parts": []})
            entry["parts"].append(multipolygon)

        if not buckets:
            raise CommandError(f"{source.kind}: no usable features (is the code field {source.code_field!r} right?)")

        regions: list[Region] = []
        for code, entry in buckets.items():
            parts = entry["parts"]
            geometry = parts[0]
            if len(parts) > 1:
                # GEOS ``union`` is pairwise, not variadic: fold the parts in.
                # This is a parts-to-one-row consolidation keyed on the published
                # code, not a topological dissolve — boundaries that a publisher
                # drew as overlapping slivers stay as they were drawn.
                for part in parts[1:]:
                    geometry = geometry.union(part)
                geometry = normalise(geometry)
            regions.append(
                Region(
                    kind=source.kind,
                    # Both columns are bounded; truncating beats a DataError
                    # raised from inside the atomic block.
                    code=str(code)[:32],
                    name=str(entry["name"])[:255],
                    source_url=source.endpoint[:1024],
                    source_vintage=source.vintage,
                    source_attribution=metadata["attribution"],
                    source_item_id=metadata["item_id"],
                    geom=geometry,
                    # `geom_display` is not set here: it is a generated column
                    # (`Region.geom_display`), so the database derives it from `geom` and
                    # there is nothing for this importer to keep in step.
                )
            )

        # The bbox assertion: a silently-skipped reprojection lands ~1e7 degrees away.
        # The padded envelope is used because LA County legitimately reaches
        # latitude ~32.80 (Catalina and San Clemente islands) — an envelope tight
        # to the mainland would reject real county data.
        min_x = min(r.geom.extent[0] for r in regions)
        min_y = min(r.geom.extent[1] for r in regions)
        max_x = max(r.geom.extent[2] for r in regions)
        max_y = max(r.geom.extent[3] for r in regions)
        guard = LA_BBOX_PADDED
        self.stdout.write(f"  bbox      : ({min_x:.4f}, {min_y:.4f}) -> ({max_x:.4f}, {max_y:.4f})")
        if not (guard[0] <= min_x and max_x <= guard[2] and guard[1] <= min_y and max_y <= guard[3]):
            raise CommandError(
                f"{source.kind}: bbox falls outside the LA envelope {guard}; the reprojection almost certainly failed"
            )

        self.stdout.write(f"  regions   : {len(regions)}")

        if dry_run:
            self.stdout.write("  dry run   : nothing written")
            return len(regions)

        with transaction.atomic():
            # Replace this dimension wholesale: a code that disappeared from the
            # publisher's current vintage should not linger as a stale region.
            # Pieces cascade with their region.
            Region.objects.filter(kind=source.kind).delete()
            Region.objects.bulk_create(regions, batch_size=200)
            pieces = build_region_pieces(kind=source.kind)

        # Nothing else to derive. The rollup reads `Region` and `RegionPiece` directly, so
        # replacing the boundary and its pieces is the whole update.
        self.stdout.write(f"  pieces    : {pieces}")
        return len(regions)

    @staticmethod
    def _read_field(feature: Any, field_name: str) -> str | None:
        """Read an attribute, tolerating case differences (DBF is case-insensitive)."""
        if not field_name:
            return None
        lookup = {str(f).lower(): f for f in feature.fields}
        actual = lookup.get(field_name.lower())
        if actual is None:
            return None
        value = feature.get(actual)
        return None if value in (None, "") else str(value)
