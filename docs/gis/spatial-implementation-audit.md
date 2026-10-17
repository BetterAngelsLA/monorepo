# Spatial implementation audit

What the GIS code does, whether it follows documented practice, and where the defect that
measurement found now stands. Written against the implementation in `regions/`, plus the one other
spatial consumer (`shelters`).

## Version parity

Dev/CI runs `nickblah/postgis:17.5-bullseye-postgis-3.5` — Debian 11, PostGIS **3.5.2**, GEOS
**3.9.0**. RDS for PostgreSQL 17 offers PostGIS up to **3.5.6** with GEOS **3.13.0**.

| | dev / CI (`nickblah/postgis:17.5-bullseye-postgis-3.5`) | Amazon RDS for PostgreSQL 17 |
|---|---|---|
| PostGIS | 3.5.2 | up to **3.5.6** |
| GEOS | **3.9.0** | **3.13.0** (since 17.0) |
| `ST_CoverageSimplify` | **unavailable** (needs GEOS 3.12) | available |
| `ST_TileEnvelope`, `ST_AsMVT`, `feature_id_name` | available (PostGIS ≥ 3.0) | available |
| `ST_ReducePrecision` | available (PostGIS ≥ 3.1) | available |
| `ST_Subdivide`, `ST_Covers`, `ST_SimplifyPreserveTopology`, `ST_Multi` | available | available |

**Nothing this app calls needs more than PostGIS 3.0.** The only function in the table that the
dev image cannot run is `ST_CoverageSimplify`, which needs GEOS 3.12 — and no code calls it. It
matters only as the fix for Defect 1 below, which therefore needs the image bumped in the same
change that adopts it.

*The dev column is the image this repository pins (`docker-compose.yml`). The RDS column is the
cluster's parameter group at the time of writing, not something this repo can probe; treat it as
context rather than as a checked fact.*

## What we do, and why it is the documented approach

| choice | where | why |
|---|---|---|
| `MultiPolygonField(srid=4326)`, **geometry not geography** | `regions/models.py` | geography would force a cast or a per-query reprojection; `models.py` records that Django's `within` lookup appends `::geometry` to a geography operand and discards the GiST index |
| `ST_Subdivide` into `RegionPiece` | `services.build_region_pieces` | PostGIS's own guidance: *"denormalize your geometric data into smaller chunks so that the index can effectively subquery parts of the object"* (Data Management §4.3.4.4, which points at `ST_Subdivide`). Measured on this workload at **~85 ms against ~127 ms** without it — probe cost scales with vertices per piece, and many small pieces beat few dense ones |
| `ST_Covers`, not `ST_Contains` | `selectors._assigned_counts` | PostGIS docs: *"Generally this function should be used instead of `ST_Contains`, since it has a simpler definition"*. It also carries the index condition on its own (`point_geom @ r.geom`), so no explicit `&&` is needed |
| **the boundaries drive, the points are probed** | `selectors._assigned_counts` | the direction PostGIS can index for this join, though on this fixture the margin is smaller than the direction is usually described as buying: the mirror query — "for each interaction, find its region" — measured **81 ms against ~85 ms** for the same result. The `regions_regionlookup` view is kept for its **fallback arm** (a region with no piece), not for a speed-up: pointed at `RegionPiece` directly the planner does flip to a note-driven plan on a small window, but that measures 42 ms against 29 ms at ~660 notes and 8 ms against 28 ms at ~100, so neither shape is uniformly faster |
| generated `Location.point_geom` | `common/migrations/0002` | the point as `geometry`, so the join has an indexable column: `geography → geometry` is an explicit-only cast, so testing `point` directly discards the geography GiST index. Casting the *boundaries* to geography instead measures **~2,200 ms against ~85 ms** |
| GiST where a query actually probes the column | `Location.point_geom` (`common/0003`) and `Region.geom_display` (`regions/0005`) | both carry the index condition in the plans. `RegionPiece.geom` also has one (from `0001`), and **no read probes it**: every spatial read drives from the lookup geometry and probes `Location.point_geom`, while the piece table is reached by a `Parallel Seq Scan` filtered on `region_id`. It is kept as a fallback for a query that tests a piece directly, not because one does. `Region.geom` carries **no** spatial index: no read puts a spatial predicate on the full-resolution column, so one there would only be rebuilt on every import. `geom_display` needs one declared by hand because a `GeneratedField` is never auto-indexed, and the planner uses it at deep zoom (a z14 ZIP tile intersects ~18 of 311 regions) while correctly preferring a `kind` scan at coarse zoom. `Region.kind` carries one named index rather than `db_index=True`, which would add a `varchar_pattern_ops` twin nothing uses |
| `make_valid` on import | `import_regions.normalise` | self-intersections are routine in published boundaries; one ZIP source emits a ring self-intersection that is repaired on every load |
| `&&` in the table's SRID, before any transform | `regions/tiles.py` | keeps the GiST index usable; transforming first would discard it |
| two envelopes for tiles | `regions/tiles.py` | a margined envelope decides which rows to *consider* (so buffered features are fetched) and the plain one is what `ST_AsMVTGeom` clips against — PostGIS documents that a margin must not be passed there |

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
full-resolution `Region.geom` for all six dimensions is about 27 MB — different measures of the
same data, not competing figures for one quantity.

So the options are: simplify the shared edge **once, for both neighbours** — which is what
`ST_CoverageSimplify` does, and why it exists — or accept sub-60 m seams between adjacent
districts. There is no tolerance that fixes it.

That fix needs GEOS 3.12. Dev/CI has 3.9.0 and RDS has 3.13.0, so it is available in production
and not locally; adopting it means bumping the dev image in the same change. Tighter tolerance is
*not* a substitute: 2.4× the payload for 18 remaining gaps.

## Geometry validity is constrained

`import_regions` calls `make_valid`, and importer-written data measured clean (0 of 431 regions
invalid, 0 of 5,685 pieces). A test, the admin or a script can still write a row outside the
importer, and one invalid boundary is enough to take out a whole dimension's tiles: `ST_Covers`
tolerates invalid geometry, but `ST_AsMVTGeom` and `ST_Intersection` do not, and an
`ST_Intersection` against the loaded layers fails outright with `TopologyException: Nested
shells`.

`regions/0006` therefore adds `CHECK (ST_IsValid(geom))` to `regions_region`
(`regions_region_geom_valid`). `ST_IsValid` is IMMUTABLE, so it is legal in a CHECK. The
constraint validates existing rows when it is applied, so an already-invalid row fails the
migration rather than reaching the tile path.

## Smaller observations

- `interaction_points` reads coordinates as `Func('location__point_geom', function='ST_Y')`.
  Django ships no `ST_X`/`ST_Y` wrapper, and PostGIS defines neither for `geography`, so the
  query reads the generated geometry column rather than `point`. The cost is bounded by
  `POINT_LIMIT`. Not worth changing.
- **The point→region answer is not stored.** The rollup's cost tracks *distinct locations*
  rather than interactions, so it grows sublinearly with the report window: measured on the
  431-region fixture, ~85 ms at 20,000 interactions and ~35 ms at 2,460 — 2.4× the time for
  8× the notes. Nothing derived from the
  boundaries means nothing to backfill, nothing to keep fresh, and no write on the read path.
- **The rollup does not assume each dimension's boundaries partition the plane.** Every count is
  of *distinct* notes, and the unassigned bucket is ``located − (distinct notes covered by any
  region of that kind)``, which stays well defined and non-negative when same-kind regions
  overlap. That matters, because the shipped layers **do** overlap: measured on the 431-region
  fixture, same-kind regions overlap with positive area in 27 ZIP pairs, **91 city pairs** and 4
  supervisorial pairs. Named buckets may therefore sum to more than the located total — a note
  inside two overlapping regions genuinely belongs to both — but the distinct-covered figure the
  unassigned bucket subtracts never exceeds it. **This is a property of the code, not a
  measurement of the layers' behaviour on the 4,000 sampled locations.**
- Shelters' `geolocation__within` filter is **not** index-backed, and the reason is the one
  `regions/models.py` records: `geolocation` is `geography=True`, and Django's PostGIS backend
  appends `::geometry` to a geography operand for an operator that is not geography-native
  (`operations.check_geography`), which discards the geography GiST index. It is a pre-existing
  cost in a different app, noted here because it is the trap the region tables avoid with a
  generated `point_geom`.
