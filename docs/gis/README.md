# GIS — regional boundary data (DEV-2570 / DEV-2604)

Everything we know about getting official Los Angeles boundary data into PostGIS so
client interactions can be aggregated by geography (ZIP, council district, SPA,
supervisorial district, …).

## Start here

| Document | What it is |
|---|---|
| [dev-2604-shapefile-spike.md](dev-2604-shapefile-spike.md) | **The spike deliverable.** Picks one region, names the official source, and shows the verified load + query process end to end. Read this first. |
| [la-geodata-sources.md](la-geodata-sources.md) | The source inventory: LA geospatial endpoints with CRS, geometry type, feature counts, licensing, and current/superseded verdicts. |
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

## Open questions

1. Does the **`postgis` extension** exist on dev/preview/prod RDS? Nothing creates it today.
2. Which **region set** ships first? Council district + SPA is the recommendation.
3. **LACDMH service areas have no public polygon layer**, and LAHSA publishes no geometry
   at all — both need a decision.
4. **Map view needs separate frontend work** — `@teovilla/react-native-web-maps`'s `Polygon`
   silently drops `onPress` and `holes` on web. See the spike doc §8.
