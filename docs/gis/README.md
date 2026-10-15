# GIS — regional boundary data (DEV-2570 / DEV-2604)

Everything we know about getting official Los Angeles boundary data into PostGIS so
client interactions can be aggregated by geography (ZIP, council district, SPA,
supervisorial district, …).

## Start here

| Document | What it is |
|---|---|
| [dev-2604-shapefile-spike.md](dev-2604-shapefile-spike.md) | **The spike deliverable.** Picks one region, names the official source, and shows the verified load + query process end to end. Read this first. |
| [spatial-implementation-audit.md](spatial-implementation-audit.md) | **What the GIS code does and where it falls short** — the documented-practice choices, plus two measured defects (broken shared edges between adjacent regions, and nothing enforcing geometry validity). Read before changing anything spatial. |
| [la-geodata-sources-expanded.md](la-geodata-sources-expanded.md) | **The source inventory** — 283 services probed live, 266 real feature counts, 228 verified URLs, plus 33 supersessions and 19 dead/empty sources. Read this before importing anything. |

## The code

`apps/betterangels-backend/regions/` — the app that stores boundaries and answers the
grouping queries — plus one command, `manage.py import_regions`, which populates it.

```bash
python manage.py import_regions                      # every dimension
python manage.py import_regions --kind spa --dry-run # validate one, write nothing
python manage.py import_regions --kind city \
  --source ./cities.geojson                          # local file instead of a fetch
```

It pulls each dimension from its publisher's live ArcGIS REST endpoint as GeoJSON,
normalises to `MultiPolygon/EPSG:4326`, and replaces the dimension wholesale so a code
that vanished from the publisher's current vintage cannot linger. It uses the GeoDjango
OGR bindings that already ship with Django, so it needs no extra packages and no
`ogr2ogr` subprocess. It also refuses a truncated ArcGIS response rather than importing a
partial layer.

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
- **The heavy layers need subdivided lookup geometry.** One city multipolygon has ~310k vertices
  in one row, so the GiST index prunes nothing: the rollup takes 4,950 ms at 20k interactions
  against the whole boundaries. `RegionPiece` holds subdivided parts and the rollup joins that —
  **45 ms**. See `dev-2604-shapefile-spike.md` §7a.
- **The rollup is a live spatial join; nothing is precomputed and nothing is backfilled.** It is
  written boundaries-first so it probes the GiST index on `Location.point_geom`. Its cost tracks
  *distinct locations* rather than interactions, so a wider report window does not widen it:
  **45 ms** at 20k interactions and **210 ms** at 500k.
- **Adding `Location.point_geom` rewrites `common_location` once**, under an `ACCESS EXCLUSIVE`
  lock. Plan a window, or use the expression index instead — see
  `common/migrations/0002_location_point_geom.py`.

`spatial-implementation-audit.md` carries the measurements behind each of these, and the two
known defects.

## Region grouping (backend, shipped)

The `regions` app stores boundary polygons and answers "group/filter interactions by
geography" for six dimensions: postal ZIP, city, council district, supervisorial district, SPA,
and CoC.

```bash
python manage.py import_regions                       # all six dimensions
python manage.py import_regions --kind council_district --kind spa
python manage.py import_regions --dry-run             # validate, write nothing
```

Verified live: **431 regions** — 311 postal ZIP, 88 city, 15 council district, 8 SPA,
5 supervisorial, 4 CoC.

### Seeing it

The importer populates the backend. To look at the data, the admin app renders the region
boundaries over a heatmap, with a clustered view of the individual interactions, on the
Reports page:

1. Start the backend and the admin app, then sign in and open **`/reports`**.
2. The panel sits under the existing charts and follows their date range.
3. It needs a Google Maps key. The admin app falls back to shelter-web's
   `VITE_SHELTER_GOOGLE_MAPS_API_KEY`; without any key the panel explains itself
   rather than breaking the page.
4. Browsing `localhost` versus `127.0.0.1` matters in local dev: the session cookie is
   host-only, so the API host must match the host in your address bar. `config.ts`
   handles this for you in development.

See `admin-integration.md` for the GraphQL surface, the permission gates, and the
codegen build-order gotcha.

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

Two layers expose no ownership text, which is recorded as an empty attribution
rather than glossed over: for those, the service itself does not evidence authority.

Two deliberate source choices worth knowing:

- **ZIP is postal ZIP, not Census ZCTA.** ZCTA is a statistical approximation built
  from census blocks; a geocoded street address carries a *USPS* ZIP. Using ZCTA
  silently dropped 10 real ZIPs (including 90090) and pulled in 22 out-of-county
  spill ZCTAs. USPS publishes no official boundary file, so no postal polygon set is
  perfectly authoritative — this one is parcel-based with USPS/Assessor/CAMS credits.
- **`Unincorporated` is not a city.** The county city layer carries 190 polygons of
  unincorporated land alongside the 88 cities. It is a legal status, not a place, so
  the import filters to `CITY_TYPE='City'`. "Not in any city" still works and needs no
  dimension — a point matching none of the 88 is unincorporated by definition, and
  deriving it is self-correcting when the county annexes a pocket.

GraphQL: `interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes)`,
`interactionMap(organizationId, startDate, endDate, limit, dimension, regionCodes)`, and
`regionDimensions` (which dimensions have boundaries loaded).

Boundaries are **not** served over GraphQL: the map draws them as vector tiles from
`/regions/tiles/<kind>/<z>/<x>/<y>.mvt`. A dimension's polygons are 1.25 MB across the five LA
layers and a tile in view is a few kB, so the tiles are the whole reason the map does not pull
a whole layer to draw a corner of it.

**Authorization differs deliberately by query.** `interactionMap` returns coordinates and
carries two gates: `reports.view_reports` at the payload org, and the note read scope via
`filter_for_user(..., [NotePermissions.VIEW])` — a pin is a note's location, so it inherits
the note scope, and `ORG_ADMIN` holds the report permission with none of the note one.
`interactionsByRegion` returns counts and carries `reports.view_reports` alone, the same
authority as `reportSummary` beside it. `regionDimensions` requires only an authenticated
session, and so does the tile endpoint: both serve public reference boundaries, identical for
every tenant, and neither selects an org- or client-scoped column.

### Sources that look right but are not

- **LAHSA *does* publish SPA geometry** — a live polygon layer, updated 2026-09. Only their
  *counts* are tables.
- **The CA state DCAT feed is nearly useless for this work** — 3,950 datasets but exactly
  **one** LA-relevant boundary layer. Use the Geoportal search API
  (`gis.data.ca.gov/api/search/v1/collections/dataset/items?q=...`) instead.

Also superseded, and easy to get wrong: the **congressional map was replaced by Prop 50
(Nov 2025)** — Caltrans' layer is two cycles stale; **CalEnviroScreen 5.0** supersedes
4.0/3.0/2.0; and **2022 SPAs/Health Districts** supersede the 2012 versions, which are
still served side by side.

## Open questions

1. **LACDMH service areas have no public polygon layer** — needs a decision (extract from
   their web app, ask them, or adopt SPAs as the proxy).
2. **The Google Maps key is shared with shelter-web.** The admin map falls back to
   `VITE_SHELTER_GOOGLE_MAPS_API_KEY` so evaluating this needs no new secret. It wants its
   own key before production, since sharing one also shares its quotas and referrer
   restrictions.
