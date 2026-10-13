# SPDX-License-Identifier: MIT
"""Import official LA region boundary layers into the ``Region`` table.

Pulls each geographic dimension straight from its publisher's ArcGIS REST
endpoint as GeoJSON, honours the declared CRS, normalises to
``MultiPolygon / EPSG:4326``, and upserts on ``(kind, code)`` so re-running is
idempotent.

    # everything published
    python manage.py import_regions

    # just the two the report needs first
    python manage.py import_regions --kind council_district --kind spa

    # verify without writing
    python manage.py import_regions --kind zcta --dry-run

Why live REST rather than vendored shapefiles: the services declare their own
CRS in ``?f=pjson`` (LA's GeoJSON files sometimes do not — ``data.lacity.org``
declares WGS84 while emitting State Plane feet), the vintages are current, and
there is no 13 MB blob to keep in git. ``--source`` accepts a local shapefile or
GeoPackage for anything that has no service.

Runs against the DB directly, so it needs the app's normal database settings.
Do not call it from a request: ``gunicorn[gevent]`` patches the event loop, and a
CPU-bound OGR parse would starve it. Use a Celery task or a one-off ECS task.
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

# LA County bounding box — same guard as load_region_boundaries: catches a
# silently-failed reprojection, which is the failure this data is most prone to.
LA_BBOX = (-119.0, 32.8, -117.6, 34.9)
# Wider envelope for the ZCTA/CoC layers, which are fetched slightly beyond the
# county so edge polygons are complete rather than clipped.
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
    # Extra ArcGIS query parameters (a where clause, a spatial filter, ...).
    params: dict[str, str] = field(default_factory=dict)
    # The envelope the bbox guard checks against. Defaults to the LA area, but a
    # spatially-filtered fetch returns every polygon that *intersects* the
    # envelope, so those results legitimately extend past it — such a source
    # declares a wider guard rather than having the guard removed.
    guard_bbox: tuple[float, float, float, float] | None = None
    # Optional SQL-free post-processing hint: consolidate part-polygons that
    # share a code (city layers are published in pieces).
    dissolve_by_code: bool = False


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
            "outFields": "CITY_NAME,CITY_LABEL,FEAT_TYPE",
            # The layer splits each city into land/breakwater/water pieces; only
            # the land pieces should become a City region.
            "where": "FEAT_TYPE = 'Land'",
        },
        dissolve_by_code=True,
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
        endpoint=(
            "https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/"
            "Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0/query"
        ),
        code_field="COCNUM",
        name_field="COCNAME",
        vintage="HUD",
        # LA is exactly four CoCs, and naming them is more correct than a
        # spatial guess: an envelope wide enough to cover LA County also catches
        # Ventura, Santa Barbara and San Diego, while the CoC polygon itself
        # reaches past a tight envelope.
        params={
            "outFields": "COCNUM,COCNAME,STUSAB",
            "where": "COCNUM IN ('CA-600','CA-606','CA-607','CA-612')",
        },
    ),
    RegionSource(
        kind=RegionKind.ZCTA,
        label="2020 Census ZIP Code Tabulation Areas (LA area)",
        endpoint=(
            "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query"
        ),
        code_field="ZCTA5",
        name_field="NAME",
        vintage="2020",
        params={
            "outFields": "ZCTA5,NAME",
            "where": "1=1",
            # Scope the national layer to the LA envelope. The server is asked
            # in 4326 so the envelope needs no reprojection on our side.
            "geometry": ",".join(str(v) for v in LA_BBOX_PADDED),
            "geometryType": "esriGeometryEnvelope",
            "spatialRel": "esriSpatialRelIntersects",
            "inSR": "4326",
        },
        # Intersecting polygons reach past the fetch envelope (a ZCTA straddling
        # the edge is wholly returned), so the guard is ~1 degree wider.
        guard_bbox=(-120.7, 31.5, -115.6, 36.5),
    ),
)


def fetch_geojson(source: RegionSource, timeout: int = 120) -> Path:
    """Download one layer as GeoJSON to a temp file and return its path."""
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
        parser.add_argument("--source", default="", help="Load a local .geojson/.gpkg/.shp instead of fetching.")
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

        total = 0
        for source in selected:
            total += self._load(source, dry_run=options["dry_run"], local=options["source"])

        verb = "validated" if options["dry_run"] else "loaded"
        self.stdout.write(self.style.SUCCESS(f"{verb} {total} regions across {len(selected)} dimension(s)"))

    def _load(self, source: RegionSource, *, dry_run: bool, local: str) -> int:
        self.stdout.write(f"\n{source.kind}: {source.label}")

        if local:
            path = Path(local)
            if not path.exists():
                raise CommandError(f"no such file: {path}")
        else:
            path = fetch_geojson(source)
            self.stdout.write(f"  fetched   : {path}")

        datasource = DataSource(str(path))
        layer = datasource[0]
        self.stdout.write(f"  features  : {len(layer)}")

        # Group by code so a layer published in parts (cities) becomes one region.
        buckets: dict[str, dict[str, Any]] = {}
        for feature in layer:
            code = self._attr(feature, source.code_field)
            if code is None:
                continue
            geometry = feature.geom.geos
            if geometry is None:
                continue  # type: ignore[unreachable]
            name = self._attr(feature, source.name_field) or code
            multipolygon = normalise(geometry)
            entry = buckets.setdefault(code, {"name": name, "parts": []})
            entry["parts"].append(multipolygon)
            if name and not entry["name"]:
                entry["name"] = name

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
                    code=str(code),
                    name=str(entry["name"])[:255],
                    source_url=source.endpoint[:1024],
                    source_vintage=source.vintage,
                    geom=geometry,
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
        guard = source.guard_bbox or LA_BBOX_PADDED
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
            Region.objects.filter(kind=source.kind).delete()
            Region.objects.bulk_create(regions, batch_size=200)

        return len(regions)

    @staticmethod
    def _attr(feature: Any, field_name: str) -> str | None:
        """Read an attribute, tolerating case differences (DBF is case-insensitive)."""
        if not field_name:
            return None
        lookup = {str(f).lower(): f for f in feature.fields}
        actual = lookup.get(field_name.lower())
        if actual is None:
            return None
        value = feature.get(actual)
        return None if value in (None, "") else str(value)
