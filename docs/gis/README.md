# GIS — regional boundary data (DEV-2570 / DEV-2604)

What it takes to run, read and change the geographic grouping behind the Reports page: one
`regions` app, one importer, two tile endpoints and three GraphQL queries.

**At a glance**

- Ships: boundary polygons for six LA dimensions, a live point→region rollup, two MVT tile
  endpoints, and a Reports-page panel.
- Run it: `migrate` → `import_regions` → `load_report_test_data --with-locations` → open
  `/reports`.
- Needs: a Google Maps key for the panel (`VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`) and
  outbound network to import boundaries.
- Known defect: simplified boundaries do not meet at their shared edges (sub-60 m seams).
  Inherent to per-polygon simplification; the fix needs a newer GEOS than dev pins.

The "why" for each implementation choice lives in the code — `regions/models.py` (generated
columns, subdivision tuning), `regions/selectors.py` (the join direction, the measurements),
`regions/tiles.py` (tile geometry, the density grid), `regions/schema.py` and `regions/views.py`
(the permission gates). This file carries what the code cannot say about itself: what ships,
how to run it, where the data comes from, and the one defect measurement found.

## The code

`apps/betterangels-backend/regions/` — the app that stores boundaries and answers the grouping
queries — plus one command, `manage.py import_regions`, which populates it.

```bash
python manage.py import_regions                       # every dimension
python manage.py import_regions --kind spa --dry-run   # validate one, write nothing
python manage.py import_regions --kind city \
  --source ./cities.geojson                           # local file instead of a fetch
```

It pulls each dimension from its publisher's live ArcGIS REST endpoint as GeoJSON and replaces
the dimension wholesale, so a code that vanished from the publisher's current vintage cannot
linger. **The reprojection is the service's**: the fetch asks for `outSR=4326`. A `--source`
file is not reprojected — one declaring a non-4326 CRS fails on insert with PostGIS's SRID
mismatch, and one declaring no CRS is taken at face value as 4326, which is what the LA
bounding-box assertion is for. Export a local source in 4326. It uses the GeoDjango OGR
bindings that already ship with Django, so it needs no extra packages and no `ogr2ogr`
subprocess, and it refuses a truncated ArcGIS response rather than importing a partial layer.

Tests: `apps/betterangels-backend/regions/tests/`

## The short version

- **PostGIS, GeoDjango and `gdal-bin` are already in place** — no new infrastructure. Boundaries
  are `geometry(MultiPolygon, 4326)`, and interactions already carry a point
  (`Note.location` → `common.Location.point`), so grouping is a spatial join rather than a
  data-capture problem.
- **CRS is the biggest data hazard.** LA's native projection is EPSG:2229 (State Plane V,
  *feet*); CalEnviroScreen is 3310; TIGER is 4269; HUD is 3857. `data.lacity.org`'s GeoJSON
  export declares WGS84 lon/lat while emitting State Plane feet. The importer asserts an LA
  bounding box to catch that class of failure.
- **Every boundary set leaves coverage gaps**, so the API returns an explicit unassigned bucket
  rather than dropping interactions that fall outside every region.
- **The heavy layers need subdivided lookup geometry.** The largest boundary row — a supervisorial
  district — holds 77,918 vertices, and the largest city row 32,273, so one bounding box matches
  far more points than the polygon encloses and the real work lands in the vertex recheck:
  against the whole boundaries the rollup takes **~127 ms** at 20k interactions. `RegionPiece`
  holds subdivided parts and the rollup joins those — **~85 ms**. See `regions/models.py`
  (`RegionPiece`) and `regions/selectors.py`.
- **The rollup is a live spatial join; nothing is precomputed and nothing is backfilled.** It is
  written boundaries-first so it probes the GiST index on `Location.point_geom`. Its cost is
  driven by *distinct locations* rather than interactions, so it grows **sublinearly** with the
  report window: **~85 ms** at 20,000 interactions and **~35 ms** at 2,460 — 2.4× the time for
  8× the notes. Restricting to one dimension does **not** make it cheaper: the statement is
  dimension-agnostic and the code list is applied in Python, so `zip` alone measures the same
  ~85 ms (78 ms against 80 ms through the service).
- **Adding `Location.point_geom` rewrites `common_location` once**, under an `ACCESS EXCLUSIVE`
  lock. Plan a window, or use the expression index instead — see
  `common/migrations/0002_location_point_geom.py`.

The figures above are re-measured from the dev fixture. The tables behind them — the
`ST_Subdivide` tuning sweep and the join-direction comparison — live next to the constants they
justify, in `regions/models.py` and `regions/selectors.py`; start a measurement change there,
not here.

## Region grouping (shipped)

The `regions` app stores boundary polygons and answers "group/filter interactions by geography"
for six dimensions: postal ZIP, city, council district, supervisorial district, SPA, and CoC.

Verified live: **431 regions** — 311 postal ZIP, 88 city, 15 council district, 8 SPA,
5 supervisorial, 4 CoC.

**What the seeded data should show.** `load_report_test_data --notes 100 --with-locations` puts
nine notes in ten at one of ten real LA landmarks and leaves the rest without a point. Grouping
by council district gives several named districts and a large unassigned bucket: Long Beach,
Santa Monica and Beverly Hills are cities of their own, so they have no LA council district.
Grouping by city gives Los Angeles, Long Beach, Santa Monica and Beverly Hills, with a small
unassigned bucket for Florence-Firestone, which is unincorporated. A "No location recorded" row
holds the tenth of notes left without one.

**No outbound network?** `import_regions --source <file.geojson> --kind <dimension>` loads one
dimension from a local file instead of fetching. It takes exactly one `--kind` per run, and it
does not probe the publisher's endpoint for provenance — a local file was not fetched from the
service, so the import is fully offline.

### Running it locally

```bash
# 1. Schema. `common/0002` adds `Location.point_geom` as a stored generated column, which
#    rewrites `common_location` once, under an ACCESS EXCLUSIVE lock.
python manage.py migrate

# 2. Boundaries. Pulls each dimension from its publisher's live ArcGIS REST endpoint, so this
#    needs outbound network. Expect 431 regions and 5,685 lookup pieces.
python manage.py import_regions

# 3. Interactions for the report to place. Skipping this leaves every panel empty: the rollup
#    has nothing to bucket.
python manage.py load_report_test_data --notes 100 --with-locations
```

Then start the backend and the admin app, sign in, and open **`/reports`**. The panel sits under
the existing charts and follows their date range.

- It needs a Google Maps key (`VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`). Without one the
  panel explains itself rather than breaking the page.
- Browsing `localhost` versus `127.0.0.1` matters in local dev: the session cookie is host-only,
  so the API host must match the host in your address bar. `config.ts` handles this in development.

### Running the tests from a worktree

`pytest` builds and drops a test database named from `POSTGRES_TEST_NAME`. Several worktrees
sharing one `monorepo-db-1` container will otherwise collide on the default name, so give each
session its own:

```bash
docker exec -e POSTGRES_TEST_NAME=test_regions_fix \
  -w /workspace/.worktrees/<worktree>/apps/betterangels-backend \
  monorepo-better-angels-1 python -m pytest regions -q --create-db
# then, because --create-db leaves nothing behind on a failure:
docker exec monorepo-db-1 psql -U postgres -c "DROP DATABASE IF EXISTS test_regions_fix;"
```

Pass it on the command that needs it rather than writing it into `.env`: the shared database is
the default on purpose, and a checkout permanently pointed elsewhere hides that and leaves stale
databases behind. `docs/styleguides/python.md` has the mechanics.

### Where each dimension comes from, and whether that is the owner

Every layer records the publisher's own attribution (`copyrightText`) at import, so
"is this authoritative?" is answerable in SQL:

| dimension | publisher (from the service) | count |
|---|---|---|
| supervisorial district | LA County **Registrar-Recorder/County Clerk** | 5 |
| SPA | LA County **Dept. of Public Health** | 8 |
| CoC | **U.S. Dept. of Housing and Urban Development** (HUD's own ArcGIS org) | 4 |
| postal ZIP | **CAMS, USPS** — parcel-based, via LA County | 311 |
| council district | City of LA — *publishes no `copyrightText`* | 15 |
| city | LA County — *publishes no `copyrightText`* | 88 |

Two layers expose no ownership text, which is recorded as an empty attribution rather than
glossed over: for those, the service itself does not evidence authority.

**One caveat on reading that column.** A `--source` import writes an empty attribution too,
because a local file was not fetched from the service and probing its endpoint would
misattribute it (the command says so on stdout). So an empty `source_attribution` means "loaded
locally, or the publisher publishes none" — the two are distinguishable by `source_item_id`,
which is only set on a fetched import.

Two deliberate source choices worth knowing:

- **ZIP is postal ZIP, not Census ZCTA.** ZCTA is a statistical approximation built from census
  blocks; a geocoded street address carries a *USPS* ZIP. Using ZCTA silently dropped 10 real
  ZIPs (including 90090) and pulled in 22 out-of-county spill ZCTAs. USPS publishes no official
  boundary file, so no postal polygon set is perfectly authoritative — this one is parcel-based
  with USPS/Assessor/CAMS credits.
- **`Unincorporated` is not a city.** The county city layer carries 190 polygons of that status.
  It is the *absence* of a city, and loading it would put a pseudo-city holding two-thirds of the
  county's land into every "top cities" rollup. A point in none of the 88 cities is
  unincorporated by definition, and deriving it stays correct when the county annexes a pocket.

### Sources that look right but are not

- **LAHSA *does* publish SPA geometry** — a live polygon layer, updated 2026-09. Only their
  *counts* are tables.
- **The CA state DCAT feed is nearly useless for this work** — 3,950 datasets but exactly
  **one** LA-relevant boundary layer. Use the Geoportal search API
  (`gis.data.ca.gov/api/search/v1/collections/dataset/items?q=...`) instead.

Also superseded, and easy to get wrong: the **congressional map was replaced by Prop 50
(Nov 2025)** — Caltrans' layer is two cycles stale; **CalEnviroScreen 5.0** supersedes
4.0/3.0/2.0; and **2022 SPAs/Health Districts** supersede the 2012 versions, which are still
served side by side.

## The API surface

```graphql
reportSummary(organizationId, startDate, endDate, dimension, regionCodes): ReportSummaryType!
interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes): [RegionCountType!]!
interactionMap(organizationId, startDate, endDate, limit, dimension, regionCodes): InteractionMapType!
interactionScope(organizationId, startDate, endDate): InteractionScopeType!
regionDimensions: [RegionDimensionInfo!]!
```

```http
GET /regions/tiles/<kind>/<z>/<x>/<y>.mvt           # public boundaries, authenticated session
GET /regions/tiles/density/<z>/<x>/<y>.mvt?org_id=  # interaction density, reports.view_reports
GET /reports/export/?org_id=&start_date=&end_date=&dimension=&codes=  # the grouped CSV
```

`reportSummary` accepts the same `dimension`/`regionCodes` pair as the location rollup, and
applies it to the **whole summary** — the KPI row and all six charts — not to one of them. A
dimension alone means every region of it; codes narrow to those regions; an explicit empty code
list matches nothing. Codes without a dimension are refused, because a code is not unique across
dimensions. The CSV export reads the same pair (lowercase `dimension`, repeated or comma-separated
`codes`), so a download covers the page's group rather than silently widening back to the
organisation.

`RegionCountType` carries `kind`, `code`, `name`, `count`, `isUnassigned` and `unassignedReason`
(`OUTSIDE_ALL_REGIONS` | `NO_LOCATION`) — one unassigned bucket *per dimension* when the rollup
is ungrouped, because every dimension has its own coverage gaps. `kind` is empty when the rollup
covers one dimension and present when it spans all of them, where a code alone is ambiguous: `"1"`
is simultaneously a council district, an SPA and a supervisorial district. `RegionDimension` is
`ZIP | CITY | COUNCIL_DISTRICT | SUPERVISORIAL_DISTRICT | SPA | COC`, and `regionDimensions`
returns the display names with it so a client does not keep a second copy of the vocabulary.

**Authorization differs by query, deliberately.** `interactionMap` returns coordinates and so
carries two gates — `reports.view_reports` at the payload org, **and** the note read scope — while
`interactionsByRegion` returns counts and carries only the first. The boundary tile and
`regionDimensions` need nothing beyond a session. `interactionScope` carries the same gates as
`interactionMap`, because it answers the same question about the same notes.

Why the second gate is a filter rather than a grant predicate, and why the two must not be
confused, is stated once, in `regions/schema.py` (`interaction_map`).

An empty `regionCodes` matches **nothing** and needs no `dimension`; a non-empty list requires one.
`interactionMap` and the density tile refuse a lone `dimension` (nothing to narrow), while
`reportSummary` scopes to every region of it.

## The admin panel

The Reports page is **scoped by a geographic group**: a dimension chosen at the top of the page,
optionally narrowed to specific regions. The group control (`ReportGroupControls`) sits above the
KPI row, and the same selection travels three ways, so no surface can disagree with another:

- `reportSummary` reads it, so the KPI row and every chart are calculated over the group;
- `interactionsByRegion` reads it, so the region table lists that dimension's regions;
- `interactionMap` and the density tile read it when specific regions are selected, so a
  drill-down draws only the interactions inside the shapes it frames.

A dimension alone is a **scope**, not just a grouping label: choosing City counts only
interactions whose location falls inside a city boundary, which is why the total can be smaller
than the ungrouped one. The breakdown's "not attributed to a city" figure names that remainder.
The heatmap deliberately stays county-wide — the boundaries over it are the grouping, and the
surface is the whole service area the group sits in.

`LocationBreakdown` renders beneath the charts and inherits the page's `dateRange`, `activeOrg`
and group. It provides:

- a **region table** with the unassigned buckets labelled by cause;
- `RegionMap`, which draws region boundaries from the tile endpoint when a grouping is chosen,
  with a **Heatmap** / **Clusters** toggle in its card header and a `filteredTo` caption when the
  map is narrowed.

The group control's two selects are fed by `regionDimensions` (loaded boundaries only) and the
unfiltered `interactionsByRegion` rollup, so a reader who picks one region still finds the others
in the list. An empty selection means "every region of the grouping"; there is no "All" row,
because an empty selection already is all.

**The Maps key is the admin's own.** `VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`, plumbed
through `.github/workflows/default.yml` and `docker-compose-ci.yml`. It is deliberately not
shelter-web's: one key shares its quotas and HTTP-referrer restrictions, and the two apps are
served from different origins, so no single referrer list can be correct for both. This needs a
repository secret of the same name before the map renders in preview or production; absent, the
panel shows its own message and the rest of the page is unaffected.

**The build-order detail.** `libs/ba-platform/codegen.ts` reads its schema from
`../../apps/betterangels-backend/schema.graphql` — whatever is on the *current* branch. Codegen
against a schema that lacks the region types does not fail loudly: it emits nothing for the new
operations, so the hooks simply do not exist and the failure looks like a typo in an import. When
generating on a branch whose `schema.graphql` predates the region types, borrow the schema from
the worktree that has them for one run, then put yours back:

```bash
# cwd is the worktree you are generating on; OTHER is the one with the region types.
OTHER=/path/to/the/worktree/with/regions
cp apps/betterangels-backend/schema.graphql /tmp/schema.backup
cp "$OTHER/apps/betterangels-backend/schema.graphql" apps/betterangels-backend/schema.graphql
(cd libs/ba-platform && npx graphql-codegen --config codegen.ts)
cp /tmp/schema.backup apps/betterangels-backend/schema.graphql   # restore
```

The `cd` runs in a subshell so the restore path still resolves; the backup is taken before the
overwrite so a failed codegen still leaves the branch recoverable.

## The one known defect: simplified boundaries do not meet

`geom_display` is produced by simplifying each polygon **on its own**
(`ST_SimplifyPreserveTopology(geom, 0.0005)`). That function preserves a polygon's own topology,
not its relationship to its neighbours, so adjacent boundaries drift apart. PostGIS's
`ST_Simplify` documentation says so directly: *"This function does not preserve boundaries shared
between polygons."*

Measured once, in a probe whose queries were not kept — so these are a record rather than
something you can re-run from the repository (`regions/models.py` carries the figures that are
re-measured and kept current):

| | |
|---|---|
| adjacent pairs in the raw geometry | 1090 |
| pairs that **no longer touch** after simplification | **36** |
| widest gap | 0.000531° — **59 m** |
| pairs that **newly overlap** (slivers) | 1 — Industry/Walnut, **32,396 m²** |

Worst in `zip` (90034/90230 at 59 m), which is expected: that layer is parcel-based and much of
it shares edges.

**This is inherent, not a tuning problem.** Tightening the tolerance reduces the count but never
reaches zero, at a real cost:

| tolerance | ~m (latitude) | avg vertices | payload¹ | gaps | slivers |
|---|---|---|---|---|---|
| 0.0005 (current) | 56 | 80 | 560 kB | 36 | 1 |
| 0.0002 | 22 | 142 | 979 kB | 25 | 1 |
| 0.0001 | 11 | 201 | 1372 kB | 18 | 0 |
| 0.00005 | 6 | 268 | 1824 kB | 14 | 0 |

¹ A vertex-cost estimate (vertices × 16 B), **not** a GeoJSON byte count. For scale, the same
`Region.geom_display` as GeoJSON across the 431 regions is about 1.0 MB at 0.0005, and the
full-resolution `Region.geom` for all six dimensions is about 27.8 MB — different measures of the
same data, not competing figures for one quantity.

So the options are: simplify the shared edge **once, for both neighbours** — which is what
`ST_CoverageSimplify` does, and why it exists — or accept sub-60 m seams between adjacent
districts. There is no tolerance that fixes it. Tighter tolerance is *not* a substitute: 2.4× the
payload for 18 remaining gaps.

**One related constraint.** `regions_region` carries `CHECK (ST_IsValid(geom))` (`regions/0006`).
`import_regions` repairs geometry with `make_valid`, but a test, a script or the admin could still
write an invalid row, and one is enough to take out a whole dimension's tiles: `ST_Covers`
tolerates invalid geometry, `ST_AsMVTGeom` and `ST_Intersection` do not, and an `ST_Intersection`
against an invalid boundary fails outright with `TopologyException: Nested shells`.

## Version parity

Dev/CI runs `nickblah/postgis:17.5-bullseye-postgis-3.5` — PostGIS **3.5.2**, GEOS **3.9.0**.
RDS for PostgreSQL 17 offers PostGIS up to 3.5.6 with GEOS 3.13.0, so `ST_CoverageSimplify` —
the fix for the defect above — needs GEOS 3.12 and is **available in production but not
locally**. Adopting it means bumping the dev image in the same change. Nothing else this app
calls needs more than PostGIS 3.0.

*The dev column is the image `docker-compose.yml` pins. The RDS column is that cluster's
parameter group, not something this repository can probe; treat it as context.*

## Open questions

1. **LACDMH service areas have no public polygon layer.** The "adopt SPAs as the proxy" option
   was taken for now — the shipped `spa` dimension is LA County Dept. of Public Health's Service
   Planning Areas, which is a *health* geography, not DMH's. If DMH service areas are ever
   needed, that is a new dimension with its own source, and none was found.
2. **Unincorporated communities.** The county publishes 190 `Unincorporated` polygons plus a CSA
   layer. They are a legal status and a statistical geography respectively, not a third kind of
   city, and both overlap the city layer. Deliberately not a dimension yet; "we have no
   boundary" is the current answer, and it is the honest one until a layer with an owner exists.
3. **The admin's Maps key needs a repository secret.** See above: until the secret exists the map
   panel degrades with its own message and the rest of the page is unaffected.
