# GIS — regional boundary data (DEV-2570 / DEV-2604)

Everything we know about getting official Los Angeles boundary data into PostGIS so
client interactions can be aggregated by geography (ZIP, council district, SPA,
supervisorial district, …).

## Start here

| Document | What it is |
|---|---|
| [dev-2604-shapefile-spike.md](dev-2604-shapefile-spike.md) | **The spike deliverable.** Picks one region, names the official source, and shows the verified load + query process end to end. Read this first. |
| [la-geodata-sources.md](la-geodata-sources.md) | The source inventory: LA geospatial endpoints with CRS, geometry type, feature counts, licensing, and current/superseded verdicts. |
| [la-boundary-currency-audit.md](la-boundary-currency-audit.md) | **Are they current?** Live-probed verdicts on each candidate layer, and which vintages are superseded. Read before importing. |
| [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) | **The exhaustive inventory** — 283 services probed live, 266 real feature counts, 228 verified URLs, plus 33 supersessions and 19 dead/empty sources. |
| [shapefile-import-research.md](shapefile-import-research.md) | Deep dive on ingestion methods (`ogr2ogr`, `shp2pgsql`, GeoDjango/OGR, geopandas) and why the recommended one was chosen. |
| [gis-shapefile-options.md](gis-shapefile-options.md) | Consolidated options across data sources, backend import, and frontend rendering. |

## The code

`apps/betterangels-backend/common/management/commands/load_region_boundaries.py`

A dependency-free loader for Shapefile / GeoJSON / GeoPackage boundary layers. It uses
the GeoDjango OGR bindings that already ship with Django, so it adds no packages and
needs no `ogr2ogr` subprocess or IAM-credential juggling.

```bash
python manage.py load_region_boundaries \
  --shapefile ./council_districts.zip \
  --layer region_council_district \
  --kind council_district \
  --source-url "https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13" \
  --source-vintage 2021 \
  --name-field NAME \
  --code-field District
```

Tests: `apps/betterangels-backend/common/tests/test_load_region_boundaries.py`

## The short version

- **PostGIS, GeoDjango and `gdal-bin` are already in place.** No new infrastructure is
  needed. There is no polygon column anywhere yet — boundaries are greenfield.
- **Interactions already carry a point** (`Note.location` → `common.Location.point`), so
  the work is *load polygons, then spatially join*, not "capture more geometry".
- **Use `geometry(MultiPolygon, 4326)`, not `geography`,** for boundary columns. Measured:
  Django's `within` lookup appends `::geometry` to a geography lhs, which discards the
  GiST index.
- **CRS is the biggest data hazard.** LA's native projection is EPSG:2229 (State Plane V,
  *feet*); CalEnviroScreen is 3310; TIGER is 4269; HUD is 3857. `data.lacity.org`'s GeoJSON
  export declares WGS84 lon/lat while emitting State Plane feet. The loader asserts an LA
  bounding box to catch this, and there is a regression test for that exact defect.
- **Any single boundary set leaves coverage gaps.** In the spike, 8 of 32 sample
  interactions fell outside every council district (they were outside city limits), so the
  report needs an explicit "Unassigned" bucket — an inner join silently drops them.

## Region grouping (backend, shipped)

The `regions` app stores boundary polygons and answers "group/filter interactions by
geography" for six dimensions: ZCTA, city, council district, supervisorial district, SPA,
and CoC.

```bash
python manage.py import_regions                       # all six dimensions
python manage.py import_regions --kind council_district --kind spa
python manage.py import_regions --dry-run             # validate, write nothing
```

Verified live: **751 regions** — 630 ZCTA, 89 city, 15 council district, 8 SPA,
5 supervisorial, 4 CoC.

GraphQL: `interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes)`,
plus `regionDimensions` (what is loaded) and `regions(dimension, codes)` (boundaries as
GeoJSON for the map).

**Authorization differs deliberately by query.** `interactionsByRegion` carries client data
and requires `reports.view_reports` at the payload org. `regionDimensions` and `regions`
require only an authenticated session: they serve public reference boundaries, identical for
every tenant, and their SELECT touches no org- or client-scoped column.

### Two corrections the expanded catalog forced

- **LAHSA *does* publish SPA geometry** (a live polygon layer, updated 2026-09). The earlier
  "publishes no geometry" note was wrong; only their *counts* are tables.
- **The CA state DCAT feed is nearly useless for this work** — 3,950 datasets but exactly
  **one** LA-relevant boundary layer. Use the Geoportal search API
  (`gis.data.ca.gov/api/search/v1/collections/dataset/items?q=...`) instead.

Also superseded, and easy to get wrong: the **congressional map was replaced by Prop 50
(Nov 2025)** — Caltrans' layer is two cycles stale; **CalEnviroScreen 5.0** supersedes
4.0/3.0/2.0; and **2022 SPAs/Health Districts** supersede the 2012 versions, which are
still served side by side.

## Open questions

1. ~~Does the `postgis` extension exist on RDS?~~ **Settled, and the answer is that we must
   not create it.** PostGIS is already present: `clients`, `common`, `hmis` and `shelters`
   each declare geometry fields in their `0001_initial` migrations, which is impossible
   without it. The `regions` migration therefore **deliberately does not** include
   `CreateExtension("postgis")` — PostGIS is not a trusted extension, so creating it needs
   `rds_superuser` (which the app's IAM role is not), and its reverse migration compiles to
   `DROP EXTENSION IF EXISTS postgis`, which would try to drop it out from under four other
   apps' columns.
2. Which **region set** ships first? Council district + SPA is the recommendation.
3. **LACDMH service areas have no public polygon layer** — needs a decision (extract from
   their web app, ask them, or adopt SPAs as the proxy).
4. **The report UI is not in this PR.** The GraphQL surface is complete; the antd screens
   still need building against it. Note `graphql-codegen` currently fails in this
   environment on an ESM/CJS resolution error in `near-operation-file-preset`, which is
   unrelated to these changes but blocks regenerating typed documents.
