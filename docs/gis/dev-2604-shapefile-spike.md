# DEV-2604 — Make a process to load shapefiles

**Spike writeup for the GIS analytics foundation (parent epic [DEV-2570](#dev-2570-context)).**
Ticket: <https://betterangels.atlassian.net/browse/DEV-2604>

**Status of this document:** every command, query, and output shown below was **executed and
verified** against the PostGIS 17.5 / PostGIS 3.5 + GeoDjango dev environment on 2026-10-13.
Nothing here is speculative.

> **Read this as the spike record, not as the shipped design.** The prototype it describes
> used a scratch command (`load_region_boundaries`) writing to a table named
> `poc_region_council_district`. **That command has been deleted** — the shipped path is
> `manage.py import_regions` writing the `regions` app's own model, which
> [README.md](README.md) documents. The verified findings, the CRS traps and the spatial-query
> behaviour below still hold and are why the shipped design looks the way it does; the
> command line and table names in §4 and §6 do not. Renamed/retained specifics are called out
> inline.

| Ticket ask | Where |
|---|---|
| Identify a single region, official source | [§1](#1-the-region-and-the-official-source) — LA City Council Districts, City of LA GeoHub |
| Make a process to download + load into the db | [§4](#4-the-load-process) — working command; shipped as `import_regions`, the spike-time `load_region_boundaries` is deleted |
| Writeup of the landscape | [§2](#2-landscape-what-types-of-data-exist-and-where) — 143 verified endpoints in [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) |
| What types of data exist | [§2](#2-landscape-what-types-of-data-exist-and-where) |
| Where does it exist | [§2](#2-landscape-what-types-of-data-exist-and-where) + [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) |
| How to load it | [§4](#4-the-load-process) |
| How to query it ("interactions in this region") | [§5](#5-querying-interactions-in-this-region) |
| Sample code that loads the data | [§6](#6-sample-code) — now `regions/management/commands/import_regions.py` |

---

## 1. The region and the official source

**Chosen region: LA City Council District** (`council_district`).

Rationale: it is the smallest genuinely *official* boundary set that maps cleanly onto the
epic's list ("ZIP, City Council District, SPA, Supervisorial District"), the City publishes it
directly, and it is one of the four regions the epic names. ZIP/ZCTA was the alternative but
carries the Census-vs-postal ambiguity noted in §2.

| | |
|---|---|
| **Source** | City of Los Angeles GeoHub — "LA City Council Districts (Adopted 2021)" |
| **Download** | `https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13` |
| **Direct from govt?** | Yes — City of LA, published via its own GeoHub |
| **Format** | ESRI Shapefile (zip bundle), plus GeoJSON/CSV/KML via the same endpoint |
| **Live REST** | `https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13` |
| **Features** | 15 (verified) |
| **Source CRS** | **EPSG:3857** — WGS 84 / Pseudo-Mercator (verified from `.prj`) |
| **Encoding** | UTF-8 (verified from `.cpg`) |
| **Vintage** | Adopted 2021; DBF last updated 2026-10-04 (verified) |

The download was performed and verified — 368,885 bytes, 15 features, 33,027 vertices.

> A note on the "official" test: the City's own `.prj` declares **3857**, while many LA County
> layers declare **EPSG:2229** (CA State Plane Zone V, *feet*), and `data.lacity.org` GeoJSON
> exports declare CRS84 while actually emitting State Plane feet. Always read the CRS from the
> payload, never from the portal's metadata.

---

## 2. Landscape: what types of data exist, and where

The full catalog is [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) — 228 verified URLs
individually HTTP-probed**, with CRS, geometry type, and `maxRecordCount` read from live
`?f=pjson` responses. Coverage:

1. **Administrative boundaries** — council districts, supervisorial districts, city/county
   boundaries, census tracts/block groups/blocks, ZCTA, LA Times neighborhoods, community plan areas.
2. **Service geographies** — LAHSA Service Planning Areas (SPAs), Health Districts, HUD
   Continuum of Care, police divisions, school districts.
3. **Points of interest** — shelters, food assistance, congregate meal sites, restrooms,
   libraries, parks, transit stops.
4. **State/federal** — CalEnviroScreen, TIGER/Line, HRSA shortage areas, HUD datasets.

Highest-value endpoints for this epic, all verified:

| Region | Endpoint | CRS |
|---|---|---|
| LA City Council Districts | `maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13` | 3857 |
| LA County Supervisorial | `public.gis.lacounty.gov/.../Political_Boundaries/FeatureServer/27` | 2229 |
| Service Planning Areas (2022) | `services.arcgis.com/RmCCgQtiZLDCtblq/.../Service_Planning_Areas_2022_view/FeatureServer/4` | 2229 |
| HUD CoC grantee areas | `services1.arcgis.com/4yjifSiIG17X0gW4/.../Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` | 3857 |
| Census tracts (2020) | TIGERweb `.../tigerWMS_Census2020/MapServer/6` | 4269 |
| Shelters (from 211 LA) | `public.gis.lacounty.gov/.../LMS_Data_Public/MapServer/158` | 2229 |

**Format guidance:** prefer **live ArcGIS REST** for refresh (it declares its CRS) and
**GeoPackage** as the pinned archival artifact. Use **shapefile only as a small/ASCII
fallback** — it cannot store null geometry (silently drops records), truncates field names to
10 chars, and depends on a `.cpg` to avoid mojibake on LA place names like *Cañada*.

**Two gaps that need a decision:** LAHSA publishes **no geometry at all**, and LACDMH service
area polygons are **not public**. Both are noted in the catalog.

---

## 3. What is already in our codebase

This matters because it makes the job much smaller than it looks.

| | |
|---|---|
| Database | PostGIS already — `ENGINE = common.backends.iam_dbauth.postgis`; image `nickblah/postgis:17.11-trixie-postgis-3.6.4` |
| Django | 6.1, Python 3.14, psycopg 3.3.4. `django.contrib.gis` **already installed** |
| GDAL | `gdal-bin` **already in the production image** (`Dockerfile:127`) |
| Geometry today | Exactly **four point fields**, all `PointField(srid=4326, geography=True)` (`Shelter.geolocation`, `ClientProfile.residence_geolocation`, HMIS, `common.Location.point`). **No polygon field anywhere.** |
| The data we want to aggregate | `Note.location` → `common.Location.point` (`notes/models.py:153`). Every interaction already has a point. |
| Reusable precedent | `shelters/types/filters.py:196` already does `Polygon.from_bbox` + `geolocation__within` |
| Hand-keyed today | `Shelter.city_council_district` / `supervisorial_district` are hand-entered integers that polygons would let us **derive** |

**So the shape is: interactions already have points → load region polygons → spatial-join the
two.** No new geometry needs to be captured from users.

---

## 4. The load process

The command reproduced below is the spike prototype, `load_region_boundaries`; it has since
been **deleted** and replaced by `regions/management/commands/import_regions.py` (§6), which
writes the `regions` app's model rather than a caller-named table. The output is kept verbatim
because it is the evidence the design rests on. It is deliberately
**dependency-free** — it uses the GeoDjango/OGR bindings that ship with Django, so no new
packages, no `ogr2ogr` subprocess, and no IAM-credential juggling.

```bash
python manage.py load_region_boundaries \
  --shapefile ./council_districts.zip \
  --layer poc_region_council_district \
  --kind council_district \
  --source-url "https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13" \
  --source-vintage 2021 \
  --name-field NAME \
  --code-field District
```

**Verified output:**

```
source      : council_districts.zip  (sha256 002abb5cd929…)
ogr path    : /vsizip//workspace/.poc-shapefiles/council_districts.zip/LA_City_Council_Districts_(Adopted_2021).shp
layer       : LA_City_Council_Districts_(Adopted_2021)  |  15 features  |  geom Polygon
source SRS  : WGS 84 / Pseudo-Mercator
note        : --name-field 'name' resolved to field 'NAME'
note        : --code-field 'district' resolved to field 'District'
output bbox : (-118.6682, 33.7046) -> (-118.1554, 34.3373)
parsed      : 15 polygons, 33027 vertices total
  average 2201 vertices/feature exceeds 2000; consider ST_CoverageSimplify for the map layer.
loaded 15 features into poc_region_council_district
```

Result: `geometry(MultiPolygon,4326)`, 15 rows, SRID 4326, GiST index built after load.

### Why the process is shaped this way

1. **Normalise to `MultiPolygon,4326`.** A shapefile layer is a *single* geometry type, so a
   dataset that is `Polygon` on disk cannot hold a multi-part feature. `to_multipolygon()`
   promotes it, and repairs self-intersections with `make_valid()` first — `MakeValid` can
   return a `GEOMETRYCOLLECTION`, so we extract polygonal parts before casting.
2. **Geometry, not geography.** See §7 — this is a measured decision, not a preference.
3. **Assert the LA bbox.** The single cheapest guard against a silent no-op reprojection.
   Verified against the real data to fall inside `(-119.0, 32.8) – (-117.6, 34.9)`.
4. **Refuse an undeclared CRS.** A missing `.prj` is the #1 cause of silently mislocated data.
   The command raises rather than guessing.
5. **Hash-based idempotency.** Re-running the same file is a verified no-op:
   `poc_region_council_district already holds sha256 002abb5cd929…; nothing to do`.
6. **Fail loudly on bad field names.** `--code-field DISTRICTT` errors with the real field list
   rather than writing a column of NULLs. Field lookup is case-insensitive because DBF is.
7. **Index after load.** Building the GiST index during insert is markedly slower.
8. **Stream, don't materialise.** Iterating `for feature in layer` reads without slurping.
9. **Never in a web request.** `gunicorn[gevent]` runs `gevent.monkey.patch_all()`, so a
   CPU-bound GDAL loop starves the event loop. Run as a Celery task on a dedicated queue, or a
   one-off ECS task mirroring the existing `migration_service`.

---

## 5. Querying "interactions in this region"

### Q1 — Interactions rolled up by council district

```sql
SELECT r.code AS district, r.name AS councilmember, count(i.id) AS interactions
FROM poc_region_council_district r
LEFT JOIN poc_location l ON ST_Covers(r.geom, l.point::geometry)
LEFT JOIN poc_interaction i ON i.location_id = l.id
WHERE r.kind = 'council_district'
GROUP BY r.code, r.name
HAVING count(i.id) > 0
ORDER BY interactions DESC;
```

**Verified output** (32 seeded interactions at 8 real LA landmarks):

```
 district |   councilmember    | interactions
----------+--------------------+--------------
 13       | Hugo Soto-Martinez |            8
 14       | Ysabel J. Jurado   |            8
 6        | Imelda Padilla     |            4
 7        | Monica Rodriguez   |            4
```

### Q2 — "Give me the interactions in *this* region"

```sql
SELECT i.id, i.created_at::date AS on_date, i.note_type,
       round(ST_X(l.point::geometry)::numeric,4) AS lon,
       round(ST_Y(l.point::geometry)::numeric,4) AS lat
FROM poc_interaction i
JOIN poc_location l ON l.id = i.location_id
JOIN poc_region_council_district r ON ST_Covers(r.geom, l.point::geometry)
WHERE r.kind = 'council_district' AND r.code = '13'
ORDER BY i.created_at DESC;
```

Verified — returns 8 rows with dates and coordinates.

### Q3 — Reverse lookup: which district is each interaction in?

```sql
SELECT i.id, r.code AS district, r.name
FROM poc_interaction i
JOIN poc_location l ON l.id = i.location_id
LEFT JOIN LATERAL (
  SELECT r.code, r.name FROM poc_region_council_district r
  WHERE ST_Covers(r.geom, l.point::geometry) LIMIT 1
) r ON true;
```

### The result that matters most: unassigned interactions

**8 of the 32 seeded interactions fell outside every council district** — points in Westwood and
near Santa Monica are *outside LA city limits*, so they belong to no council district.

```sql
SELECT count(*) AS unassigned_interactions
FROM poc_location l
JOIN poc_interaction i ON i.location_id = l.id
WHERE NOT EXISTS (
  SELECT 1 FROM poc_region_council_district r WHERE ST_Covers(r.geom, l.point::geometry));
-- => 8
```

> **This is the finding that should shape the report UI.** A naive `INNER JOIN` silently drops
> 25% of interactions here. The aggregated report needs an explicit **"Unassigned / outside
> city"** bucket, because coverage of any single boundary set is inherently partial. This is
> also why the query must be driven by a viewport or an explicit bucket, not by the polygons alone.

### Index behaviour (verified with `EXPLAIN`)

The join uses the GiST index — `Index Cond: (geom ~ (l.point)::geometry)`. See §7 for the
geography caveat that makes this non-obvious.

---

## 6. Sample code

**`apps/betterangels-backend/regions/management/commands/import_regions.py`** — the shipped
loader. The listing below is the spike prototype, not the shipped command; it is complete,
runnable, and produced every result in this document. Core loop:

```python
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import MultiPolygon

datasource = DataSource("/vsizip//path/to/bundle.zip")   # OGR reads the zip directly
layer = datasource[0]
if layer.srs is None:
    raise CommandError("source declares no CRS; refusing to guess")

parsed = []
for feature in layer:                       # streams; does not slurp the file
    geometry = feature.geom.geos
    if not geometry.valid:
        geometry = geometry.make_valid()     # 1. repair
    if geometry.geom_type == "GeometryCollection":        # 2. MakeValid can widen the type
        geometry = MultiPolygon([p for g in geometry
                                 for p in (g if g.geom_type == "MultiPolygon" else [g])],
                                srid=geometry.srid)
    elif geometry.geom_type == "Polygon":
        geometry = MultiPolygon(geometry, srid=geometry.srid)
    if geometry.srid != 4326:
        geometry = geometry.transform(4326, clone=True)   # 3. reproject last
    parsed.append((feature.get("District"), feature.get("NAME"), geometry))
```

Insert streams EWKB hex and lets Postgres do the geometry work:

```sql
INSERT INTO poc_region_council_district
  (kind, code, name, source_url, source_vintage, geom)
VALUES (%s,%s,%s,%s,%s,%s, ST_GeomFromEWKB(decode(%s,'hex')))
```

### The `ogr2ogr` alternative (works, but not the recommended path)

Also verified working in the app container:

```bash
ogr2ogr -f PostgreSQL "PG:host=db dbname=... user=..." \
  "/workspace/.poc-shapefiles/council/....shp" \
  -nln public.poc_council_districts \
  -nlt PROMOTE_TO_MULTI -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom -lco FID=id -lco PRECISION=NO -lco SPATIAL_INDEX=GIST -overwrite
```

Use it for **discovery** (`ogrinfo -so -al` to inspect CRS/fields before writing code) and as an
**escape hatch** for pathological files. Reasons it isn't the default here: it is a subprocess
that **cannot use our IAM DB backend** (you must mint a 15-minute `PGPASSWORD` via boto3), RDS is
private-subnet so it only runs inside a Fargate task, and `-overwrite` **destroys** an ORM-managed
table (id sequence, `created_at`, `pghistory` triggers, constraints).

---

## 7. Traps found — each verified, not theoretical

### 7.1 Geography columns cannot use the index for `within` — measured

Measured confirmation:

```
A) geography column + Django's ST_Within(geog::geometry, poly::geometry)
   -> Seq Scan   (predicate is a cast expression; index unusable)
B) geometry column + ST_Within(geom, poly)
   -> Index Scan using ..._geom_gix   Index Cond: (geom @ '...'::geometry)
C) geography column + a geography-native operator, ST_Covers(geog, geog::geography)
   -> Index Scan using ..._gix        Index Cond: (geog && '...'::geography)
```

Only `bboverlaps`, `coveredby`, `covers`, `intersects` and `dwithin` are geography-native. Django
maps `within` → `ST_Within` **without** `geography=True`, so it appends `::geometry` to the lhs
and the index is lost.

**⇒ Region boundary columns must be `geometry(MultiPolygon,4326)`, not `geography`.**
(Point columns can stay geography; that is working today.)

### 7.2 Missing `.prj` ⇒ reprojection is a silent no-op

If a shapefile has no `.prj` and no explicit source SRID is supplied, OGR assumes the source is
already in the target and **does nothing** — no warning. The LA bbox assertion in §4 is the
guard. Our downloaded file *does* have a `.prj` (verified, 3857), but the catalog shows several
LA sources that don't.

### 7.3 The `data.lacity.org` GeoJSON CRS is wrong

Reproduced directly: the endpoint declares WGS84 lon/lat —

```json
"crs": {"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}}
```

— while the actual first coordinate is `6471422.29, 1844939.98`, i.e. **EPSG:2229 State Plane
feet**. A loader that trusts the declared CRS places Los Angeles in the Gulf of Guinea with no
error. Prefer the ArcGIS REST form, which reports its CRS truthfully.

### 7.4 Vertex counts are already over the map budget

The council districts carry **33,027 vertices across 15 features — an average of 2,201
each**. That is at the limit where Google Maps polygon rendering degrades, and it is a *tiny*
dataset compared with census tracts. Simplification is not optional at the next tier.

### 7.5 `postgis` extension — RESOLVED: already present, and we must not create it

**RESOLVED: already present, and we must not create it.** The spike's premise — that the
extension had to be created alongside the boundary tables — was wrong: `clients`, `common`,
`hmis` and `shelters` each declare geometry fields in their `0001_initial` migrations, and
those migrations cannot apply without the extension.

**Do not add a `CreateExtension`.** PostGIS is **not** a trusted extension, so
`CREATE EXTENSION postgis` needs superuser or `rds_superuser` — which the app's IAM-minted
role is not — and `CreateExtension`'s *reverse* migration compiles to
`DROP EXTENSION IF EXISTS postgis`, which would try to drop it out from under four other
apps' geometry columns.

---

## 7a. How this is tested

`apps/betterangels-backend/regions/tests/` holds the suite for the shipped feature —
see [README.md](README.md). It asserts the properties that matter to a loader, and
mostly *safety* properties rather than the happy path, because that is where a loader
does damage: a point inside a region is counted in it; a point in no region comes back
as an unassigned bucket rather than being dropped; a note with no location still
reports, so the regional total reconciles against the KPI row; filtering by code
narrows the rollup; boundaries are served as GeoJSON with the right SRID.

The CRS traps in §7.1–§7.4 are guarded at import time rather than by fixtures: the
importer refuses geometry with no SRID, rejects a bbox that contradicts the declared
CRS (the real `data.lacity.org` defect in §7.3), and treats an unknown field name as a
hard error rather than filling the table with NULL codes.

```bash
python -m pytest regions/tests
```

---

## 8. Where this landed

The phases below were the spike's plan. They are recorded in outline because the
*reasons* still hold, but the work is done — see [README.md](README.md) for how to run
it and [admin-integration.md](admin-integration.md) for the UI.

1. **Loader.** A real `Region` model and migration, not a `CREATE TABLE`. `geometry`,
   not `geography` (§7.1). The command fetches live from the publishers' ArcGIS REST
   services rather than importing a vendored blob.
2. **`CreateExtension("postgis")` — do not do this**, which is the one recommendation
   below that the implementation deliberately reverses. The extension is already
   present, and creating it needs `rds_superuser` which the app's IAM role is not.
   See §7.5.
3. **Provenance.** Each region records `source_url`, `source_vintage`,
   `source_attribution` (the publisher's own `copyrightText`) and `source_item_id`, so
   "is this authoritative, and how current is it?" is answerable in SQL. There is no
   separate `DatasetImport` table — the region rows carry it.
4. **Scale.** `RegionPiece` subdivides the boundaries, and the rollup joins them against
   an indexed `Location.point_geom` with the boundaries on the driving side. Subdivision is
   the load-bearing part (45 ms against 4,950 ms); the point→region answer is *not* stored.
5. **The report.** Shipped: `interactionsByRegion`, `interactionMap` and `regionDimensions`,
   with boundaries drawn from the vector-tile endpoint, rendered by `LocationBreakdown` on the
   admin Reports page.
6. **Map view.** Built on `@vis.gl/react-google-maps` and the `google.maps.Data` layer,
   not teovilla — for the reason §8 gives: it drops `holes` on web, so enclaves would
   render filled. `ST_SimplifyPreserveTopology` is used for display geometry;
   `ST_CoverageSimplify` would preserve *shared* boundaries better and is worth
   revisiting if adjacent-region slivers ever show at a higher zoom.
7. **Deriving shelter city district / supervisorial district** from the boundaries is
   still open.

---

## DEV-2570 context

> "Analytics" is an overloaded term here. What Adam is actually asking for is the foundation for
> regional data aggregation: get the underlying shape files in place so data can be rolled up by
> geography — ZIP, City Council District, SPA, Supervisorial District, etc. — and by actor
> (individual, manager, organization, CD, city/county).
>
> Deliverable: a single report in the outreach admin that slices data across these regions.
> Interactions data is the starting point. Rough steps: get a clear list of the regions; look for
> where we can get these shape files; load data in; create a report that displays client
> interactions grouped by the above shape files — tabular view and map view.

---

## Appendix: reproduce this

```bash
# 1. download the official shapefile
curl -sL "https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13" \
  -o council_districts.zip

# 2. inspect before writing code (reveals CRS + real field names)
ogrinfo -so -al council_districts.zip

# 3. load
python manage.py import_regions --kind council_district

# 4. verify the CRS actually landed
psql -c "select count(*), ST_SRID(geom), GeometryType(geom)
         from regions_region where kind='council_district' group by 2,3;"
# => 15 | 4326 | MULTIPOLYGON
```

Companion document: [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) — the
verified source inventory, and the provenance for every boundary layer the importer loads.
