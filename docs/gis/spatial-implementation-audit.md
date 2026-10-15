# Spatial implementation audit

What the GIS code does, whether it follows documented practice, and the two defects that
measurement found. Written against the implementation in `regions/`, plus the one other spatial
consumer (`shelters`).

## Version parity

Dev/CI runs `nickblah/postgis:17.5-bullseye-postgis-3.5` — Debian 11, PostGIS **3.5.2**, GEOS
**3.9.0**. RDS for PostgreSQL 17 offers PostGIS up to **3.5.6** with GEOS **3.13.0**.

| | dev / CI (`nickblah/postgis:17.5-bullseye-postgis-3.5`) | Amazon RDS for PostgreSQL 17 |
|---|---|---|
| PostGIS | 3.5.2 | up to **3.5.6** |
| GEOS | **3.9.0** | **3.13.0** (since 17.0) |
| `ST_CoverageSimplify` | **unavailable** (needs GEOS 3.12) | available |
| `ST_TileEnvelope`, `ST_AsMVT`, `feature_id_name` | available (PostGIS ≥ 3.0) | available |
| `ST_ReducePrecision` | available (PostGIS ≥ 3.0) | available |
| `ST_Subdivide`, `ST_Covers`, `ST_SimplifyPreserveTopology`, `ST_Multi` | available | available |

**Nothing this app calls needs more than PostGIS 3.0**, so the dev image is sufficient rather than
behind. Verified by running the whole backend suite against it: **1963 passed, 31 skipped**,
identical to the run against PostGIS 3.6.4 — subdivision, generated columns and the tile endpoint
included.

Two divergences remain, neither load-bearing. `ST_CoverageSimplify` needs GEOS 3.12, so it is
genuinely unavailable locally and available on RDS — and **no code calls it**, so the gap costs
nothing today; see below. The other is the PostGIS minor, 3.5.2 against 3.5.6, where an upstream
fix would reproduce locally and not in production, which is the confusing direction — but nothing
here depends on a difference between them.

## What we do, and why it is the documented approach

| choice | where | why |
|---|---|---|
| `MultiPolygonField(srid=4326)`, **geometry not geography** | `regions/models.py` | geography would force a cast or a per-query reprojection; `models.py` records that Django's `within` lookup appends `::geometry` to a geography operand and discards the GiST index |
| `ST_Subdivide` into `RegionPiece` | `services.build_region_pieces` | PostGIS's own guidance: *"denormalize your geometric data into smaller chunks so that the index can effectively subquery parts of the object"* (Data Management §4.3.4.4, which points at `ST_Subdivide`). Measured on this workload at **45 ms against 4,950 ms** without it — probe cost scales with vertices per piece, and many small pieces beat few dense ones |
| `ST_Covers`, not `ST_Contains` | `selectors._assigned_counts` | PostGIS docs: *"Generally this function should be used instead of `ST_Contains`, since it has a simpler definition"*. It also carries the index condition on its own (`point_geom @ lu.geom`), so no explicit `&&` is needed |
| **the boundaries drive, the points are probed** | `selectors._assigned_counts` | the one direction PostGIS can index for this join. The mirror query — "for each interaction, find its region" — measures **200 ms against 45 ms** for the same result. The `regions_regionlookup` view is what holds the plan there: pointed at `RegionPiece` directly the planner flips round on a small window (100 ms against 30 ms). This is what makes the live join affordable, and it is why there is no crosswalk |
| generated `Location.point_geom` | `common/migrations/0002` | the point as `geometry`, so the join has an indexable column: `geography → geometry` is an explicit-only cast, so testing `point` directly discards the geography GiST index. Casting the *boundaries* to geography instead measures **3,067 ms against 45 ms** |
| GiST via `spatial_index=True` (the default) | the `Region`, `RegionPiece` and `Location.point_geom` geometry columns | verified present on all three. `Region.kind` carries one named index rather than `db_index=True`, which would add a `varchar_pattern_ops` twin nothing uses |
| `make_valid` on import | `import_regions.normalise` | self-intersections are routine in published boundaries; one ZIP source emits a ring self-intersection that is repaired on every load |
| `&&` in the table's SRID, before any transform | `regions/tiles.py` | keeps the GiST index usable; transforming first would discard it |
| two envelopes for tiles | `regions/tiles.py` | a margined envelope decides which rows to *consider* (so buffered features are fetched) and the plain one is what `ST_AsMVTGeom` clips against — PostGIS documents that a margin must not be passed there |

## `ST_CoverageSimplify` works on RDS, not locally — and nothing calls it

**Nothing calls this function.** It was evaluated as a shared-edge-preserving alternative to
`ST_SimplifyPreserveTopology` for `Region.geom_display` and not adopted. What follows is
therefore a record of an evaluation that ran on RDS, not a description of anything the code
depends on.

The function requires `GEOSCoverageSimplifyVW` from **GEOS 3.12**. The original dev/CI image
(`nickblah/postgis:17.5-bullseye-postgis-3.5`, PostGIS 3.5.2) was compiled against **GEOS 3.9.0**
and could not run it — verified by calling it:

```
The GEOS version this PostGIS binary was compiled against (30900) doesn't support
'GEOSCoverageSimplifyVW' function (3.12)
```

**Amazon RDS for PostgreSQL does not have this problem.** From AWS's own release notes:

| RDS release | GEOS |
|---|---|
| PostgreSQL 15.3 (deprecated) | 3.11.2 |
| **PostgreSQL 17.0** | **3.13.0** |
| PostgreSQL 18.4 | 3.14.1 |

The capability arrived with RDS PostgreSQL 17.0, well past the 3.12 required. RDS for PostgreSQL
17 offers PostGIS up to 3.5.6, against 3.5.2 locally.

So the divergence ran the other way: `ST_CoverageSimplify` works in production and not locally.

**Accepted, not fixed.** The dev image stays where it is: a bump to enable a function no code
calls would change every developer's local database for nothing that reads it. Whoever adopts the
function bumps the image in the same change. The evaluation ran on RDS, against the real layers,
where the 36 gaps between adjacent regions become **0**.

**The engine version is confirmed.** The AWS infrastructure lives in a separate repository
(`/workspaces/infrastructure` in the infra container, not this one), and
`modules/services/betterangels-backend/database.tf` declares:

```hcl
engine         = "postgres"
engine_version = "17.9"
family         = "postgres17"
major_engine_version = "17"
```

That is **RDS, not Aurora**, and PostgreSQL **17.9** — past the 17.0 that brought GEOS 3.13.0. No
environment overrides `engine_version`, and the infra repository is clean, so the declared value is
the deployed one.

Two things that remain unverified, and why:

- **The PostGIS version on the instance** is not pinned anywhere in Terraform — `CREATE EXTENSION`
  happens at runtime, and AWS lists up to 3.5.6 for RDS PostgreSQL 17. Which version is actually
  installed there is not knowable from this repository.
- **The GEOS build on the instance** is inferred from AWS's release notes (3.13.0 as of 17.0),
  not observed. The AWS credentials in the infra container are an expired SSO session whose
  refresh token is also rejected, so no live query was possible. `SELECT postgis_full_version();`
  against the instance settles both points in one query and remains worth running before the fix
  is written — it would turn the inference into a fact.

## Defect 1 — independent simplification breaks shared edges

`geom_display` is produced by simplifying each polygon **on its own**
(`ST_SimplifyPreserveTopology(geom, 0.0005)`). `ST_SimplifyPreserveTopology` preserves a
polygon's own topology, not its relationship to its neighbours, so adjacent boundaries drift
apart. PostGIS's `ST_Simplify` documentation says so directly: *"This function does not preserve
boundaries shared between polygons."*

Measured across the 431 loaded regions:

| | |
|---|---|
| adjacent pairs in the raw geometry | 1090 |
| pairs that **no longer touch** after simplification | **36** |
| widest gap | 0.000531° — **59 m** |
| pairs that **newly overlap** (slivers) | 1 — Industry/Walnut, **37,915 m²** |

Worst in `zip` (90034/90230 at 59 m), which is expected: that layer is parcel-based and much of
it shares edges.

**This is inherent, not a tuning problem.** Tightening the tolerance reduces the count but never
reaches zero, at a real cost:

| tolerance | ~m | avg vertices | payload | gaps | slivers |
|---|---|---|---|---|---|
| 0.0005 (current) | 56 | 80 | 560 kB | 36 | 1 |
| 0.0002 | 22 | 142 | 979 kB | 25 | 1 |
| 0.0001 | 11 | 201 | 1372 kB | 18 | 0 |
| 0.00005 | 6 | 268 | 1824 kB | 14 | 0 |

So the options are: **upgrade the dev/CI PostGIS image** and use `ST_CoverageSimplify` — which
edits the shared edge once, for both neighbours, and is what the function exists for — or accept
sub-60 m seams between adjacent districts. There is no tolerance that fixes it.

The image change is the only blocker, and it is a dev-environment change rather than a capability
gap: RDS already has the GEOS the function needs.

Tighter tolerance is *not* recommended on its own: 2.4× the payload for 18 remaining gaps.

## Defect 2 — nothing enforces geometry validity

`import_regions` calls `make_valid`, and importer-written data measured clean (0 of 15 regions
invalid, 0 of 246 pieces). But there is no CHECK constraint, so a region written by a test, the
admin, or a script can be invalid and nothing notices.

`ST_Covers` tolerates invalid geometry, which is why this has not surfaced. `ST_AsMVTGeom` and
`ST_Intersection` are **not** tolerant — the first `ST_Intersection` attempted during this audit
failed outright with `TopologyException: Nested shells`. Server-side `ST_MakeValid` on the
tile path would absorb it; a CHECK constraint would prevent it.

## Smaller observations

- `interaction_points` reads coordinates as `Func('location__point_geom', function='ST_Y')`.
  Django ships no `ST_X`/`ST_Y` wrapper, and PostGIS defines neither for `geography`, so the
  query reads the generated geometry column rather than `point`. The cost is bounded by
  `POINT_LIMIT`. Not worth changing.
- **The point→region answer is not stored.** The live join costs 45 ms against 22 ms for a
  stored crosswalk at 20,000 interactions, and 210 ms against 211 ms at 500,000 — it tracks
  distinct locations rather than interactions, so it converges as a window grows. That is not
  worth a derived table, a backfill and a write on the read path, and with nothing derived from
  the boundaries there is no drift check to run either.
- The rollup assumes each dimension's boundaries **partition** the plane, which is what lets
  `unassigned = located − assigned` be a subtraction rather than a second spatial query. It
  holds for every layer loaded here (verified: no location matches two pieces of one dimension)
  and for any single publisher's boundary set; a dimension built by overlaying two publishers
  would break it and report no unassigned bucket rather than a wrong one.
- Shelters' `geolocation__within` filter is index-backed (`shelters_shelter_geolocation_gist`).
