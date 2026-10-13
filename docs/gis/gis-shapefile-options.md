# GIS: Loading LA Shapefiles — Options, Sources, and Implementation

**Status:** research complete | **Ticket:** not yet read (Jira auth pending — see §0)
**Compiled:** 2026-10-13

This document consolidates three parallel research tracks, each grounded in the actual
repo, plus independent verification I performed on the load-bearing claims. Detailed
source material:

- [LA_GEODATA_SOURCES.md](LA_GEODATA_SOURCES.md) — 143 HTTP-verified LA data endpoints (549 lines)
- [shapefile-import-research.md](shapefile-import-research.md) — import methods & repo grounding (1,125 lines)

---

## 0. Blocker: the Jira ticket itself

I could not read the GIS ticket. Findings that matter for how we proceed:

- The stored `acli` OAuth token in the macOS Keychain expired **2026-10-07** and its
  refresh token is now **revoked** (verified: `POST https://auth.atlassian.com/oauth/token`
  with `grant_type=refresh_token` returns `{"error":"access_denied"}`).
- I restored the identical `acli` build (v1.3.39, `acli.atlassian.com/darwin/latest`),
  and extracted the OAuth client id/secret from the binary.
- **But the browser OAuth flow cannot complete from inside the DSH sandbox:** it blocks
  `openpty`, and background processes run in an isolated network namespace, so a loopback
  listener on `127.0.0.1:53197` is unreachable from your browser. I built and tested a
  callback server; it binds but is not reachable across the boundary.

**Two workable routes:** run `acli jira auth login --web` in your own Terminal (binary at
`/tmp/acli-tool/acli_1.3.39-stable_darwin_arm64/acli`), or paste an Atlassian **API token**
for `paul@betterangels.la` and I'll run JQL/REST directly.

> Everything below is grounded in the repo and in live-verified public data services. It is
> deliberately written so it stays useful even before the ticket text arrives — but the single
> biggest open question is **which boundaries and how many features**, because the
> recommendation is identical up to a few hundred features and diverges sharply beyond that.

---

## 1. What already exists in the repo (verified by inspection)

Some of this **contradicts the obvious assumptions**, so it's worth stating plainly.

| Area | Reality |
|---|---|
| Database | PostGIS already. `ENGINE` = `common.backends.iam_dbauth.postgis`; local image `nickblah/postgis:17.5-bullseye-postgis-3.5` (PostGIS 3.5). |
| Django | **6.1**, Python 3.14.7, psycopg 3.3.4. `django.contrib.gis` **is already installed**. |
| Cloud | AWS `us-west-2`, ECS Fargate; RDS **plain PostgreSQL 17.9**, prod `db.t4g.small` (**2 GiB RAM**), 100→500 GB. |
| GDAL | `gdal-bin` already in the production image (`Dockerfile:127`) → GDAL ~3.10, GEOS ~3.13, PROJ 9.x. Inside Django 6.1's supported windows. **Not installed on your macOS host** — all GIS CLI work must run in-container. |
| Geometry today | **Exactly four point fields**, all `PointField(srid=4326, geography=True)`. **No polygon/multipolygon field anywhere. No `GistIndex`. No `CreateExtension("postgis")` migration.** |
| Map stack | `react-native-maps` (native, Google provider) + `@teovilla/react-native-web-maps` → **Google Maps JS API** (web). **No Mapbox** — the only "mapbox" strings in the repo are in a bundled MIME table. |
| Rendering today | **Points and clusters only.** `MapClusters.tsx` renders `<Marker>` only; no polygons, fills, or tiles. |
| Reusable precedent | `shelters/types/filters.py` already does point-in-bbox: `Polygon.from_bbox(bbox)` + `geolocation__within`. Client-side `regionToBbox()` / `regionToZoom()` already exist. |
| Import tooling | **None for geospatial.** `django-import-export` (CSV/XLSX), plus a proven presigned-S3 + `django-admin-async-upload` upload path and a one-off `migration_service` ECS task to copy. |
| Anomaly | `Shelter.city_council_district` / `supervisorial_district` are **hand-keyed integers** — polygons would let these be derived instead. |

### Two landmines verified independently

1. **`map_bounds` cannot use the geography GiST index.** Django maps `within` → `ST_Within`
   *without* `geography=True`, so `check_geography()` appends `::geometry` to the lhs.
   Only `bboverlaps`/`coveredby`/`covers`/`intersects`/`dwithin` are geography-native.
   **⇒ New polygon columns must be `geometry(MultiPolygon,4326)`, not `geography`.**
2. **The `postgis` extension is unverified on RDS.** Nothing in Terraform or migrations
   creates it. Local gets it from the image. **Must be checked before any geometry DDL.**

---

## 2. Data sources for LA

Full catalog in [LA_GEODATA_SOURCES.md](LA_GEODATA_SOURCES.md) — **143 endpoints individually
HTTP-probed on 2026-10-13**, with CRS/geometry/maxRecordCount read from live `?f=pjson`
responses rather than docs. Highlights and the traps:

### The CRS trap is the single biggest data hazard
LA's native CRS is **EPSG:2229** (CA State Plane Zone V, **feet**) — not 4326. The same SPA
layer exists in 3857 on one host and 2229 on another. CalEnviroScreen is 3310; TIGER is 4269;
HUD CoC is 3857.

**I reproduced the worst case myself.** `https://data.lacity.org/resource/4jt3-efvk.geojson`
declares:

```json
"crs": {"type":"name","properties":{"name":"urn:ogc:def:crs:OGC:1.3:CRS84"}}
```

…i.e. it *claims* WGS84 lon/lat, while the actual first coordinate is
`6471422.29, 1844939.98` — State Plane **feet**. A naive loader silently stores Los Angeles
in the Gulf of Guinea, and nothing errors. **⇒ Assert the LA bbox (~`-119.0 32.8, -117.6 34.9`)
in the QA gate; it is the cheapest catch for a silent reprojection failure.**

### Verified high-value endpoints

| Layer | Endpoint | CRS |
|---|---|---|
| LA City Council Districts | `maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13` | 3857 *(extent reports latestWkid 3857)* |
| LA County Supervisorial | `public.gis.lacounty.gov/.../Political_Boundaries/FeatureServer/27` | 2229 |
| Service Planning Areas (2022) | `services.arcgis.com/RmCCgQtiZLDCtblq/.../Service_Planning_Areas_2022_view/FeatureServer/4` | 2229 |
| HUD CoC grantee areas | `services1.arcgis.com/4yjifSiIG17X0gW4/.../Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` | 3857 |
| Census tracts (2020) | TIGERweb `.../tigerWMS_Census2020/MapServer/6` | 4269 |
| CalEnviroScreen 5.0 | `services1.arcgis.com/PCHfdHz4GlDNAhBb/.../calenviroscreen50results_F_070126_gdb/FeatureServer/2` | 3310 |
| Shelters (from 211 LA) | `public.gis.lacounty.gov/.../LMS_Data_Public/MapServer/158` | 2229 |

### Notable findings and gaps

- **LA City's `Boundaries` MapServer serves working WFS 2.0.0** (30 feature types, GML 3.2) —
  rare here. Namespace is `BoundariesPro`, not `Boundaries`.
- **LA is four CoCs, not one** (verified by attribute query): `CA-600` LA City & County,
  `CA-606` Long Beach, `CA-607` Pasadena, `CA-612` Glendale.
- **LAHSA publishes no geometry at all** — dashboards and PDFs only. Substitute LMS-158 + HUD CoC.
- **LACDMH Service Area polygons are not public** (DMH's AGOL org returns zero public items).
  Open decision: extract from their web-app item, ask DMH, or adopt the 8 SPAs as a proxy.
- **Dead sources — do not build on them:** HUD Exchange's entire `/programs/coc` tree (404),
  EPA **EJScreen** (`epa.gov/ejscreen` 404, `ejscreen.epa.gov` DNS failure), OEHHA downloads
  (bot-blocked). Use CalEnviroScreen instead of EJScreen.
- **Metro's ArcGIS stop layers are stale (2019–2021)** — use GTFS from LACMTA's GitLab.
- **Licensing needs a decision:** `data.lacity.org` is clearly **CC0 1.0**; LA City GeoHub
  boundary items have **blank license text**; the LA Times neighborhood layer has no explicit
  license. Confirm before redistributing derived boundaries.

### Format recommendation: tiered, not one format

1. **Live ArcGIS REST as the default refresh path** — the only way to get current vintages,
   and it **declares its CRS** in `?f=pjson`, which is exactly what LA's GeoJSON gets wrong.
2. **GeoPackage as the pinned archival artifact** — one file, full field names, null geometry
   allowed, carries its own CRS, checksummable. Availability is **per-item, not per-portal** —
   always probe; the DCAT feed advertising a format proves nothing.
3. **Shapefile only as a small/ASCII fallback.** Concrete LA hazards: **no null geometry**
   (silently drops records lacking coordinates); **10-char field truncation**
   (`date_updated`→`date_updat`); codepage mojibake (`Cañada`, Korean/Chinese names) when `.cpg`
   is missing; 2 GB / 255-field limits; one geometry type per file.

---

## 3. Implementation methods (backend)

Full detail and snippets in [shapefile-import-research.md](shapefile-import-research.md).

### Method verdicts

- **`ogr2ogr` / `ogrinfo`** — the tool of record. `-nlt PROMOTE_TO_MULTI` is essential
  (shapefiles don't distinguish Polygon from MultiPolygon); **a missing `.prj` with no `-s_srs`
  makes reprojection a silent no-op**; `-overwrite` **destroys** ORM tables (id/sequence,
  triggers, indexes) — never aim it at a model table. **Repo friction:** the CLI can't use the
  IAM DB backend, so you must mint a 15-minute `PGPASSWORD` via boto3, and RDS is private-subnet.
  ⇒ **escape hatch and discovery tool, not the default path.**
- **`shp2pgsql`** — shapefile-only, no filtering/repair/simplify, SQL-text round-trip,
  `-s FROM:TO` and `-D` mutually exclusive, `-S` is a footgun. **Not a foundation.**
- **In-process Python — the recommendation.** `django.contrib.gis.gdal.DataSource` +
  `OGRGeometry` + PostGIS SQL: **zero new dependencies**, constant-memory streaming
  (`for feat in layer`), mypy-clean, ORM/pghistory/permission-aware, unit-testable. Stream
  `geos.ewkb.hex()` through psycopg3 `COPY` and let Postgres do the geometry math.
- **`geopandas` / `shapely` / `fiona` — wrong here.** 4–6 new packages, a *second* GDAL/GEOS
  (the classic `proj.db` version-skew trap), breaks strict mypy, bypasses the ORM, and
  `read_file` loads the **whole file into RAM** against a 2 GiB worker. `if_exists="replace"`
  **DROPs the table**, taking Django's columns and triggers with it.
- **Never ingest in a web request:** gunicorn runs `gevent.monkey.patch_all()`, so a
  CPU-bound GDAL loop starves the hub.

### Staging first, always

Staging table → SQL QA gate → **one promote statement**:

```sql
ST_Multi(
  ST_Transform(
    ST_SimplifyPreserveTopology(
      ST_CollectionExtract(ST_MakeValid(ST_GeomFromEWKB(decode(geom_hex,'hex'))), 3),
      tol_in_source_units),
    4326)
)::geometry(MultiPolygon,4326)
```

Order matters: `MakeValid` → `CollectionExtract(…,3)` (MakeValid can return a
GEOMETRYCOLLECTION) → **simplify in source units, before transform** → transform → Multi.
Build the GiST index *after* load, then `ANALYZE`.

> **Scale refinement for adjacent polygons:** use **`ST_CoverageSimplify`**, not
> `ST_SimplifyPreserveTopology`. The latter does not preserve *shared* boundaries, which
> produces visible slivers between adjacent census tracts.

### Model, provenance, and operations

- `MultiPolygonField(srid=4326)` — **geometry, not geography** (see landmine #1). Keep
  canonical 4326 and measure via `ST_Area(geom::geography)`.
- `Dataset` / `DatasetImport` (source URL, vintage, `source_sha256`, CRS, QA report,
  `is_current`) / `DatasetFeature` (+ `stable_key`). `get_or_create` on
  `(dataset, vintage, sha256)` makes re-runs **true no-ops**; a conditional unique constraint
  makes the current-pointer swap race-proof and rollback a flag flip. `pghistory` on the
  **header only** — tracking features would emit ~50k audit rows per import.
- `CreateExtension("postgis")` + a `staging` schema in the initial migration.
  For populated prod tables use `AddIndexConcurrently` with `atomic = False`.
  **Never load data in a `RunPython` migration.**
- Run as a **Celery task on a new `imports` queue** (`celery_worker_config` is a map keyed by
  queue, so this is a config-only Terraform change), guarded by `single_instance` **plus**
  `pg_advisory_xact_lock`. Keep a **one-off ECS Fargate task** (mirroring `migration_service`)
  as the escape hatch for oversized files. **Skip Lambda-with-GDAL.**
- **Budget against 2 GiB RDS:** <50–100 MB source geometry and <250k features per import.
- Add **`proj-data`** to the Dockerfile — EPSG:2229→4326 needs the NADCON grid for ~2 m
  accuracy instead of a 4–8 m fallback.
- GraphQL has **no geometry type today**; serving needs `ST_AsGeoJSON`.

---

## 4. Frontend: serving and rendering boundaries

**This is the real risk area, and it is a Google Maps problem, not a Mapbox one.**

### Teovilla's `Polygon` is broken in ways that fail silently

Teovilla *does* export `Polygon`/`Polyline`/`Circle`/`Geojson` on web, but in
`@teovilla/react-native-web-maps`:

- `components/polygon.tsx` does `onClick={(e) => mapMouseEventToMapEvent(...)}` — the return
  value is **discarded**, so **`onPress` never fires on web**. (`polyline.tsx` does it
  correctly, confirming it's a bug, not a design choice.)
- **`holes` is never forwarded** (uses `path`, not `paths`) → **holes render filled in**.
- `zIndex` is dropped, and the package's `types` entry hides all of it from TypeScript.

**⇒ On web, use `@react-google-maps/api`'s `<Data>` / `<Polygon>` directly, not teovilla's.**

### The escape hatch is verified, not assumed

Teovilla renders `{props.children}` **inside** `<GoogleMap>` (`map-view.tsx:342`), and
`MapViewport.tsx:66-68` already passes children through. So a web `BoundaryLayer` can use
`useGoogleMap()` / `<Data onLoad={d => d.addGeoJson(...)} onClick={e => e.feature}>` — a
**batched** layer with free hit-testing — while the native half uses `react-native-maps`.

### The performance ceiling is overlay count, not bytes

`react-native-maps/src/Geojson.tsx` maps **every** overlay (flattening MultiPolygons) to a
native component: **N features ⇒ N native views**, unbatched. So `<Geojson>` is fine for tens
of features and wrong for thousands.

Payload arithmetic (~25 bytes/vertex at 6dp, anchored to RFC 7946 §11.2):

| Dataset | Features | Modelled size | Verdict |
|---|---|---|---|
| Service districts (SPAs etc.) | ~20 × 500 v | ~230 KB | fine |
| LA County census tracts | ~2,350 × 40 v | **~2.8 MB** (~600 KB gzipped) | workable with simplification + viewport scoping |
| Census blocks | ~100k | ~55 MB | not viable |
| **Parcels** | **~2.6M** | **~290 MB** | **impossible as Google Maps polygons** |

> These are modelled, not measured — no shapefiles exist in the repo yet. Feature counts are
> public Census/Assessor orders of magnitude. **Parcels, not tracts, are the case that breaks
> the current provider.**
>
> *Correction to the source report:* I tried to verify the parcel count directly and could not.
> LA County's `LACounty_Dynamic` folder (**15 services**, verified) contains no parcel service,
> and the county hub parcels are **hosted feature services** (AGOL), not public county REST.
> The fire-perimeter parcel dataset returns **24,462** — that's Eaton/Palisades perimeters, not
> the county. **County parcel count is unverified**; the ~2.6M figure is the well-known LA
> County Assessor order of magnitude. Treat it as indicative and confirm as part of Ph0.

### Dead ends here

Google Maps JS `Data` and `react-native-maps` **cannot consume MVT or PMTiles** (both need
MapLibre/Mapbox GL). So the only realistic deliveries are (a) GeoJSON at a chosen
simplification/precision/scope, or (b) Google Maps Platform **Data-driven styling** datasets —
the one managed option giving native/web parity (I could not verify its published size limits).

### Key tradeoff to accept up front

**There is no shared polygon render path between platforms.** Web should use a batched `Data`
layer; native must use per-feature `<Polygon>`. **Share the data/state layer, not the render
layer** — which is exactly what the seam's `X.tsx` / `X.web.tsx` convention exists for.

---

## 5. Recommended plan

**Phase 0 — de-risk (½–1 day). Do this before committing to anything.**
1. **Read the ticket.** Which boundaries, how many features, what does "done" mean? This
   changes the plan more than any technical choice.
2. Verify the `postgis` extension exists on dev/preview/prod RDS.
3. Add `proj-data` to the Dockerfile; record `ogrinfo --version` / GEOS / PROJ.
4. **Spike `BoundaryLayer.tsx` + `BoundaryLayer.web.tsx`** in the seam against a static
   fixture (native `<Geojson>`; web `<Data>` from `@react-google-maps/api`, promoted to a
   direct dependency). This retires the biggest unknown cheaply and is the only step that
   could invalidate the rest.
5. Confirm the parcel/feature counts against the 2 GiB RDS and Google Maps budget.

**Phase 1 — one real layer end-to-end (2–4 days).** Smallest genuine layer (custom service
districts, ~20 polygons): `MultiPolygonField(srid=4326)` + `CreateExtension("postgis")` +
`staging` schema → import command → GraphQL `ST_AsGeoJSON` read (gzip + ETag) → tap-to-select
on both platforms.

**Phase 2 — scale to census tracts (1–2 weeks).** Materialize simplified tiers at import
(`ST_CoverageSimplify`, `ST_ReducePrecision`, `maxdecimaldigits=6`); viewport-scope via the
existing `regionToBbox()` + debounced `onRegionChangeComplete`; GiST `&&` + `ST_Intersects`.
Add a vertex-count guardrail.

**Phase 3 — only on measured evidence.** Google Maps DDS datasets, a raster `<UrlTile>`
fallback, or a strategic migration to MapLibre/`@rnmapbox/maps` if true vector tiles are needed.

**Phase 4 — derive what's hand-keyed.** Import council + supervisorial districts; backfill
`Shelter.city_council_district` / `supervisorial_district` via `ST_Covers`.

---

## 6. Open questions needing a decision

1. **Which boundaries, and how many features?** (ticket)
2. Is **`postgis`** present on dev/preview/prod RDS? Is `USE_IAM_AUTH` on in preview/prod?
3. **County parcel count** — unverified; confirm before assuming parcels are out of scope.
4. **LACDMH Service Areas** — no public polygon layer. Extract, ask DMH, or adopt SPAs?
5. **Licensing** for LA City GeoHub boundary layers (blank) and LA Times neighborhoods (none).
6. Does the **50 MiB upload cap** suffice for the largest dataset?
7. Do boundary layers stay **platform-shared** (`org_via = None`) — they must still pass
   `manage.py check`?
8. Is PostGIS available in **CI**?
