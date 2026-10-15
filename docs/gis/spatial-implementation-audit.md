# Spatial implementation audit

What the GIS code does, whether it follows documented practice, and the two defects that
measurement found. Written against the implementation in `regions/`, plus the one other spatial
consumer (`shelters`).

## What we do, and why it is the documented approach

| choice | where | why |
|---|---|---|
| `MultiPolygonField(srid=4326)`, **geometry not geography** | `regions/models.py` | geography would force a cast or a per-query reprojection; `models.py` records that Django's `within` lookup appends `::geometry` to a geography operand and discards the GiST index |
| `ST_Subdivide` into `RegionPiece` | `services.build_region_pieces` | PostGIS's own guidance: indexed subdivided datasets produce fewer index "hit" cases. Measured on this workload at **475 ms vs 985 ms** without it — probe cost scales with vertices per piece, and many small pieces beat few dense ones |
| `ST_Covers`, not `ST_Contains` | `services.ensure_location_regions` | PostGIS docs: *"Generally this function should be used instead of `ST_Contains`, since it has a simpler definition"* |
| denormalise the point→region result | `LocationRegion` | PostGIS docs recommend "denormalizing" spatial data for large polygons queried in small areas; the civic-data world calls the result a *crosswalk*. Measured here at **8.4 ms against 136 ms** for the same rollup done spatially per read (16×) |
| GiST via `spatial_index=True` (the default) | all three geometry columns | verified present on `regions_region`, `regions_regionpiece` and `common_location` |
| `make_valid` on import | `import_regions.normalise` | self-intersections are routine in published boundaries; one ZIP source emits a ring self-intersection that is repaired on every load |
| `&&` in the table's SRID, before any transform | `regions/tiles.py` | keeps the GiST index usable; transforming first would discard it |
| two envelopes for tiles | `regions/tiles.py` | a margined envelope decides which rows to *consider* (so buffered features are fetched) and the plain one is what `ST_AsMVTGeom` clips against — PostGIS documents that a margin must not be passed there |

**No `ST_CoverageSimplify`.** It is the correct tool for the defect below and this build cannot
run it: PostGIS 3.5.2 here was compiled against **GEOS 3.9.0**, and the function requires
`GEOSCoverageSimplifyVW` from GEOS 3.12. Verified by calling it:
`The GEOS version this PostGIS binary was compiled against (30900) doesn't support
'GEOSCoverageSimplifyVW'`.

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

So the options are: **upgrade the PostGIS image to one built against GEOS ≥ 3.12** and use
`ST_CoverageSimplify` (which edits the shared edge once, for both neighbours — this is what the
function exists for), or accept sub-60 m seams between adjacent districts. There is no tolerance
that fixes it.

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

- `interaction_points` reads coordinates as `Func(Cast('location__point', GeometryField()),
  function='ST_Y')`. The cast is required — PostGIS has no `ST_Y(geography)` — and the cost is
  bounded by `POINT_LIMIT`. Not worth changing.
- Denormalisation means freshness is on us; `LocationRegion` is refreshed by
  `import_regions(force=True)` and topped up incrementally on read. The research's suggested
  drift check (`SELECT … EXCEPT SELECT …` against the live spatial query) would be a reasonable
  safety net and does not exist yet.
- `UNIQUE(location_id, kind)` assumes non-overlapping layers per dimension. This data has no
  overlapping locations, so it holds — but nothing enforces it, and school districts and
  unincorporated areas are the kind of layer that would break it.
- Shelters' `geolocation__within` filter is index-backed (`shelters_shelter_geolocation_gist`).
