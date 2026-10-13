# Importing Esri Shapefiles and Related Geospatial Formats into the BetterAngels Django + PostGIS Backend

Research report — implementation methods, grounded in `/Users/paulvecchio/Development/BetterAngels/monorepo`, plus a recommended plan.

---

## 0. Executive summary

The repo is already a **GeoDjango-on-PostGIS** application, and the OS-level geospatial stack (GDAL/GEOS/PROJ) is **already installed in the container image**. There is **no shapefile import pipeline**, **no polygon geometry field**, and **no `geopandas`/`shapely`/`fiona`/`pyogrio`/`pandas` dependency**.

That combination drives the recommendation:

1. **Do not add `geopandas`.** The single biggest lever here is that `django.contrib.gis.gdal.DataSource` + `OGRGeometry` + PostGIS SQL gives you a complete shapefile→PostGIS pipeline with **zero new Python dependencies**, inside the existing strict `mypy`/`ruff` gates, and it is audit-aware (`pghistory`/`pgtrigger`) because writes go through the ORM or through SQL against model-managed tables.
2. **Always load into a `staging` schema first**, then validate/repair/reproject/simplify in SQL, then promote into model-managed tables. Never point `ogr2ogr -overwrite` at a Django-managed table.
3. **Run the job as a Celery task on a new dedicated `imports` queue** (the Terraform module already supports per-queue workers), with a `manage.py import_dataset` management command as the canonical entrypoint and an advisory lock for idempotency. Keep a **one-off ECS Fargate task** (mirroring the existing `migration_service`) as the escape hatch for large or exotic loads.
4. **Store canonical geometry as `MultiPolygonField(srid=4326)` (geometry, not geography)** and version imports via a `DatasetImport` header row + `is_current` swap, so re-import and rollback are cheap.

Two concrete, verified landmines found in the existing code that the implementation should account for:

- **`shelters/types/filters.py:196` `map_bounds` cannot use the geography GiST index.** Django's PostGIS backend maps `within` to `ST_Within` **without** the `geography=True` flag, so `PostGISOperator.check_geography()` appends `::geometry` to the left-hand side (`django/contrib/gis/db/backends/postgis/operations.py:98-101, 165`). The predicate becomes `ST_Within(geolocation::geometry, …)` — an expression, not the indexed column. Only `bboverlaps`, `coveredby`, `covers`, `intersects`, `dwithin` are geography-native. **For new polygon boundary tables use `geometry(MultiPolygon,4326)`** and use `covers`/`intersects` when joining against points.
- **There is no `CreateExtension("postgis")` migration anywhere.** Local dev gets PostGIS from `nickblah/postgis:17.5-bullseye-postgis-3.5`; production/preview use plain RDS `engine = "postgres"`, `engine_version = "17.9"`. Nothing in Terraform or migrations creates the extension. The extension must be confirmed (and, if missing, created by an `rds_superuser`) before any geometry DDL can apply.

---

## 1. Ground truth: what the repo actually is

### 1.1 Framework and language versions (verified)

| Item | Value | Source |
| --- | --- | --- |
| Python | `>=3.14,<3.15`; runtime `.python-version` = `3.14.7` | `monorepo/pyproject.toml`, `.python-version` |
| Django | **6.1** (`django-6.1.dist-info`, `uv.lock` line 566) | `apps/betterangels-backend/pyproject.toml` (`django>=6.1,<7`) |
| PostgreSQL driver | **psycopg 3.3.4** (`psycopg>=3.3.2,<4`) | `uv.lock` line 1726 |
| API layer | **Strawberry GraphQL Django** (`strawberry-graphql-django>=0.86.1`) + DRF | `pyproject.toml` |
| Task queue | **Celery 5.6** with `redis`/Valkey broker, `celery-redbeat` for beat | `pyproject.toml`, `betterangels_backend/celery.py` |
| WSGI server | gunicorn with **gevent** (`gunicorn[gevent]`), `gevent.monkey.patch_all()` | `pyproject.toml`, `manage.py:8-10` |
| Dependency manager | **uv workspace** — root `pyproject.toml` + member `apps/betterangels-backend` | `monorepo/pyproject.toml` |
| Lint/type gates | ruff (line-length 120, `E,F,B,I`), **strict mypy**: `disallow_untyped_defs`, `disallow_untyped_calls`, `check_untyped_defs`, `strict_optional`, `warn_return_any`; migrations excluded | `pyproject.toml`, `mypy.ini` |

### 1.2 Database

- **Engine:** a custom GeoDjango PostGIS backend, `common.backends.iam_dbauth.postgis`, which subclasses `django.contrib.gis.db.backends.postgis.base.DatabaseWrapper` and swaps the password for an **RDS IAM auth token** minted with boto3 when `USE_IAM_AUTH` is set (`apps/betterangels-backend/common/backends/iam_dbauth/postgis/base.py`). Configured in `betterangels_backend/settings.py:273`.
- `django.contrib.gis` **and** `django.contrib.postgres` are in `INSTALLED_APPS` (`settings.py:133-134`).
- **Local dev:** `nickblah/postgis:17.5-bullseye-postgis-3.5` (`docker-compose.yml:14`), Postgres 17 + **PostGIS 3.5**; tuned with `fsync=off`, `shared_buffers=512MB`, `work_mem=32MB`, `maintenance_work_mem=128MB`.
- **Cloud:** plain RDS PostgreSQL **17.9**, engine `postgres` (not Aurora), `family = postgres17`, `iam_database_authentication_enabled = true` (`infrastructure/modules/services/betterangels-backend/database.tf`).
- **Production sizing — this is the binding constraint:** `db.t4g.small` (2 vCPU, 2 GiB RAM), `allocated_storage = 100 GB`, `max_allocated_storage = 500 GB`, Multi-AZ, 7-day backup retention. Development: `db.t4g.small`, 20 GB → 100 GB. (`infrastructure/environments/{development,production}/us-west-2/ecs/services/betterangels-backend/terragrunt.hcl`.)
- **Extension status:** no `CreateExtension("postgis")` in any of the ~30 migrations (only `CreateExtension("pg_trgm")` in `tasks/migrations/0002_initial.py:27`). Local works because the PostGIS image pre-creates it. **RDS is unverified.**

> **Consequence:** this is a _small-data_ GIS problem. A dataset import must be sized in tens of MB and low hundreds of thousands of features, not "all LA County parcels". A per-import staging copy plus a GiST index must fit comfortably inside a 2 GiB instance.

### 1.3 Geospatial surface area today

Geometry fields (all point-only, all geography):

| Model | Field | Definition |
| --- | --- | --- |
| `shelters.Shelter` | `geolocation` | `PointField(srid=4326, geography=True, blank=True, null=True)` — `shelters/models/shelter.py:81` |
| `clients.ClientProfile` | `residence_geolocation` | `PointField(srid=4326, geography=True, blank=True, null=True)` — `clients/models.py:134` |
| `hmis.*` | `residence_geolocation` | same shape (2 models) — `hmis/migrations/0001_initial.py:73,135` |
| `common.Location` | `point` | `PointField(geography=True)` — `common/models.py:231` |

There are **no `PolygonField` / `MultiPolygonField` / `GeometryField` columns, no `GistIndex`, and no `CreateExtension`** anywhere.

**Existing spatial query patterns** (`shelters/types/filters.py`) — these are what a boundary import would extend:

```python
# bbox prefilter used by the map view (line ~196) — see the index caveat in §0
polygon = Polygon.from_bbox((west_lng, north_lat, east_lng, south_lat))
return queryset.filter(geolocation__within=polygon), Q()

# radius search (line ~218) — geography-native, index-friendly
queryset = queryset.annotate(distance=Distance("geolocation", reference_point)).order_by("distance")
queryset = queryset.filter(geolocation__dwithin=(reference_point, D(mi=value.range_in_miles)))
```

**A concrete in-repo consumer already waiting for boundary data:** `shelters.Shelter` carries `city_council_district` (choices `0-15`, `db_index=True`) and `supervisorial_district` (choices `1-5`), currently **plain `PositiveSmallIntegerField`s hand-keyed in admin** (`shelters/enums.py:122-123`, `shelters/migrations/0001_initial.py:376-377`). City of LA council districts and LA County supervisorial districts are exactly the kind of polygon layer that arrives as a shapefile, and deriving these fields with a `ST_Covers` join is the highest-value first use case.

### 1.4 Job-execution infrastructure (AWS, us-west-2)

Terragrunt/Terraform at `/Users/paulvecchio/Development/BetterAngels/infrastructure`. ECS Fargate module: `infrastructure/modules/services/betterangels-backend/ecs.tf`.

| Workload | Command | CPU / RAM | Notes |
| --- | --- | --- | --- |
| `web_service` | gunicorn (gevent) | `web_server_config` (default 1024 / 2048) | autoscaled; `enable_execute_command = true` |
| `celery_worker` | `celery -A betterangels_backend worker -l INFO` | default **1024 / 2048**, `autoscaling_min_capacity = max = 1` | `for_each = var.celery_worker_config` — **a map keyed by queue name**; non-default keys get `-Q <key>` |
| `celerybeat` | `celery … beat -S redbeat.RedBeatScheduler` | module default | schedules defined in `betterangels_backend/celery.py` |
| `migration_service` | `python manage.py migrate` | 1024 / 2048, `desired_count = 0` | one-off task started by the `start_migration_task` Lambda → `ecs.run_task`; polled by `poll_migration_task` |

The `celery_worker_config` variable is a **map**, so adding a second worker for a new queue is a pure config change:

```hcl
celery_worker_config = {
  default = { cpu = 1024, memory = 2048, autoscaling_min_capacity = 1, autoscaling_max_capacity = 1, ... }
  imports = { cpu = 2048, memory = 4096, autoscaling_min_capacity = 0, autoscaling_max_capacity = 1, ... }
}
```

Other infra: ElastiCache **Valkey 8.0** (`cache.t4g.small`), S3 + CloudFront, CodePipeline (build → image → `start_migration_task`), ECR, CloudWatch alarms on RDS CPU/IOPS/disk-queue/free-memory/free-storage. There is **no Lambda with GDAL today**; the only Lambda (`imgproxy`) is a container-image Lambda deployed by `modules/code-pipelines/lambda-container-deploy`.

### 1.5 Existing import and upload patterns to follow

**a) Bulk attribute import/export — `django-import-export` 4.4.** Already wired into the admin for `Shelter` (`ImportExportModelAdmin`, `ShelterResource` — `shelters/admin.py:606,950,1151`), `ClientProfile`, `ClientDocument`, `Note`. This is attribute-only (CSV/XLSX); it is the house style for "let an admin upload a file and map columns", and it establishes that **admin-driven import UX is an accepted pattern here**.

**b) Large-file upload — presigned S3 + `admin_async_upload`.** `settings.py:100-116` documents that uploads go **client → S3 directly** via presigned POST, so Django never buffers the bytes; `DATA_UPLOAD_MAX_MEMORY_SIZE`/`FILE_UPLOAD_MAX_MEMORY_SIZE` stay at 2.5 MB. Per-domain caps default to 50 MiB (`S3_DEFAULT_PRESIGNED_MAX_FILE_SIZE`, `SHELTER_PHOTO_MAX_FILE_SIZE`, `NOTE_ATTACHMENT_MAX_FILE_SIZE`, `CLIENT_DOCUMENT_MAX_FILE_SIZE`), and there is a resumable-upload endpoint at `/upload/` (`betterangels_backend/urls.py:50`). The org maintains a **fork** of `django-admin-async-upload` pinned by git rev (`pyproject.toml:61`) providing `AsyncFileField` (used on `shelters.models.media.ShelterPhoto.file`). Design guidance lives in `docs/presigned-upload-pipeline.md`.

> A shapefile bundle is a **multi-file artifact**, so the natural upload unit is a single `.zip` and the natural home for it is S3 via this existing pipeline. No new upload mechanism is needed.

**c) External data import outside the app — `outreact-data-import`.** A standalone Python project (`/Users/paulvecchio/Development/BetterAngels/outreact-data-import`) that imports SELAH CSV/XLSX exports by **calling the GraphQL API through `data_import/common/graphql_client.py`**, one script per entity, with per-run logging (`data_import/config/logging.py`), idempotent re-runs, and a merge/dedupe step. Lesson: the org's precedent for "get external data in" is a **script + API**, not raw SQL. For geometry that breaks down (GraphQL has no geometry scalar — see below), so a service module + management command is the right analogue.

**d) Long-running job conventions.** `common/celery.py` provides `single_instance(...)`, a Redis-lock Celery decorator that re-queues with a `countdown` and raises `Ignore()` when the lock is held. `reports/tasks.py` shows the house style: a dispatcher task on a beat schedule that fans out per-entity tasks (`process_scheduled_reports` → `send_scheduled_report.delay(...)`).

### 1.6 Conventions a new implementation must satisfy

- **Multi-tenancy / authorization:** ADR 0001 grant-based authorization (`docs/adr/0001-grant-based-authorization.md`) is enforced by abstract `OrgScoped` with `org_via` (`common/models.py:44-130`) and by **Django system checks** in `common/permissions/checks.py` (a model that isn't org-reachable, or that declares a write tier while org-anchored, fails `manage.py check`). `org_via = None` for platform-shared reference data is established practice (`clients/models.py:171`). `common/checks.py` adds `common.E001` (no DB field named `perms`).
- **Audit:** `pghistory.track(InsertEvent/UpdateEvent/DeleteEvent)` on ~20 models, backed by `pgtrigger` triggers; `pghistory.middleware.HistoryMiddleware` in `MIDDLEWARE`.
- **Base models:** `common.models.BaseModel` gives `created_at`/`updated_at`; `class perms(PermissionSet)` for custom permissions.
- **Typing:** strict mypy applies to all backend code except migrations.
- **Config:** `django-environ` with explicit typed defaults in `settings.py:24-100`; new settings must be declared there and added to `.env`.

### 1.7 Gaps and things I could not determine

1. **Is the `postgis` extension actually installed on development / preview / production RDS?** No Terraform, no migration, no parameter-group evidence either way. Must be checked with `SELECT extversion FROM pg_extension WHERE extname='postgis';`.
2. **Exact GEOS/PROJ versions inside the built image.** The Dockerfile installs `gdal-bin` on `python:3.14.7-trixie` (`Dockerfile:127`); Debian trixie ships **gdal-bin 3.10.3 / libgdal36** ([packages.debian.org](https://packages.debian.org/trixie/gdal-bin)), and libgdal pulls GEOS ~3.13 and PROJ 9.x. Django 6.1 GeoDjango supports **GEOS 3.10–3.14, GDAL 3.3–3.13, PROJ 6–9, PostGIS 3.2–3.6** ([GeoDjango geo libraries](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/install/geolibs/)), so trixie's stack is inside the supported window — but I could not run the image to confirm resolved versions, and I cannot query the running RDS.
3. **Whether `proj-data` (NADCON grids) is present.** Not installed by the Dockerfile. This matters for EPSG:2229↔4326 accuracy — see §2.7.
4. **The actual datasets in scope** (LA County eGIS, City of LA, HUD, census TIGER, etc.), their CRS, size, and update cadence. Nothing in the repo names them.
5. **Whether `USE_IAM_AUTH` is enabled in preview/production.** It is an env var; the IAM-token backend is only active when set. This determines whether CLI-based tools (§2.2) need to mint a token themselves.
6. **macOS host has no GDAL at all** (`gdalinfo`, `ogrinfo`, `ogr2ogr`, `shp2pgsql` all absent; only `psql` from libpq@17). All CLI-based work must run inside the devcontainer or a Fargate task.
7. **GraphQL has no geometry type.** `apps/betterangels-backend/schema.graphql` exposes only `latitude`/`longitude` floats (lines 1033-1034, 2600-2607). Serving boundaries to the frontend needs a new scalar/type (e.g. GeoJSON `JSON`).
8. **No ADR or spec for a "dataset/boundary" feature exists** in `docs/adr/` (only 0001/0002/0003, all about authorization and client writes).

---

## 2. Implementation methods compared

### 2.1 `ogrinfo` / `ogr2ogr` (GDAL CLI) — the standard approach

**What it is.** `ogrinfo` / `ogr2ogr` are GDAL's vector utilities. `ogrinfo` inspects a datasource; `ogr2ogr` converts between ~90 vector formats and can write directly into PostGIS via the `PostgreSQL` driver (same code path as the PostGIS driver in GDAL). GDAL is **already present** in the container via `gdal-bin` (`Dockerfile:127`).

**The multi-file bundle.** An Esri shapefile is not a file, it is up to ~7 siblings that must share a basename in one directory:

| Member | Required? | What GDAL does with it |
| --- | --- | --- |
| `.shp` | yes | geometry + feature order |
| `.shx` | effectively yes | fixed-width record index; enables random access (`-fid`, bbox seeks) |
| `.dbf` | yes for attributes | the attribute table |
| `.prj` | no, but **critical** | CRS as ESRI-flavored WKT → GDAL maps it to an EPSG code or a user-defined CRS |
| `.cpg` | no | DBF code page. Absent ⇒ GDAL assumes ISO-8859-1/`SHAPE_ENCODING` ⇒ mojibake in `NAME`-type fields |
| `.sbn`/`.sbx` | no | Esri spatial index; ignorable |
| `.xml`, `.qix`, `.aih/.ain` | no | metadata / MapServer / attribute index; ignorable |

Rules that matter operationally:

- **Never separate or rename members inconsistently.** GDAL locates siblings by `<basename>.<ext>` next to the `.shp`.
- Distribute as a **single zip** and let GDAL walk it with the virtual filesystem: `/vsizip/path/to/bundle.zip` (first dataset found) or `/vsizip/path/to/bundle.zip/subdir/name.shp` (explicit, required when the zip holds more than one dataset). Zips must be unencrypted.
- For S3: `/vsis3/bucket/key.shp` and `/vsizip//vsis3/bucket/key.zip` ([GDAL virtual file systems](https://gdal.org/en/stable/user/virtual_file_systems.html)). **Gotcha:** GDAL's `/vsis3` uses libcurl and reads credentials from `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN` env vars or `~/.aws/*` — it does **not** read the ECS container-credentials endpoint. Mint credentials with boto3 (already a dependency) and export them before the GDAL call, or download to a temp file first.

**Step 1 — inspect (always do this first).**

```bash
# layer inventory: feature count, geometry type, SRS, extent, field types
ogrinfo -so -al /vsizip/./la-city-council-districts.zip
# or an explicit member
ogrinfo -so -al /vsizip/./la-city-council-districts.zip/CouncilDistricts.shp
# confirm the CRS resolves to an EPSG code (not "unknown")
gdalsrsinfo /vsizip/./x.zip/x.shp | head -30
# peek at rows / test a filter
ogrinfo -al -where "DISTRICT = 5" -limit 1 /vsizip/./x.zip/x.shp
```

**Step 2a — straight into a staging table in PostGIS.**

```bash
export PGPASSWORD=...           # or an IAM token; see the IAM note below

ogr2ogr \
  -f PostgreSQL \
  "PG:host=$POSTGRES_HOST port=5432 dbname=$POSTGRES_NAME user=$POSTGRES_USER password=$PGPASSWORD" \
  /vsizip/./la-city-council-districts.zip \
  -nln staging.imp_council_districts \
  -nlt PROMOTE_TO_MULTI \
  -s_srs EPSG:2229 -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom \
  -lco FID=source_fid \
  -lco PRECISION=NO \
  -lco SPATIAL_INDEX=NONE \
  -lco UNLOGGED=ON \
  --config PG_USE_COPY YES \
  -gt 50000 \
  -progress
```

Flag notes, all from the [ogr2ogr reference](https://gdal.org/en/stable/programs/ogr2ogr.html) and the [GDAL PostgreSQL driver](https://gdal.org/en/stable/drivers/vector/pg.html):

- `-f PostgreSQL` — the driver's short name (`-of`/`-f` are aliases).
- `-nln <name>` — rename the destination layer. Qualified names (`staging.imp_x`) are split into schema+table because `EXTRACT_SCHEMA_FROM_LAYER_NAME` defaults to `YES`. Prefer `-nln` over `-lco SCHEMA=`, because the docs explicitly state `-overwrite` + `-lco SCHEMA` does not work together.
- `-nlt PROMOTE_TO_MULTI` — **essential for shapefiles.** Shapefiles have no Polygon/MultiPolygon distinction; a single-part layer silently becomes `MULTIPOLYGON` and a mixed layer fails the destination's strict type check without this. `CONVERT_TO_LINEAR` (GDAL ≥3.0.5 also allows both at once) handles curve types.
- `-s_srs` / `-t_srs` — **if the `.prj` is missing and you omit `-s_srs`, reprojection is a silent no-op** and you write projected coordinates into a 4326 column. `-t_srs` also *assigns* the output SRS.
- `-lco GEOMETRY_NAME=geom` — default is `wkb_geometry`, which will not match a Django `MultiPolygonField` column name.
- `-lco FID=source_fid` — default PK is `ogc_fid`. For a staging table this preserves the source FID for provenance; for a model-managed table you want Django's `id`.
- `-lco PRECISION=NO` — skip `NUMERIC(w,p)`/`CHAR(w)` in favour of `float8`/`varchar`, avoiding shapefile width surprises.
- `-lco SPATIAL_INDEX=NONE` — **important**: build the GiST index *after* the bulk load, never incrementally. (Default is `GIST`; also supports `SPGIST` and `BRIN`.)
- `-lco UNLOGGED=ON` — faster staging load, no WAL; fine because staging is disposable.
- `--config PG_USE_COPY YES` — uses `COPY` instead of per-row `INSERT`. Per the driver docs, `COPY` is the default for a freshly created table but only for `-append` when this is set. Combined with `-gt 50000` (features per transaction; default 100 000) this is the difference between minutes and hours. Caveat from the docs: not usable behind PgBouncer, and falls back to `INSERT` when a source column has a `DEFAULT` and the feature has no value.
- `-append` / `-update` / `-overwrite` / `-upsert` — `-append` implies `-update`. `-overwrite` **deletes and recreates the layer** → never aim it at an ORM table. `-upsert` (GDAL ≥3.6) exists but is only implemented for GPKG/Elasticsearch/MongoDB, **not** PostgreSQL.
- `-makevalid` (GDAL ≥3.1, needs GEOS) / `-skipinvalid` (GDAL ≥3.10) — in-transit geometry repair; trixie's GDAL 3.10.3 supports both.
- `-simplify <tol>` — calls `OGRGeometry::SimplifyPreserveTopology()`; **the tolerance is in source georeferenced units** and is applied *before* `-t_srs`.
- `-explodecollections`, `-select`, `-where`, `-sql`, `-spat`, `-clipsrc`/`-clipdst`, `-skipfailures` (forces `-gt 1` → "severe slowdown"), `-progress` (needs a driver that reports feature count).
- `--config OGR_TRUNCATE YES` — truncate an existing table instead of dropping it; avoids destroying views/grants. Useful alternative to `-overwrite` where the table must survive.

**Step 2b — via GeoPackage (or GeoJSON) first.**

```bash
# Shapefile -> GeoPackage (single file, deterministic, CRS embedded, indexable, inspectable)
ogr2ogr -f GPKG /tmp/work.gpkg /vsizip/./la-city-council-districts.zip \
  -nln council_districts \
  -nlt PROMOTE_TO_MULTI \
  -s_srs EPSG:2229 -t_srs EPSG:4326 \
  -makevalid \
  -lco SPATIAL_INDEX=YES

# Shapefile -> GeoJSON (human-diffable; loses type fidelity and is 3-6x bigger)
ogr2ogr -f GeoJSON /tmp/work.geojson /vsizip/./x.zip/x.shp -t_srs EPSG:4326 -lco RFC7946=YES

# then load the intermediate
ogrinfo -so -al /tmp/work.gpkg
ogr2ogr -f PostgreSQL "PG:..." /tmp/work.gpkg council_districts \
  -nln staging.imp_council_districts -lco SPATIAL_INDEX=NONE --config PG_USE_COPY YES
```

Why the intermediate is worth it even though it doubles the I/O: the file is a **single checksummable artifact** (so re-imports are byte-identical and diffs are meaningful), it preserves CRS/field types explicitly instead of re-deriving them from a 1990s DBF, it lets you `ogrinfo`/`sqlite3` the result without touching the DB, and it decouples "parse the source format" from "load the database" so a GDAL bug in the zip reader cannot corrupt a live load. GeoPackage is the better intermediate (typed columns, spatial index, CRS table); GeoJSON is only worth it when a human needs to diff or when a downstream JS tool consumes it.

**IAM-auth friction (repo-specific).** The app mints its RDS password with `boto3.client("rds").generate_db_auth_token(...)` in a Django `DatabaseWrapper` (`common/backends/iam_dbauth/postgis/base.py`). **`ogr2ogr`/`shp2pgsql`/`psql` know nothing about that.** Any CLI path must mint the token in the shell first:

```bash
export PGPASSWORD="$(python -c '
import boto3, os
print(boto3.client("rds", region_name=os.environ["AWS_REGION"]).generate_db_auth_token(
    DBHostname=os.environ["POSTGRES_HOST"],
    Port=5432,
    DBUsername=os.environ["POSTGRES_USER"],
    Region=os.environ["AWS_REGION"]))')"
```

Every CLI invocation is then bound to a 15-minute token, needs `psql`/`libpq` plus the `postgis` client binaries in the image, and needs network reachability from outside the VPC. This is a genuine, non-obvious cost of the CLI route in this repo. (RDS is in private subnets — `aws ecs execute-command` into the web task, or a one-off Fargate task, is the only sane place to run it.)

**Pros**
- The tool of record; handles every format, including `.gdb`, KML, GeoJSON, GML, WFS, and `/vsizip`//`/vsis3`.
- Fastest bulk path: `COPY`-based, `-gt` batching, post-load index, unlogged staging.
- Best-in-class reprojection, geometry repair (`-makevalid`), simplification, and clipping — all streaming with constant memory.
- Zero Python dependencies; the binary is already in the image.
- `ogrinfo -so -al` is the fastest way to answer "what is actually in this file?".

**Cons**
- **Bypasses the ORM entirely**: no `auto_now_add`, no model validation, no permission checks, no `pghistory` context label; `-overwrite` on a model table destroys Django's columns and triggers.
- Foreign-process invocation: subprocess, exit codes, stdout/stderr parsing, no shared transaction with Django, credentials to manage, no retries/telemetry for free.
- The IAM-token gap above.
- `-progress` output is unstructured; wiring it into `DatasetImport.qa_report` means parsing text.
- GDAL-version-sensitive behaviour (e.g. the Arrow-API rewrite in GDAL 3.8 caused regressions fixed by 3.9; the escape hatch is `--config OGR2OGR_USE_ARROW_API NO`).
- `/vsis3` does not use the ECS task role.

**Right choice when:** ingesting an unfamiliar format, a one-off/bulk backfill, a file too big for the in-process path, or when you need GDAL's repair/simplify/clip features without reimplementing them. In this repo: the escape hatch and the discovery tool, not the default path.

---

### 2.2 `shp2pgsql` (PostGIS CLI)

**What it is.** The PostGIS loader. It reads a shapefile with shapelib and emits SQL (or a `COPY` dump) on stdout, which you pipe to `psql`. Documented in the [PostGIS manual, "Loading Spatial Data"](https://postgis.net/docs/manual-3.5/using_postgis_dbmanagement.html#loading-data) and the [shp2pgsql(1) man page](https://manpages.debian.org/trixie/postgis/shp2pgsql.1.en.html).

```bash
# create + load + spatial index, reprojecting 2229 -> 4326, dump format
shp2pgsql -s 2229:4326 -D -I -W LATIN1 -N skip -g geom \
  ./CouncilDistricts.shp staging.imp_council_districts \
  | psql "host=$POSTGRES_HOST dbname=$POSTGRES_NAME user=$POSTGRES_USER"

# append a second shapefile with identical attributes
shp2pgsql -a -s 2229:4326 -D ./More.shp staging.imp_council_districts | psql "$DSN"

# DDL only, data later (two-phase)
shp2pgsql -p -s 2229 ./x.shp staging.x > schema.sql

# drop-and-recreate
shp2pgsql -d -s 2229 ./x.shp staging.x | psql "$DSN"
```

Flags (from the man page):

| Flag | Meaning |
| --- | --- |
| `-c` | create new table and populate (default) |
| `-a` | append into an existing table; **all files must share attributes and data types** |
| `-d` | drop the table, then create and populate |
| `-p` | DDL only, no data |
| `-D` | PostgreSQL **dump** (COPY) format — much faster for large data |
| `-s [FROM:]TO` | target SRID; with `FROM:` it reprojects. **Cannot be combined with `-D`.** |
| `-I` | create a GiST index on the geometry column |
| `-g <col>` | geometry column name (default `geom` in 3.x; `geo_value` in the ancient man page) |
| `-G` | use `geography` instead of `geometry` (4326 only) |
| `-S` | emit simple geometries; shapefiles don't distinguish LINESTRING/MULTILINESTRING, so this yields `LINESTRING`/`POLYGON` — **it fails when it hits a real multi-part feature** |
| `-w` | WKT output instead of WKB — **loses coordinate precision** |
| `-e` | one statement per transaction (load the good rows past bad geometries); incompatible with `-D` |
| `-W <enc>` | shapefile attribute encoding; output is re-encoded to UTF-8 |
| `-k` | keep identifier case (shapefile attributes are usually UPPERCASE) |
| `-i` | force 32-bit integers instead of 64-bit bigints |
| `-N <insert\|skip\|abort>` | NULL-geometry policy |
| `-m <file>` | map long column names to 10-char DBF names |
| `-T`/`-X` | tablespace for table / indexes |

**Limitations that matter**

- **Shapefile only.** No GeoPackage, GeoJSON, FileGDB, KML, WFS. If the org ever gets a `.gdb` or a GeoJSON export, this tool is useless and you're back to GDAL.
- **No attribute/geometry filtering**: no `-sql`, no `-where`, no `-select`, no `-spat`, no explode, no make-valid, no simplify. Anything conditional has to happen in SQL afterwards.
- **Sql↔text round-trip.** All data is serialized to SQL text on stdout and re-parsed by `psql`. That's extra CPU, extra bytes over the socket (WKB is hex-encoded unless `-D`), and a second place where encoding can go wrong. With `-D` this is COPY-format and much cheaper, but then you lose `-s FROM:` reprojection and `-e` per-row error isolation.
- **`-s FROM:TO` + `-D` is mutually exclusive**, so you must choose between fast load and in-transit reprojection (reproject in SQL after the load instead).
- **`-S` is a trap**: it looks like the fix for the Polygon/MultiPolygon mismatch, but it errors out on genuinely multi-part features — strictly worse than GDAL's `-nlt PROMOTE_TO_MULTI`.
- **No layer-creation control**: no `SCHEMA=` (use `schema.table`), no `PRECISION=`, no `UNLOGGED=`, no `FID=` naming, no `OVERWRITE=`.
- **Needs `shp2pgsql` in the image** (the `postgis` client package) — currently *not* installed (`Dockerfile` installs `gdal-bin` and `postgresql-client-16`, not `postgis`).
- Same IAM-token and VPC-reachability friction as `ogr2ogr`.
- `ST_Transform` accuracy still depends on the PROJ build and datum grids.

**Pros**
- Tiny, purpose-built, extremely simple to reason about; one shell pipeline.
- `-D -I` is genuinely fast for a straight shapefile→PostGIS load.
- Reproducible one-liner that a DBA can read and audit.
- No Python GDAL binding required.

**Cons**
- Narrow and feature-poor vs. GDAL; format-locked to shapefiles.
- Text round-trip; exclusive `-s`/`-D`; `-S` footgun; imprecise `-w`.
- Doesn't solve provenance, validation, idempotency, or orchestration — every one of those is still your problem.
- Requires adding a package to the image.

**Right choice when:** a single, well-formed shapefile needs to land in PostGIS *right now* and nothing else. **Not** the right foundation for a repeatable, versioned, app-integrated pipeline in this repo — GDAL subsumes it and adds the features you will need on the second dataset.

---

### 2.3 Python in-process options

#### 2.3.1 GeoDjango's own GDAL/GEOS interfaces — `DataSource`, `OGRGeometry`, `LayerMapping`

**What it is.** GeoDjango binds GDAL's OGR layer and GEOS directly ([GDAL/OGR inspection](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/gdal/), [LayerMapping](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/layermapping/)). **No additional Python package is needed** — `django.contrib.gis` is already installed and `libgdal`/`libgeos`/`libproj` are already in the image via `gdal-bin`.

**Inventory a source without shelling out:**

```python
from django.contrib.gis.gdal import DataSource

ds = DataSource("/vsizip//vsis3/betterangels-prod-media/datasets/council.zip/CouncilDistricts.shp")
layer = ds[0]
print(layer.srs)          # SpatialReference (WKT); .srs.srid gives the EPSG code
print(layer.geom_type)    # 'Polygon' | 'MultiPolygon' | ...
print(len(layer))         # feature count
print(layer.fields)       # ['DISTRICT', 'NAME', ...]
print(layer.extent)       # (xmin, ymin, xmax, ymax) in layer SRS
for feat in layer[:2]:
    print(feat.fid, feat.get("DISTRICT"), feat.geom.geos.ewkt[:80])
```

**Streaming ingest with constant memory, geometry math delegated to PostGIS:**

```python
import hashlib
from django.contrib.gis.gdal import DataSource
from django.db import connection

def stream_into_staging(source: str, staging_table: str, layer_index: int = 0) -> int:
    """Copy features into staging.<table>(source_fid, name, props, geom_hex) via COPY."""
    ds = DataSource(source)
    layer = ds[layer_index]
    rows = 0
    with connection.cursor() as cur:
        cur.execute(f"TRUNCATE staging.{staging_table}")
        with cur.copy(
            f"COPY staging.{staging_table} (source_fid, name, props, geom_hex) FROM STDIN"
        ) as copy:
            for feat in layer:
                ogr_geom = feat.geom
                if ogr_geom is None or ogr_geom.empty:
                    continue
                geos = ogr_geom.geos          # OGRGeometry -> GEOSGeometry (declares SRID)
                if geos.srid in (None, 0):
                    geos.srid = layer.srs.srid or 0
                # EWKB carries the SRID flag, so SRID survives the text hop
                copy.write_row((feat.fid, feat.get("NAME") or "", None, geos.ewkb.hex()))
                rows += 1
    return rows
```

> Keeping geometry as **EWKB hex text** through `COPY` and converting inside Postgres (`ST_GeomFromEWKB(decode(geom_hex,'hex'))`) sidesteps the psycopg3 geometry-dumper question entirely and puts all geometry math where it is fastest and most auditable — in PostGIS. It also means the promote step is one SQL statement (§2.4).

**`LayerMapping` for the small, simple, 1:1 case:**

```python
from django.contrib.gis.utils import LayerMapping
from datasets.models import DatasetFeature

mapping = {"name": "NAME", "geom": "MULTIPOLYGON"}   # geometry keys are OGC type names
lm = LayerMapping(
    DatasetFeature,
    "/vsizip/./council.zip/CouncilDistricts.shp",
    mapping,
    layer=0,
    source_srs=2229,          # required when .prj is missing
    encoding="latin-1",       # DBF codepage when .cpg is absent
    transaction_mode="autocommit",
    transform=True,           # reprojects into the model field's SRID on save
)
lm.save(verbose=False, progress=5000, step=2000, strict=False)
```

`LayerMapping` arguments/keywords: `model`, `data_source`, `mapping`, `layer=0`, `source_srs=None`, `encoding=None`, `transaction_mode='commit_on_success'`, `transform=True`, `unique=True`, `using='default'`; `save(verbose, fid_range, step, progress, silent, stream, strict)`. `unique=` forces `autocommit` and does per-row lookups.

**Memory behaviour.** Iterating `for feat in layer` is **streaming and constant-memory** — GDAL reads one feature at a time; the only per-feature allocations are the OGR and GEOS objects, freed each iteration. Two caveats:
- **`DEBUG=True` makes Django log every SQL statement, including geometries**, which the Django docs call out explicitly as an out-of-memory cause for `LayerMapping` ("GIS data sources, like shapefiles, may be very large. If you find that LayerMapping is using too much memory, set DEBUG to False"). Import jobs must run with `DEBUG=False`.
- `LayerMapping.save()` with the default `commit_on_success` holds **one long transaction** and issues **one INSERT per feature** (plus M2M work). It is correct and simple but its throughput is per-row round-trips — expect minutes, not seconds, past ~50k features.

**Web request vs. background job.** Background job / management command only. Beyond the duration, gunicorn here is `gunicorn[gevent]` with `gevent.monkey.patch_all()` (`manage.py:8-10`), so a CPU-bound GDAL parse loop inside a request handler **starves the greenlet hub** and blocks every concurrent request on that worker.

**Pros**
- **Zero new dependencies.** The one property no other Python option has in this repo.
- Same GDAL correctness benefits as the CLI (all formats, `/vsizip`, `/vsis3`, reprojection) but in-process: real exceptions, real logging, unit-testable, no subprocess.
- Writes through the same connection/transaction/ORM as the rest of the app, so `pghistory`/`pgtrigger`, `auto_now_add`, and model validation all apply naturally.
- Mypy-clean (the GeoDjango stubs are already in the tree).
- `LayerMapping` gets you a working import in ~15 lines for simple cases.

**Cons**
- Per-feature Python overhead — slower than `ogr2ogr --config PG_USE_COPY` or pyogrio's Arrow path by a factor of 2–10 on large files.
- Hand-rolled plumbing for staging, batching, QA, and promotion (though §2.4 shows it's one SQL statement).
- `DataSource` can't do attribute filtering or SQL push-down; you filter in Python or in SQL after the load.
- Long transactions if you're careless (`atomic` around the whole import holds locks and blows up WAL).
- `LayerMapping`'s `unique=` path forces autocommit and does per-row `get_or_create` → very slow.

**Right choice here: yes — this is the default path.** It is free in this repo and it keeps the import inside the ORM/audit/permission envelope the codebase already enforces.

#### 2.3.2 `geopandas` + `GeoDataFrame.to_postgis`

**What it is.** pandas-with-geometry. `to_postgis(name, con, schema=None, if_exists='fail', index=False, index_label=None, chunksize=None, dtype=None)` requires **SQLAlchemy + GeoAlchemy2 + a psycopg driver** ([geopandas docs](https://geopandas.org/en/stable/docs/reference/api/geopandas.GeoDataFrame.to_postgis.html)); `if_exists` ∈ `{fail, replace, append}`.

```python
import geopandas as gpd
from sqlalchemy import create_engine

gdf = gpd.read_file("/vsizip/./council.zip")        # pyogrio engine by default since 1.0
gdf = gdf.to_crs(4326)
gdf["geometry"] = gdf.geometry.make_valid()          # shapely 2.x
gdf["NAME"] = gdf["NAME"].str.strip()

engine = create_engine(f"postgresql+psycopg://{user}:{pw}@{host}:5432/{db}")
gdf.to_postgis(
    "imp_council_districts",
    engine,
    schema="staging",
    if_exists="replace",
    index=False,
    chunksize=1000,
)
```

**Pros**
- By far the fastest path from "file" to "explorable dataframe"; excellent for QA, joins, `dissolve`, `overlay`, `clip`, and ad-hoc analysis.
- `to_crs`, `make_valid`, `explode`, `set_precision` are one-liners.
- `chunksize` batches the write.

**Cons — and they are decisive for this repo**
- **Four heavy new runtime dependencies** (`geopandas`, `pandas`, `shapely`, `pyogrio` or `fiona`, plus `sqlalchemy` + `geoalchemy2` for `to_postgis`). None of them exist today (`openpyxl` is present; pandas is not). This inflates the single image that serves web *and* Celery.
- **Two GDALs in one process.** pyogrio/fiona wheels bundle their own GDAL/GEOS/PROJ; the system already has libgdal 3.10.3. Version skew here is a classic source of `proj_create_from_database` / `PROJ: proj.db` errors. If you add it, prefer an install linked against the system GDAL or pin pyogrio to match.
- **Poor typing.** pandas/geopandas typing is partial; this codebase runs **strict mypy with `disallow_untyped_defs`/`disallow_untyped_calls`**, so a geopandas-based service module will need `# type: ignore` scaffolding that the project's style deliberately avoids.
- **`to_postgis` bypasses the ORM.** No `auto_now_add`, no model validation, no org-scoping hooks, no pghistory *context*. DB-level `pgtrigger`/`pghistory` triggers still fire (they're on the table), but you get unaudited bulk churn unless you're careful.
- **`if_exists="replace"` DROPS the table** — it would destroy Django-managed columns, constraints, and triggers. Only ever safe against a table geopandas itself owns. `"append"` requires the existing schema to match exactly.
- **Memory: `read_file` by default reads every feature into RAM**, at roughly 5–10× the on-disk geometry size once you count pandas overhead, shapely objects, and the WKB cache. `chunksize` in `to_postgis` batches only the **write**; it does not bound the read. A 200 MB shapefile can trivially exceed 2 GiB — which is exactly the Celery task's memory limit. Chunked reads require `read_file(rows=...)` or pyogrio's `skip_features`/`max_features`.

**Right choice when:** an analyst needs to explore a file, or you need heavy geoprocessing (`overlay`, `sjoin`, `dissolve`) that PostGIS would be awkward for — and it runs **outside** the deployed image (a scratch venv, a notebook, or a dedicated analysis container writing only to `staging`). **Not** the right choice as a dependency of the shipped backend.

#### 2.3.3 `pyogrio`

**What it is.** A thin, vectorized (Arrow) Python binding over GDAL's vector API; the default read/write engine for geopandas ≥1.0 ([pyogrio introduction](https://pyogrio.readthedocs.io/en/latest/introduction.html)). Key API: `list_drivers()`, `list_layers()`, `read_info()`, `read_dataframe()`, `read_bounds()`, `write_dataframe()`.

```python
from pyogrio import read_info, read_dataframe, read_bounds, set_gdal_config_options

set_gdal_config_options({"SHAPE_ENCODING": "ISO-8859-1"})
info = read_info("/vsizip/./council.zip")      # crs, driver, encoding, fields, dtypes, geometry_type, features
fids, bounds = read_bounds("/vsizip/./council.zip")   # 2-3x faster than reading geometry; no geometry in RAM

for start in range(0, info["features"], 50_000):
    df = read_dataframe(
        "/vsizip/./council.zip",
        skip_features=start,
        max_features=50_000,
        columns=["DISTRICT", "NAME"],
        bbox=(-118.7, 33.7, -118.1, 34.4),
        force_2d=True,
    )
    ...
```

**Pros**
- Much faster than fiona; Arrow-native.
- **`read_bounds()` builds a spatial index without materializing geometries** — the memory-safe primitive for large files.
- First-class `/vsizip/`, `zip://`, `/vsis3/`, `s3://`, `https://` support (including `zip+s3://bucket/file.zip`), so no manual download/unzip step.
- `columns`/`where`/`bbox`/`mask`/`skip_features`/`max_features` give real push-down where the format supports it, and `use_arrow=False` reverts to streaming OGR batches.

**Cons**
- Notes in its own docs that `skip_features`/`max_features` incur overhead under Arrow (all preceding features may be read and discarded).
- Still a new C dependency (bundled GDAL — same dual-GDAL concern); no ORM awareness; mypy typing is thin.
- `to_postgis`-style convenience is absent — you'd still write your own COPY/UPSERT.

**Right choice when:** you need bulk read throughput and are willing to add a dependency, or you want the memory-safe `read_bounds` pattern for very large files. It's the best of the Python readers; it is still an extra dependency this repo does not currently need at its data scale.

#### 2.3.4 `fiona`

**What it is.** The long-standing Python GDAL/OGR wrapper, `fiona.open()` returning an iterator of feature mappings. **Geopandas 1.0+ moved its default engine to pyogrio**, and fiona's own migration guide documents the shift. It requires GDAL at build time (wheels bundle it).

**Pros:** mature; ergonomic attribute/geometry access; streaming iteration is memory-safe; `fiona.model` objects are typed reasonably.

**Cons:** slower than pyogrio (per-feature Python objects, no Arrow); in maintenance mode as geopandas' default; no advantage over `django.contrib.gis.gdal.DataSource` for this repo's purposes, while adding a dependency and a second GDAL.

**Right choice when:** you inherit code that already uses it, or you need a geopandas install pinned to an old stack. **Nothing in this repo justifies adding it.**

#### 2.3.5 `shapely` 2.x

**What it is.** The GEOS binding most Python GIS code uses; 2.x exposes **vectorized** operations over arrays of geometries (`shapely.make_valid`, `shapely.set_precision`, `shapely.union_all`, STRtree, `from_wkb`/`to_wkb`).

**Pros:** excellent GEOS coverage, `shapely.make_valid` / `validate_reason` and prepared geometries, very fast in vectorized form.

**Cons for this repo:** `shapely` **cannot read a shapefile** — it needs pyogrio/fiona/geopandas alongside it, so it always arrives as part of the heavy stack. It also **bundles its own GEOS wheel**, so you'd have two GEOS copies in-process next to GeoDjango's (`django.contrib.gis.geos`). And it is redundant: GeoDjango already exposes GEOS (`GEOSGeometry`, `make_valid`, `simplify`, `transform`) and PostGIS exposes the same operations in SQL, on the server, where they belong for a bulk load.

**Right choice when:** vectorized bulk geometry repair happens in Python. **Better in this repo:** do `ST_MakeValid` / `ST_SimplifyPreserveTopology` in PostGIS.

#### 2.3.6 `pyshp` (`shapefile`)

**What it is.** A small, pure-Python shapefile+DBF reader with no C dependencies. `shapefile.Reader("x.shp")` yields shapes and records; `.dbf` reads independently.

**Pros:** zero C dependencies (no libgdal, no GEOS, no DLL pain); tiny; great for a quick, safe peek at `.dbf` attributes or a DBF-only import; works anywhere Python runs.

**Cons:** shapefiles only; no reprojection (needs pyproj + your own handling); geometry support is thin (no curves, limited validation, Z/M handling quirks); no spatial index; pure-Python parse speed; no `/vsizip`/`/vsis3`; you must correlate records to shapes yourself.

**Right choice when:** you need to read a `.dbf` attribute table somewhere GDAL isn't available, or you're allergic to C dependencies. Irrelevant here — GDAL is already installed.

#### 2.3.7 Memory behaviour and request-vs-background suitability

| Option | New deps | New C deps | Read memory profile | Throughput | ORM/audit aware | Safe in a web request? |
| --- | --- | --- | --- | --- | --- | --- |
| `ogr2ogr` / `shp2pgsql` | none | none (already present) | constant (GDAL streaming) | **highest** | no | n/a (subprocess) |
| GeoDjango `DataSource` + `OGRGeometry` | **none** | none | **constant** (feature iterator) | medium | **yes** | **no** (blocks gevent hub) |
| `LayerMapping` | none | none | constant, but one long txn + N inserts | low–medium | yes | no |
| `geopandas.to_postgis` | 4–6 | yes (bundled GDAL/GEOS) | **whole file in RAM** unless chunked; `chunksize` only batches writes | high (write) | no | **no** (OOM risk) |
| `pyogrio` | 1–2 | yes (bundled GDAL) | bounded with `skip_features`/`max_features`, or near-zero with `read_bounds` | high | no | no |
| `fiona` | 1–2 | yes | constant (iterator) | medium | no | no |
| `shapely` 2.x | 1 | yes (bundled GEOS) | n/a (no reader) | high (vectorized) | no | n/a |
| `pyshp` | 1 | none | constant (may build an in-memory index) | low | no | no |

**Ranking for a Celery job in *this* repo:** GeoDjango in-process (free, auditable) → `ogr2ogr` into staging (fast escape hatch) → pyogrio (if throughput ever demands it) → geopandas (analysis only, off the shipped image) → fiona/shapely/pyshp (no reason).

---

### 2.4 Staging table first, then transform/validate, then promote — vs. loading directly into model tables

**Why staging wins here, concretely.**

1. **`-overwrite`/`-lco OVERWRITE=YES` destroys Django's table.** A model-managed table carries: the `id` PK and sequence, `created_at`/`updated_at`, all `pghistory` event tables' `pgtrigger` triggers, GiST indexes, `NOT NULL`/check constraints, and the exact column names/order. A GDAL `-overwrite` creates a *new* table with laundered lowercase names, `ogc_fid`/`wkb_geometry`, and none of the above. Direct-to-model-table loading is only survivable with `-append` (slow, needs exact schema match) or `--config OGR_TRUNCATE YES` (which preserves the table but still needs a schema that matches).
2. **Attribute types lie.** Shapefile DBF fields are `C/N/F/D/L` with widths; GDAL launders names by default (`LAUNDER=YES`) and its `PRECISION=YES` default produces `NUMERIC(w,p)`/`CHAR(w)`. Loading everything into `text`/`jsonb` in staging and casting during promotion means a bad source file can never fail a Django column constraint mid-load.
3. **QA has to be able to say "no".** You want to run validity/SRID/extent/duplicate checks and *abort* without having touched live tables.
4. **Rollback is trivial** when staging is disposable (`UNLOGGED`, `TRUNCATE`-able, droppable).
5. **Index-after-load.** `CREATE INDEX` on a populated table is dramatically faster than maintaining a GiST index through a bulk insert. Staging loads with `SPATIAL_INDEX=NONE`; the promoted table's index is created once.

**Staging DDL (created once by a migration):**

```sql
CREATE SCHEMA IF NOT EXISTS staging;

CREATE UNLOGGED TABLE IF NOT EXISTS staging.imp_42 (
    source_fid bigint,
    name       text,
    props      jsonb,
    geom_hex   text          -- EWKB hex; SRID travels with the geometry
);
```

**Staging load (Python streams; see §2.3.1) then the QA gate:**

```sql
-- Per-feature QA on the raw EWKB, before any promotion.
WITH src AS (
  SELECT source_fid,
         ST_GeomFromEWKB(decode(geom_hex, 'hex')) AS g
  FROM staging.imp_42
)
SELECT
  count(*)                                              AS features,
  count(*) FILTER (WHERE geom_hex IS NULL)              AS null_geom,
  count(*) FILTER (WHERE ST_IsEmpty(g))                 AS empty_geom,
  count(*) FILTER (WHERE NOT ST_IsValid(g))             AS invalid_geom,
  count(*) FILTER (WHERE ST_SRID(g) <> 2229)            AS unexpected_srid,
  count(DISTINCT ST_SRID(g))                            AS distinct_srids,
  count(*) FILTER (WHERE ST_NPoints(g) > 100000)        AS very_complex,
  ST_Extent(ST_Transform(g, 4326))::text                AS extent_4326
FROM src;
```

The gate should assert, at minimum: `features > 0`; `distinct_srids = 1` and equal to the expected source CRS; `null_geom = 0`; and **`extent_4326` inside a sane LA County envelope** (roughly `-119.0 32.8, -117.6 34.9`). That last check is the single most valuable one — it catches the "`.prj` was missing so nothing got reprojected" failure, which otherwise silently writes foot-based eastings into a 4326 column.

**Promote — one statement, all geometry math server-side:**

```sql
INSERT INTO datasets_datasetfeature
    (dataset_import_id, source_fid, stable_key, name, props, geom, created_at, updated_at)
SELECT
    %(import_id)s,
    source_fid,
    COALESCE(props ->> %(stable_key_field)s, source_fid::text)   AS stable_key,
    name,
    props,
    ST_Multi(                                                    -- 6. force MultiPolygon
      ST_Transform(                                              -- 5. -> 4326
        ST_SimplifyPreserveTopology(                             -- 4. simplify in SOURCE units
          ST_CollectionExtract(ST_MakeValid(                     -- 3. repair, 2. keep polygonal
            ST_GeomFromEWKB(decode(geom_hex, 'hex'))             -- 1. decode
          ), 3),
          %(simplify_tolerance)s
        ),
        4326
      )
    )::geometry(MultiPolygon, 4326),
    now(), now()
FROM staging.imp_42
WHERE geom_hex IS NOT NULL
  AND NOT ST_IsEmpty(ST_GeomFromEWKB(decode(geom_hex, 'hex')));

ANALYZE datasets_datasetfeature;
```

**The ordering is not arbitrary:**

- `ST_MakeValid` before `ST_SimplifyPreserveTopology` — the simplify function **requires valid input**; GEOS will raise on self-intersecting rings.
- `ST_CollectionExtract(..., 3)` between them — `ST_MakeValid` on a bow-tie polygon can return a `GEOMETRYCOLLECTION` (the sliver becomes a `LINESTRING`); extracting dimension 3 keeps only polygons, otherwise `ST_Multi`/the `MultiPolygon` cast fails.
- **`ST_SimplifyPreserveTopology` tolerance is in the coordinates' own units**, so simplify *before* `ST_Transform` and express the tolerance in **source units** (US survey feet for EPSG:2229). Simplifying after transforming means specifying a tolerance in decimal degrees, which is both unintuitive and tiny — a "10 ft" simplification expressed as `0.00003°` will surprise the next reader. Reference: [ST_SimplifyPreserveTopology](https://postgis.net/docs/ST_SimplifyPreserveTopology.html).
- `ST_Multi` last, to satisfy a `MultiPolygon` column even when the source layer is single-part (the SQL equivalent of `-nlt PROMOTE_TO_MULTI`).
- `ST_Transform` last-but-one, because the model column is 4326.

**`ST_Subdivide` — when and how.** `ST_Subdivide(geom, max_vertices=256, gridSize=-1)` is a **set-returning function**: one input row produces N output rows, each with ≤ `max_vertices` vertices ([ST_Subdivide docs](https://postgis.net/docs/ST_Subdivide.html)). The docs are explicit that point-in-polygon and other spatial operations are *normally faster for indexed subdivided datasets*, because the parts' bounding boxes cover far less area, so index scans produce fewer recheck candidates — and they explicitly recommend denormalizing very large polygons ("just because you *can* store all of Europe in one polygon doesn't mean you *should*"). Two important caveats:

- It **multiplies row count**. Do not subdivide unconditionally: a 15-polygon council-district layer gains nothing. Gate it on complexity:
  ```sql
  INSERT INTO datasets_boundarypart (feature_id, part_no, geom)
  SELECT f.id, row_number() OVER (PARTITION BY f.id),
         ST_MakeValid(p.geom)
  FROM datasets_datasetfeature f
  JOIN datasets_datasetimport i ON i.id = f.dataset_import_id AND i.is_current
  CROSS JOIN LATERAL ST_Subdivide(f.geom, 256) AS p(geom)
  WHERE ST_NPoints(f.geom) > 2000;
  ```
  Containment then queries `datasets_boundarypart` directly (or `EXISTS (... WHERE part.feature_id = f.id ...)`), never the parent geometry.
- **Never subdivide a `geography`.** Subdivision inserts vertices in *planar* space; on a geography those new vertices are interpreted as geodesic nodes and change the shape. Densify with `ST_Segmentize(geography, dist)` first, then cast to geometry, per the docs. This is another reason to keep boundary columns as `geometry`.

**Direct-into-model-tables — the honest case for it:** one fewer moving part, no duplicate storage, and `pghistory`/permissions fire with no ceremony. It is defensible for **tiny, trusted, single-feature** loads (e.g. pasting one district polygon) where an admin action writes one row through the ORM. It is not defensible for bulk file ingestion: a syntax error or a bad CRS mid-load leaves live data half-updated, and a long transaction holds locks on a table the API is actively reading.

**Verdict:** staging always, promote via SQL (or the ORM for very small datasets), and keep the promoted table model-managed so migrations, triggers, and permissions stay authoritative.

---

### 2.5 Django model design for geospatial data

**Import convention.** Use `django.contrib.gis.db.models` for geometry fields — it re-exports everything from `django.db.models` **plus** the geometry fields and `GeoManager`. The repo currently mixes the two (`from django.contrib.gis.db.models import PointField` alongside `from django.db import models`); either works, but a new geo app should be consistent.

**Field type choice.**

| Need | Field |
| --- | --- |
| Canonical administrative boundaries | `MultiPolygonField(srid=4326)` — handles single- and multi-part, matches shapefile reality |
| Guaranteed single-part | `PolygonField(srid=4326)` (only if you can enforce it) |
| Mixed geom types in one column | `GeometryField(srid=4326, dim=2)` |
| Lines (routes, streets) | `MultiLineStringField(srid=4326)` |
| Points with distance queries | `PointField(srid=4326, geography=True)` — the existing repo pattern |

**Do not use `geography=True` for boundaries.** Django's docs are explicit that geography "support is limited to PostGIS and will force the SRID to be 4326", and that only a subset of lookups is available (in practice `bboverlaps`, `coveredby`, `covers`, `intersects` plus the distance lookups) — anything else is silently cast to geometry, which is exactly the index-defeating behaviour documented in §0. Areal predicates (`contains`, `within`, `overlaps`) all take that cast. Keep the existing point columns as-is; make new polygon columns plain `geometry`.

**SRID strategy (4326 vs. EPSG:2229).**

- **Store canonical geometry as `srid=4326`.** It is what the frontend maps, GeoJSON, and every other integration speaks; it needs no per-consumer projection knowledge.
- **Do not store 2229 as the primary CRS.** US survey-foot coordinates (`x ≈ 6.5e6, y ≈ 2.0e6`) are meaningless to a Mapbox/Leaflet client and make the API surface leak a regional projection.
- **Measure in the right CRS at query time**, rather than denormalizing a second geometry column:
  ```sql
  -- area in square feet (2229 is ftUS, so area comes out in ft²)
  SELECT ST_Area(ST_Transform(geom, 2229)) FROM datasets_datasetfeature WHERE id = 1;
  -- area in m² / distance in m, via geography
  SELECT ST_Area(geom::geography) FROM datasets_datasetfeature WHERE id = 1;
  ```
  Add a projected column (`source_geom = MultiPolygonField(srid=2229)`) **only** if profiling shows the per-row `ST_Transform` matters — at these data volumes it will not.
- **Why 2229 at all:** `EPSG:2229` is *NAD83 / California zone 5 (ftUS)* — California State Plane Zone V in US survey feet — and its **area of use is explicitly "California — counties Kern; Los Angeles; San Bernardino; San Luis Obispo; Santa Barbara; Ventura"** ([epsg.io/2229](https://epsg.io/2229)). It is the projection LA County GIS publishes in. Note it requires the NADCON grid `us_noaa_cshpgn.tif` for its 2 m transformation to WGS 84; without it PROJ falls back to a ballpark transformation with several metres of error (see §2.7). Its modern equivalent is `EPSG:6424` (NAD83(2011) / California zone 5 (ftUS)). Datasets also arrive in `EPSG:4326` (already lat/lon) and occasionally `EPSG:2770` (California Albers, metres) — **always take the CRS from the file's `.prj`/layer SRS and only fall back to a configured default; record it on the import row.**

**Spatial indexes.**

- `spatial_index=True` is the **default** on every geometry field and makes GeoDjango emit a `GiST` index in `CreateModel` ([GeoDjango model API](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/model-api/)). For `DatasetFeature.geom` that is exactly right.
- For custom or operator-class-specific indexes, `GistIndex` from `django.contrib.postgres.indexes` ([docs](https://docs.djangoproject.com/en/6.1/ref/contrib/postgres/indexes/)) — e.g. a 3D/N-D opclass via `OpClass("geom", name="gist_geometry_ops_nd")`, or a `fillfactor`/`buffering` tuned index.
- **Production-safe creation.** A plain `CREATE INDEX USING GIST` takes an `ACCESS EXCLUSIVE` lock. For a new, empty table that's instantaneous; for a table being read live, use `AddIndexConcurrently` (requires `atomic = False` on the migration and cannot run inside a transaction):
  ```python
  from django.contrib.postgres.indexes import GistIndex
  from django.contrib.postgres.operations import AddIndexConcurrently

  class Migration(migrations.Migration):
      atomic = False
      dependencies = [("datasets", "0001_initial")]
      operations = [
          AddIndexConcurrently(
              model_name="datasetfeature",
              index=GistIndex(fields=["geom"], name="dsfeature_geom_gist"),
          ),
      ]
  ```
  To use this you must set `spatial_index=False` on the field (otherwise `CreateModel` creates a plain index first) and add the concurrent index in a follow-up migration. For a table that is loaded once and read many times, a better pattern is to omit the index from the model, create it in the *promote* SQL after the load, and add `AddIndexConcurrently` only for existing production tables.

**`django.contrib.gis.admin`.** `GISModelAdmin` gives the OpenLayers map widget for point fields; it is **not currently used anywhere** in the repo (`grep` for `GISModelAdmin`/`OSMWidget`/`gis.admin` returns nothing) — `Shelter.geolocation` has no map widget today. New geometry models should use `from django.contrib.gis.admin import GISModelAdmin` plus `from django.contrib.gis.forms import OSMWidget` for a usable admin experience.

**Migrations.**

- **Add `CreateExtension("postgis")`** to the new app's initial migration. Django's `CreateExtension` compiles to `CREATE EXTENSION IF NOT EXISTS`, so it is safe where the extension already exists; on RDS it needs `rds_superuser`, which the master user has.
  ```python
  from django.contrib.postgres.operations import CreateExtension
  from django.db import migrations

  class Migration(migrations.Migration):
      initial = True
      dependencies = []
      operations = [
          CreateExtension("postgis"),
          migrations.RunSQL(
              "CREATE SCHEMA IF NOT EXISTS staging",
              reverse_sql=migrations.RunSQL.noop,
          ),
          # ... CreateModel(...) for Dataset / DatasetImport / DatasetFeature
      ]
  ```
- **Never put the data load in a `RunPython` data migration.** It runs inside the deploy's migration transaction, holds locks for its duration, blocks every other migration, and cannot be re-run or rolled back meaningfully. Use a management command invoked by the existing one-off ECS task instead — that is what `migration_service` already exists to do.
- **`max_geom_collections`** (new in recent Django, default **198**) bounds GEOMETRYCOLLECTION nesting depth on WKB/WKT input and can raise `ValueError` on assignment — relevant if a source file contains pathological nested collections. Validate before promote (the `ST_CollectionExtract` step flattens most of it).
- Keep `dim=2`. Shapefiles with Z are rare here; 3D geometry would break `ST_Area` expectations and the frontend.

**Sketch:**

```python
# apps/betterangels-backend/datasets/models.py
import pghistory
from django.contrib.gis.db.models import MultiPolygonField
from django.db import models

from common.models import BaseModel, OrgScoped
from common.permissions.utils import PermissionSet, perm


class Dataset(OrgScoped, BaseModel):
    """A named, versioned reference layer (e.g. 'LA City Council Districts')."""

    class perms(PermissionSet):
        MANAGE = perm("manage_dataset", "Can manage dataset imports")

    org_via = None  # platform-shared reference data (ADR 0001; see clients/models.py:171)

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    stable_key_field = models.CharField(
        max_length=64, blank=True, default="",
        help_text="Source attribute used as the idempotency key (e.g. DISTRICT).",
    )
    source_default_crs = models.CharField(max_length=32, blank=True, default="EPSG:2229")
    simplify_tolerance = models.FloatField(
        default=0.0,
        help_text="Topology-preserving simplification tolerance, in SOURCE CRS units.",
    )

    def __str__(self) -> str:
        return self.name


class DatasetImportStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    STAGED = "staged", "Staged"
    VALIDATED = "validated", "Validated"
    PROMOTED = "promoted", "Promoted"
    FAILED = "failed", "Failed"


@pghistory.track(
    pghistory.InsertEvent("dataset_import.add"),
    pghistory.UpdateEvent("dataset_import.update"),
)
class DatasetImport(BaseModel):
    """One provenance-tracked ingestion of one artifact."""

    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="imports")
    source_name = models.CharField(max_length=255)
    source_url = models.URLField(blank=True, default="")
    vintage = models.DateField(null=True, blank=True, help_text="Data vintage, e.g. 2025-04-01")
    original_filename = models.CharField(max_length=255)
    storage_key = models.CharField(max_length=1024, help_text="S3 key of the uploaded bundle (.zip)")
    source_sha256 = models.CharField(max_length=64, db_index=True)
    source_crs = models.CharField(max_length=32)
    staging_table = models.CharField(max_length=63, blank=True, default="")
    feature_count_read = models.PositiveIntegerField(null=True, blank=True)
    feature_count_loaded = models.PositiveIntegerField(null=True, blank=True)
    qa_report = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=16, choices=DatasetImportStatus.choices, default=DatasetImportStatus.PENDING
    )
    error_message = models.TextField(blank=True, default="")
    imported_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    is_current = models.BooleanField(default=False, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["dataset", "vintage", "source_sha256"],
                name="uniq_dataset_import_identity",
            ),
            models.UniqueConstraint(
                fields=["dataset"],
                condition=models.Q(is_current=True),
                name="uniq_current_import_per_dataset",
            ),
        ]


class DatasetFeature(BaseModel):
    """One geometry + attributes, owned by exactly one import."""

    dataset_import = models.ForeignKey(DatasetImport, on_delete=models.CASCADE, related_name="features")
    source_fid = models.BigIntegerField()
    stable_key = models.CharField(max_length=255, db_index=True)
    name = models.CharField(max_length=255, blank=True, default="")
    props = models.JSONField(default=dict, blank=True)
    geom = MultiPolygonField(srid=4326)  # spatial_index=True by default -> GiST

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["dataset_import", "stable_key"], name="uniq_dataset_feature_key"
            ),
        ]
        indexes = [models.Index(fields=["dataset_import", "stable_key"])]
```

> The conditional unique constraint `UniqueConstraint(fields=["dataset"], condition=Q(is_current=True))` is the cleanest way to enforce "at most one current version per dataset" at the database level, which makes the version swap race-proof. It requires the `is_current` flag to be flipped in the same transaction as the promote.

**Deriving the existing denormalized district fields** (this is the killer first use case):

```sql
-- geometry-to-geography requires an explicit cast; the point column is geography.
UPDATE shelters_shelter s
SET city_council_district = c.props ->> 'DISTRICT'
FROM datasets_datasetfeature c
JOIN datasets_datasetimport i ON i.id = c.dataset_import_id AND i.is_current
JOIN datasets_dataset d      ON d.id = i.dataset_id AND d.slug = 'la-city-council-districts'
WHERE s.geolocation IS NOT NULL
  AND ST_Covers(c.geom, s.geolocation::geometry);
```

`ST_Covers(geometry, geometry)` uses the GiST index on `c.geom` and correctly counts points exactly on a boundary (unlike `ST_Contains`). Note `s.geolocation::geometry` — the cast is unavoidable when comparing against a `geography` column, and it's fine here because the *indexed* side is `c.geom`.

---

### 2.6 Multi-tenancy, provenance, and idempotent re-import

**Provenance fields an import row must carry** (all in the sketch above): `source_name`, `source_url`, `vintage`, `original_filename`, `storage_key`, `source_sha256`, `source_crs`, `imported_by`, `started_at`/`finished_at`, `feature_count_read`/`feature_count_loaded`, `qa_report`, `status`, `error_message`. This is what makes the ninth re-import of the same layer debuggable six months later. Compute `source_sha256` on the uploaded zip bytes; it is the identity of the artifact.

**Idempotency strategy — recommended: versioned imports with a current-pointer swap.**

Three candidate strategies and how they behave here:

| Strategy | Re-run same file | Partial failure | Rollback | Storage | Fit |
| --- | --- | --- | --- | --- | --- |
| **Truncate & reload** | Re-does all work | Table empty/wrong until done | None (re-import) | 1× | Simple, but a live read during reload sees an empty layer |
| **Upsert by stable key** | Cheap no-op if unchanged | Rows half-updated | None | 1× | Needs a trustworthy natural key; geometry churn is expensive |
| **Versioned rows + `is_current`** | `get_or_create` on `(dataset, vintage, sha256)` → **true no-op** | Old version stays readable the whole time | Flip the flag back — **instant, free** | ~2× (old + new) | Matches this repo's audit-first culture; data is tiny |

The third wins here because the data is small (2× of tens of MB is nothing against 100 GB) and because atomicity is a genuine operational property: the swap is a single `UPDATE` that flips `is_current` in one transaction, so API readers see either the whole old version or the whole new one, never a half-loaded layer.

**Concrete idempotency rules:**

1. **Identity.** `UniqueConstraint(dataset, vintage, source_sha256)` → re-uploading the *same* bytes for the *same* vintage is a hard duplicate; detect it up front and either no-op or fail loudly with "already imported on {date} by {user}". Re-running with a *new* vintage creates a new version.
2. **Natural key per feature.** `stable_key` derived from a declared `Dataset.stable_key_field` (fallback: `source_fid`). Store it so you can diff versions.
3. **Cross-version diff** — the QA report should answer "what changed":
   ```sql
   SELECT
     count(*) FILTER (WHERE new.stable_key IS NULL) AS removed,
     count(*) FILTER (WHERE old.stable_key IS NULL) AS added,
     count(*) FILTER (WHERE old.stable_key IS NOT NULL AND new.stable_key IS NOT NULL
                        AND ST_AsBinary(old.geom) IS DISTINCT FROM ST_AsBinary(new.geom)) AS geom_changed
   FROM old_version old
   FULL OUTER JOIN new_version new USING (stable_key);
   ```
   `ST_AsBinary(...) IS DISTINCT FROM` is a cheap exact comparison (no `ST_Equals` geometry math) and is the right test for "did the geometry actually change".
4. **Upsert when you must** (attributes-only updates to the *current* version, no version bump):
   ```python
   DatasetFeature.objects.bulk_create(
       rows, update_conflicts=True,
       unique_fields=["dataset_import", "stable_key"],
       update_fields=["name", "props", "geom"],
   )
   ```
   (Django ≥4.1; one `INSERT … ON CONFLICT … DO UPDATE`.) For geometry, prefer raw SQL with an explicit `ST_AsBinary` guard so unchanged geometries are not rewritten — that avoids pointless WAL, index churn, and `pghistory` rows.
5. **Promote transactionally.** Promote inside a single transaction: insert new features → `UPDATE datasets_dataset SET ... ` / flip `is_current` → commit. With the conditional unique constraint, an accidental double-flip fails loudly instead of leaving two "current" versions.

**Multi-tenancy.** Boundary layers are almost certainly **platform-shared reference data**, i.e. `OrgScoped` with `org_via = None` (the same call `clients/models.py:171` makes for its platform-shared model). That said, `common/permissions/checks.py` enforces real rules at check-time — a model must be org-reachable or explicitly platform-shared, must not declare a write tier while org-anchored, and only `org_via = None` may declare a tier. New models must be run through `python manage.py check` and the permissions selectors' tests. If some future dataset *is* org-specific (e.g. a partner's own service area), the versioned-import model composes cleanly: move the `organization` FK onto `Dataset` and set `org_via = ()`.

**Audit volume warning.** `pghistory.track` on the **header** (`DatasetImport`) is right. Do **not** track `DatasetFeature`: a 50k-row import would emit 50k+ audit rows per import, which dwarfs the data itself and makes the `pghistory` tables the largest thing in a 100 GB database over time. Instead, label the whole operation with a pghistory context on the header and rely on the versioned rows themselves for feature-level history.

---

### 2.7 Operational concerns

**Where the job runs.**

| Option | Fits? | Notes |
| --- | --- | --- |
| Synchronous GraphQL mutation / admin POST | **No**, except trivial files | gunicorn runs `gunicorn[gevent]` with `gevent.monkey.patch_all()`; a CPU-bound GDAL loop blocks the greenlet hub and stalls all concurrent requests on that worker. Also unbounded request duration. |
| Celery task, **existing** `default` queue | **Yes, to start** | `single_instance` lock already exists. But the worker is 1024 CPU / 2048 MiB with `min = max = 1`, so a long import **blocks every other task** (mail, reports). Acceptable for a first version; not for steady state. |
| Celery task, **new `imports` queue** | **Recommended** | `celery_worker_config` is a map keyed by queue name — adding `imports = {cpu = 2048, memory = 4096, autoscaling_min_capacity = 0, autoscaling_max_capacity = 1}` yields a second ECS service running `celery -A betterangels_backend worker -l INFO -Q imports`, isolated from mail/report latency, scalable to zero when idle. |
| **One-off ECS Fargate task** | **Recommended as the escape hatch** | Mirrors the existing `migration_service` + `start_migration_task` Lambda pattern exactly: `ecs.run_task` with a `command` override on the migration task-definition family. Bigger CPU/RAM, its own 20 GiB (configurable to 200 GiB) ephemeral disk, no 15-minute cap, full access to the private RDS subnet, and `enable_execute_command = true` for interactive debugging. Best for large loads and for running `ogr2ogr` directly. |
| AWS Lambda with GDAL | **No** | The `python3.14` managed runtime has no GDAL, so this requires a **container-image Lambda** (the repo already builds one for `imgproxy` via `lambda-container-deploy`). Costs: a 250–400 MB image, a 15-minute hard timeout, `/tmp` limited to 512 MB–10 GB, no easy access to this repo's Django settings/migrations, and a second GDAL build to maintain. ECS + the existing monorepo image already has GDAL and no timeout — Lambda buys nothing here. |

**Recommended layering:** `manage.py import_dataset` (canonical, testable, works in the devcontainer) → wrapped by a Celery task on the `imports` queue (normal path) → the same command runnable as an ECS one-off task command override (large/rare/interactive). One implementation, three invocations.

**Sizing and limits — state these in the design doc.**

- RDS is `db.t4g.small`: **2 GiB RAM**, and `maintenance_work_mem` defaults to ~64 MB on RDS. Budget: staging table + promoted table + GiST index + WAL must all comfortably fit. Rule of thumb: **keep each import under ~50–100 MB of source geometry and under ~250k features**; a GiST index build on a 250k-polygon table with default settings can exhaust `maintenance_work_mem` and spill. If a dataset exceeds that, `ST_Subdivide` or simplify *before* promoting, and consider `SET LOCAL maintenance_work_mem = '512MB'` for the index build (possible on RDS within the instance's memory).
- Celery worker default **2 GiB** is the real cap on the in-process path. The streaming `DataSource` loop is constant-memory, so this is only a concern if you accidentally materialize a `list(layer)` — don't.
- Fargate ephemeral storage defaults to 20 GiB; plenty. Prefer reading `/vsizip//vsis3/...` so you never write a local copy at all.
- Set `SET LOCAL synchronous_commit = off` for the staging COPY inside its own transaction (staging is disposable), but **not** for the promote transaction.
- `ANALYZE` the promoted table after load — the planner will otherwise make poor choices on a freshly bulk-inserted table.
- `DEBUG=False` for the whole job (see the Django memory warning in §2.3.1).

**GDAL/GEOS/PROJ image requirements.**

- Keep `gdal-bin`. It provides `ogrinfo`/`ogr2ogr`/`gdalinfo` **and** the `libgdal` C library GeoDjango links against, and pulls GEOS and PROJ transitively. GeoDjango needs only the **C libraries** — not the Python `gdal` binding. There is no `gdal`/`rasterio`/`fiona` Python package in the tree today and none is required.
- Do **not** set `GDAL_LIBRARY_PATH`/`GEOS_LIBRARY_PATH` on Debian — they're found via the standard paths. (The Django docs list these settings only for non-standard locations; the Docker audit should confirm neither is set.)
- **Add `proj-data`.** Not currently installed. `EPSG:2229 → EPSG:4326` uses the NADCON transformation (code 1750, "NAD83 to WGS 84 (54)", grid files `cshpgn.las`/`cshpgn.los`, or the modern `us_noaa_cshpgn.tif`) at **2.0 m accuracy**. Without the grid, PROJ falls back to a coarser/ballpark operation (the epsg.io page lists alternatives at **4.0 m and 8.0 m**). For assigning a shelter to a council district, 8 m is irrelevant; for anything measurement-grade it is not, and an *unexplained* coordinate shift is worse than a small one. Installing `proj-data` makes the transform deterministic and documented. Alternatively set `PROJ_NETWORK=ON` to fetch grids at runtime (adds a network dependency — not recommended in a task that must be reproducible). Also pin `PROJ_DATA`/`PROJ_LIB` explicitly if using wheels.
- **Version alignment.** If anyone adds `pyogrio`/`fiona`/`geopandas`, audit for a second bundled GDAL and prefer an install linked to system `libgdal` 3.10.3. Two GDALs in one image is the most common cause of `proj.db`-not-found and CRS-mismatch bugs.
- **Django 6.1 compatibility is satisfied:** trixie's GDAL 3.10.3 / GEOS ~3.13 / PROJ 9.x and PostGIS 3.5 all fall inside Django 6.1's supported windows (GDAL 3.3–3.13, GEOS 3.10–3.14, PROJ 6–9, PostGIS 3.2–3.6).

**Validation / QA checklist** — every item lands in `DatasetImport.qa_report`:

1. **Pre-flight (no DB writes):** `ogrinfo -so -al` inventory; `sha256` of the zip; layer count (fail if the zip has >1 dataset and no layer was specified); `layer.geom_type` is polygonal; `layer.srs` resolved to a real EPSG code (not `None`/`0`/user-defined) — **if it is unresolvable, require an explicit `--source-srs`**; `len(layer) > 0`; field names present for the declared `stable_key_field`.
2. **Post-stage:** `features`, `null_geom`, `empty_geom`, `invalid_geom`, `distinct_srids`, `very_complex`, `ST_Extent` — with a **hard envelope assertion** for LA County (`ST_Extent` inside roughly `(-119.0, 32.8, -117.6, 34.9)`). This catches the silent no-reprojection failure.
3. **Post-promote:** `feature_count_loaded == feature_count_read`; `SELECT count(*) FROM … WHERE ST_SRID(geom) <> 4326` is 0; `count(*) WHERE NOT ST_IsValid(geom)` is 0 (post-`MakeValid`); `count(DISTINCT stable_key) == count(*)`; area range sanity per feature (`ST_Area(ST_Transform(geom,2229))` within expected bounds — e.g. council districts should each be ~10⁸–10⁹ ft²); duplicate-geometry detection via `GROUP BY ST_AsBinary(geom) HAVING count(*) > 1`.
4. **Cross-version diff:** added / removed / geometry-changed counts vs. the previous current version (§2.6).
5. **Spot check:** the centroid of each feature is inside the feature (`ST_Contains(geom, ST_Centroid(geom))`) — catches ring-orientation and hole-sign bugs that `ST_IsValid` accepts.
6. **Tests in CI:** a tiny synthetic fixture (a 3-polygon GeoJSON or a checked-in mini shapefile bundle — note that a shapefile fixture needs all of `.shp/.shx/.dbf/.prj` committed together) exercised end-to-end by a pytest case. The repo's pytest config already uses `--reuse-db`, so PostGIS availability in CI must be confirmed (rather than "PostGIS may be cached or not" comment in `shelters/tests/test_shelter_filters.py:84`, which implies PostGIS *is* available in CI).

**Concurrency and locking.**

- `common.celery.single_instance` uses `cache.add()` on Redis — an atomic `SET NX EX`, so it is a real mutex, and it re-queues with a `countdown` rather than dropping work. Key it per dataset: `lock_key=f"celery-lock:datasets.import:{dataset_slug}"`.
- **Prefer an additional DB-level advisory lock inside the task**: `SELECT pg_advisory_xact_lock(hashtext('import:' || %s))`. It is released automatically at transaction end, survives a Redis flush, and works even if a second worker is started by hand or a one-off ECS task bypasses Celery entirely. Belt and braces, because both invocation paths must exclude each other.
- Guard against a stale `PENDING`/`STAGED` row: on task start, if the import is already `PROMOTED`, exit early (`this is a re-delivery`).

**Secrets / IAM.**

- The Django/Celery path needs nothing new: `common.backends.iam_dbauth.postgis` mints the RDS token with boto3 from the task role.
- The CLI path (`ogr2ogr`, `shp2pgsql`) **cannot** use that backend: it must mint the token itself into `PGPASSWORD` (§2.1) and needs `libpq`/`psql` (present: `postgresql-client-16`; note the server is 17 — a 16 client against a 17 server is fine for the wire protocol, but consider bumping to `postgresql-client-17` for `pg_dump`/`pg_restore` compatibility if you ever use them).
- GDAL's `/vsis3` does not read the ECS task role — export `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_SESSION_TOKEN` from `boto3.Session().get_credentials()` before any `/vsis3` read, or download via boto3 to a temp path.
- S3 object access for dataset bundles: reuse the existing `betterangels-*` media bucket pattern and `LocalS3Storage`/`S3Storage` (`common/storage.py`), or a dedicated `datasets/` prefix. Add the prefix to the task role policy if the bucket policy is prefix-scoped.

---

## 3. Recommended implementation plan for this repo

### Guiding principles

1. **No new Python geospatial dependencies.** `django.contrib.gis.gdal` + PostGIS SQL is sufficient and is the only option that is simultaneously dependency-free, mypy-clean, ORM/audit-aware, and consistent with the existing `pghistory`/`OrgScoped` architecture.
2. **Staging is mandatory; promote is one statement.** The promote step is the only place live tables change, so it is the only place that needs to be transactionally perfect.
3. **Versioned imports with a current-pointer swap** — rollback is a flag flip.
4. **One implementation, three entrypoints** — management command, Celery task, ECS one-off task override.

### Phase 0 — Unblock and verify (½–1 day)

1. **Verify the `postgis` extension** on development, preview, and production:
   `SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis','postgis_topology');`
   If absent: `CREATE EXTENSION IF NOT EXISTS postgis;` as `rds_superuser`, then add `CreateExtension("postgis")` to the new app's initial migration so the repo is self-describing regardless.
2. **Add `proj-data` to the Dockerfile** next to `gdal-bin` so EPSG:2229 transformations use the 2 m NADCON grid rather than a metres-off ballpark operation.
3. **Record the effective library versions** in the image (`ogrinfo --version`, `geos-config --version`, `projinfo --version`) so the QA report can assert against a known stack.
4. **Confirm sizes** of the actual candidate datasets (council districts, supervisorial districts, SPAs, ZIPs, census tracts) as `.zip` bytes + feature counts, against the ~50–100 MB / 250k-feature budget.
5. Decide the **S3 prefix and upload cap** for dataset bundles (the existing presigned pipeline caps at 50 MiB per domain by default; add a `DATASET_MAX_FILE_SIZE` if larger is needed). Also confirm `DATASET_*` settings are declared in `settings.py`'s `environ.Env(...)` block per house style.

### Phase 1 — Data model and schema (1–2 days)

1. New Django app `apps/betterangels-backend/datasets/` with `Dataset`, `DatasetImport`, `DatasetFeature` (sketch in §2.5), `OrgScoped`/`org_via = None`, `pghistory.track` on `DatasetImport` only, a `PermissionSet` with `MANAGE`.
2. Initial migration: `CreateExtension("postgis")`, `CREATE SCHEMA IF NOT EXISTS staging`, `CreateModel` for the three tables. `spatial_index=True` on `DatasetFeature.geom` for the initial (empty-table) deployment; switch to `AddIndexConcurrently` in a follow-up migration if the table is ever created populated in production.
3. Run `python manage.py check` (must pass `common.permissions.checks`) and the permissions selector tests.
4. Admin: `GISModelAdmin` for `DatasetFeature`, read-only for imported rows (imports must go through the pipeline, never hand-edited).
5. GraphQL: add a read-only `Dataset`/`DatasetFeature` query. Serve geometry as GeoJSON text (`ST_AsGeoJSON(geom)::json`) behind a `JSON`/`GeoJSON` scalar — the schema has **no geometry type today** (only `latitude`/`longitude` floats). Consider a `simplified` argument that pushes `ST_SimplifyPreserveTopology` into SQL for map display, so the frontend never receives full-resolution boundaries.

### Phase 2 — Ingestion pipeline (3–5 days)

Module `datasets/services/ingest.py`, entrypoint `manage.py import_dataset`, task `datasets.tasks.import_dataset`.

```python
# datasets/management/commands/import_dataset.py
class Command(BaseCommand):
    help = "Import a vector dataset (Shapefile / GeoPackage / GeoJSON) into PostGIS via staging."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("dataset_slug")
        parser.add_argument("source", help="Path, s3 key, or /vsizip//vsis3/... GDAL path")
        parser.add_argument("--vintage", default=None, help="YYYY-MM-DD")
        parser.add_argument("--layer", type=int, default=0)
        parser.add_argument("--source-srs", default=None, help="Required if the .prj is missing/unresolvable")
        parser.add_argument("--stable-key-field", default=None)
        parser.add_argument("--simplify", type=float, default=None, help="Tolerance in SOURCE CRS units")
        parser.add_argument("--dry-run", action="store_true", help="Stage + QA + report, do not promote")
        parser.add_argument("--user", default=None, help="Email of the operator, for provenance")
```

Steps inside the service (each writes to `DatasetImport.qa_report`):

1. `sha256` the artifact; `get_or_create` the `DatasetImport` on `(dataset, vintage, sha256)` — an identical re-run exits as a **no-op**.
2. Pre-flight inventory via `django.contrib.gis.gdal.DataSource` (feature count, geom type, SRS, extent, fields); **fail fast** if the SRS is unresolvable and `--source-srs` was not given.
3. Create `staging.imp_<id>` (unlogged); stream features with `cur.copy(...)` writing `(source_fid, name, props, geom_hex=geos.ewkb.hex())`; count as you go (§2.3.1 code).
4. QA gate in SQL (§2.4) with the **LA County envelope assertion**; on failure set `status=FAILED`, keep the staging table for inspection, and raise.
5. `--dry-run` stops here.
6. Promote in one transaction: insert features (the promote SQL in §2.4), flip `is_current` (the conditional unique constraint enforces exactly one), set `status=PROMOTED`; then `ANALYZE`; then `DROP TABLE staging.imp_<id>` (keep on failure, for post-mortem).
7. Wrap in `pg_advisory_xact_lock(hashtext('import:' || slug))` **and** `@single_instance(lock_key=...)`.

Then:
- `datasets/tasks.py`: `@shared_task(bind=True)` + `@single_instance` + advisory lock, calling the same service; `.delay(import_id)`.
- Terraform: add an `imports` queue to `celery_worker_config` (2 vCPU / 4 GiB, min 0 / max 1) so imports never block mail or report tasks.
- Tests: synthetic 3-polygon fixture covering (a) happy path, (b) missing `.prj` → explicit `--source-srs`, (c) an invalid self-intersecting polygon repaired by `ST_MakeValid`, (d) a wrong-CRS file rejected by the envelope assertion, (e) an identical re-run no-op, (f) a second vintage swapping `is_current`.

### Phase 3 — Upload UX and operator flow (1–2 days)

Reuse the **existing presigned S3 pipeline** (`docs/presigned-upload-pipeline.md`, `admin_async_upload`, `/upload/`): the operator uploads a single `.zip` containing the complete shapefile bundle, the object key is recorded on `DatasetImport.storage_key`, and an admin action ("Start import") — or a small internal POST — enqueues `imports`. Because `/vsizip//vsis3/...` works, no unzip step is needed; just remember to export credentials from boto3 for GDAL (§2.1). The admin list displays `status`, `vintage`, counts, the QA report, and a "make current" action restricted to `MANAGE`.

### Phase 4 — First consumer: district derivation (1–2 days)

- Import `la-city-council-districts` and `la-county-supervisorial-districts`.
- Add a `manage.py backfill_districts` (or an admin action) that runs the `ST_Covers` update in §2.5, then a nightly/weekly Celery beat task to keep it fresh for newly created shelters.
- Consider replacing the `map_bounds` bbox prefilter with a real boundary join only once boundaries exist — and note the `within`-vs-`covers` index issue from §0 when you do.

### Phase 5 — Escape hatch and scale (only when needed)

Document (and, if a dataset demands it, implement) the `ogr2ogr` path inside a **one-off ECS task**, mirroring `migration_service` + `start_migration_task`: `aws ecs run-task` with a `command` override, `PGPASSWORD` from an IAM token, loading into `staging` with `-nln staging.imp_x -nlt PROMOTE_TO_MULTI -lco SPATIAL_INDEX=NONE --config PG_USE_COPY YES`, then running the *same* promote/QA SQL. This keeps one code path for validation while getting CLI throughput and GDAL's full format coverage when a file is weird or large. Only if a dataset ever exceeds the Fargate/RDS budget should you reach for `ST_Subdivide` on a separate parts table, or move heavy pre-processing out of the deployed image (a scratch geopandas container that writes `staging` and nothing else).

### Tradeoffs of this recommendation

| Decision | Benefit | Cost / risk | Mitigation |
| --- | --- | --- | --- |
| **GeoDjango in-process instead of geopandas/pyogrio** | Zero new deps; stays inside strict mypy/ruff; ORM + `pghistory` + `OrgScoped` aware; unit-testable; no second GDAL | Lower raw throughput than Arrow/COPY-based tools; more plumbing to write by hand | Data is tens of MB, so throughput is not the constraint; keep `ogr2ogr` documented as the escape hatch for the rare big file |
| **Staging schema + promote** | Live tables never half-updated; hard QA gate; index-after-load; disposable rollback | Extra storage (~2–3× source) and one more step; promote SQL must be maintained | RDS has 100 GB and the data is small; keep the promote statement in one reviewed place with tests |
| **Versioned rows + `is_current`** | True idempotent no-op; instant rollback; atomic swap | ~2× storage; every read must filter `is_current`; conditional unique constraint to enforce | Add a `DatasetFeature.objects.current()` queryset helper and make it the only documented access path; prune old versions after N vintages |
| **Canonical 4326 `geometry`, not `geography`** | Full lookup/index support (`contains`/`within`/`covers` all indexable); matches GeoJSON/web | Distances/areas need an explicit `ST_Transform`/`::geography`; mixed with existing geography point columns (requires casts) | Measure with `ST_Area(geom::geography)` or `ST_Transform(geom,2229)`; the cast cost is trivial at these volumes |
| **Celery `imports` queue first, ECS one-off later** | Fast to ship, observable, reuses `single_instance` | Default worker is 1 vCPU/2 GiB single-instance → must not share the default queue | Ship the dedicated queue in the same change; the map-valued `celery_worker_config` makes it a config-only addition |
| **CLI (`ogr2ogr`/`shp2pgsql`) as escape hatch, not default** | Avoids duplicated validation logic, `-overwrite` footguns, and the IAM-token/subprocess complexity in the normal path | The CLI path still needs credential minting and VPC-local execution when used | Run it only inside a one-off ECS task, and only against `staging` |

### Explicitly not recommended

- **`shp2pgsql`** as the pipeline foundation: shapefile-only, no filtering/repair/simplify, text round-trip, `-S` and `-s`+`-D` footguns, and it needs a new package in the image. GDAL subsumes it.
- **`geopandas`/`shapely`/`fiona`/`pyogrio`/`pyshp` as backend dependencies** at the current data scale: 4–6 new packages, a second GDAL and GEOS, poor typing against a strict-mypy codebase, ORM bypass, and whole-file-in-RAM reads against a 2 GiB worker. Use them in a scratch analysis environment if needed.
- **`to_postgis(if_exists="replace")` against any ORM-managed table**: it drops the table and takes the columns, constraints, pghistory triggers, and GiST indexes with it.
- **Loading data via a `RunPython` data migration**: blocks the deploy's migration transaction; use the existing one-off ECS task.
- **A container-image Lambda for GDAL**: unnecessary while ECS + the monorepo image already has GDAL, no timeout, and VPC access to RDS.

### Open questions for the repo owners

1. Are the candidate datasets (council districts, supervisorial districts, SPAs, ZIPs, tracts) actually available as shapefiles, and what CRS does LA County eGIS ship them in — 2229 (ftUS) or 4326?
2. Is the `postgis` extension present on all three RDS environments, and is `USE_IAM_AUTH` enabled in preview/production?
3. Is 50 MiB (the existing presigned cap) enough for the largest bundle, or does a `DATASET_MAX_FILE_SIZE` need to be raised?
4. Should boundary layers be platform-shared (`org_via = None`) permanently, or will partners supply their own layers (which would change `Dataset` to org-anchored)?
5. Is PostGIS available in CI today? The comment at `shelters/tests/test_shelter_filters.py:84` implies yes, but the import pipeline's tests depend on it.
6. Does the frontend need full-resolution boundaries or a simplified display layer (and therefore a `simplified` GraphQL argument backed by `ST_SimplifyPreserveTopology`)?

---

## 4. References

**GDAL**
- [`ogr2ogr` reference — all conversion, `-nlt PROMOTE_TO_MULTI`, `-t_srs`/`-s_srs`, `-lco`, `-append`/`-overwrite`/`-upsert`, `-gt`, `-makevalid`, `-skipinvalid`, `-simplify`, performance hints](https://gdal.org/en/stable/programs/ogr2ogr.html)
- [PostgreSQL / PostGIS vector driver — connection strings, layer creation options (`GEOMETRY_NAME`, `FID`, `SCHEMA`, `SPATIAL_INDEX`, `PRECISION`, `LAUNDER`, `UNLOGGED`, `OVERWRITE`), config options (`PG_USE_COPY`, `OGR_TRUNCATE`, `OGR_PG_CURSOR_PAGE`), examples](https://gdal.org/en/stable/drivers/vector/pg.html)
- [ESRI Shapefile / DBF driver](https://gdal.org/en/stable/drivers/vector/shapefile.html)
- [GeoPackage driver](https://gdal.org/en/stable/drivers/vector/gpkg.html)
- [Virtual file systems (`/vsizip/`, `/vsis3/`, `/vsimem/`)](https://gdal.org/en/stable/user/virtual_file_systems.html)
- [`ogrinfo` reference](https://gdal.org/en/stable/programs/ogrinfo.html)

**PostGIS**
- [PostGIS manual 3.5, Ch. 4 Data Management — geometry vs geography, validity, `ST_MakeValid`, spatial indexes, loading data, `shp2pgsql`](https://postgis.net/docs/manual-3.5/using_postgis_dbmanagement.html)
- [`shp2pgsql(1)` man page — full flag list (`-s`, `-D`, `-I`, `-a`, `-c`, `-d`, `-p`, `-g`, `-k`, `-S`, `-W`, `-N`, `-i`, `-T`, `-X`)](https://manpages.debian.org/trixie/postgis/shp2pgsql.1.en.html)
- [`ST_Subdivide` — set-returning, `max_vertices` default 256, index-selectivity rationale, in-place and new-table examples, geography caveat](https://postgis.net/docs/ST_Subdivide.html)
- [`ST_MakeValid`](https://postgis.net/docs/ST_MakeValid.html) · [`ST_SimplifyPreserveTopology`](https://postgis.net/docs/ST_SimplifyPreserveTopology.html) · [`ST_Transform`](https://postgis.net/docs/ST_Transform.html) · [`ST_CollectionExtract`](https://postgis.net/docs/ST_CollectionExtract.html) · [`ST_IsValidDetail`](https://postgis.net/docs/ST_IsValidDetail.html) · [`ST_Covers`](https://postgis.net/docs/ST_Covers.html) · [`ST_AsBinary`](https://postgis.net/docs/ST_AsBinary.html)

**Django / GeoDjango (6.1)**
- [`LayerMapping` data import utility — signature, `source_srs`, `encoding`, `transform`, `transaction_mode`, `save(progress/step/strict)`, and the "running out of memory with DEBUG=True" warning](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/layermapping/)
- [GeoDjango Model API — field types, `srid`, `spatial_index`, `dim`, `geography` and its limited lookup set, `max_geom_collections`](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/model-api/)
- [Installing geospatial libraries — required GEOS/GDAL/PROJ/PostGIS versions, `GEOS_LIBRARY_PATH`/`GDAL_LIBRARY_PATH`](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/install/geolibs/)
- [GDAL/OGR inspection (`DataSource`, `OGRGeometry`, `SpatialReference`, `ogrinspect`)](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/gdal/)
- [GeoDjango database API / spatial lookups](https://docs.djangoproject.com/en/6.1/ref/contrib/gis/db-api/)
- [PostgreSQL-specific model indexes — `GistIndex`, `OpClass`](https://docs.djangoproject.com/en/6.1/ref/contrib/postgres/indexes/)
- [PostgreSQL-specific migration operations — `CreateExtension`, `AddIndexConcurrently`](https://docs.djangoproject.com/en/6.1/ref/contrib/postgres/operations/)

**geopandas / pyogrio / shapely**
- [`GeoDataFrame.to_postgis` — signature, `if_exists` ∈ {fail, replace, append}, `chunksize`, SQLAlchemy+GeoAlchemy2 requirement](https://geopandas.org/en/stable/docs/reference/api/geopandas.GeoDataFrame.to_postgis.html)
- [Pyogrio introduction — `read_info`, `read_dataframe`, `read_bounds`, `write_dataframe`, `/vsizip/`, `s3://`, `columns`/`where`/`bbox`/`mask`/`skip_features`/`max_features`/`force_2d`, config options](https://pyogrio.readthedocs.io/en/latest/introduction.html)
- [Pyogrio: migration from the Fiona to the Pyogrio read/write engine](https://geopandas.org/en/stable/docs/user_guide/fiona_to_pyogrio.html)
- [Shapely 2.0 / PyGEOS migration (vectorized GEOS operations)](https://geopandas.org/en/stable/docs/user_guide/pygeos_to_shapely.html)

**CRS**
- [EPSG:2229 — NAD83 / California zone 5 (ftUS); area of use includes Los Angeles County; US survey foot; NADCON grid `us_noaa_cshpgn.tif`; alternative transformations at 4 m and 8 m accuracy](https://epsg.io/2229)
- [EPSG:6424 — NAD83(2011) / California zone 5 (ftUS), the modern equivalent](https://spatialreference.org/ref/epsg/6424/)
- [PROJ](https://proj.org/) · [spatialreference.org](https://spatialreference.org/)

**Repo-local sources cited**
- `monorepo/pyproject.toml`, `monorepo/mypy.ini`, `monorepo/apps/betterangels-backend/pyproject.toml`
- `monorepo/apps/betterangels-backend/betterangels_backend/settings.py` (lines 100-116 upload limits, 133-134 GIS apps, 273 engine)
- `monorepo/apps/betterangels-backend/common/backends/iam_dbauth/postgis/base.py`
- `monorepo/apps/betterangels-backend/common/models.py` (lines 44-130 `OrgScoped`, 231 `Location.point`), `common/checks.py`, `common/celery.py`, `common/storage.py`
- `monorepo/apps/betterangels-backend/common/permissions/checks.py`
- `monorepo/apps/betterangels-backend/clients/models.py:171` (`org_via = None` precedent)
- `monorepo/apps/betterangels-backend/shelters/models/shelter.py:81`, `shelters/enums.py:122-123`, `shelters/types/filters.py:196-220`, `shelters/admin.py:606,950,1151`
- `monorepo/apps/betterangels-backend/reports/tasks.py` (Celery dispatch pattern)
- `monorepo/Dockerfile:118-127` (`gdal-bin`), `docker-compose.yml:14` (PostGIS 17.5/3.5)
- `monorepo/.venv/lib/python3.14/site-packages/django/contrib/gis/db/backends/postgis/operations.py:26-101,138-170` (geography cast + operator map)
- `monorepo/docs/devcontainer.md`, `monorepo/docs/presigned-upload-pipeline.md`, `monorepo/docs/adr/0001-grant-based-authorization.md`
- `infrastructure/modules/services/betterangels-backend/{database.tf,ecs.tf,variables.tf}`
- `infrastructure/modules/code-pipelines/betterangels-backend/lambdas/start_migration_task/index.py`
- `infrastructure/environments/{development,production}/us-west-2/ecs/services/betterangels-backend/terragrunt.hcl`
- `/Users/paulvecchio/Development/BetterAngels/outreact-data-import` (GraphQL-API import precedent)
