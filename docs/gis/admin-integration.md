# Wiring region reports into betterangels-admin

Status of the Region work as it meets the admin app, and what remains to finish it.

## What exists today

**Backend — complete and in PR #2540.** Three queries, all tested:

```graphql
interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes): [RegionCountType!]!
regionDimensions: [RegionDimension!]!
regions(dimension, codes): [RegionType!]!
```

`RegionCountType` carries `code`, `name`, `count`, `isUnassigned`, and
`unassignedReason` (`OUTSIDE_ALL_REGIONS` | `NO_LOCATION`). `RegionDimension` is
`ZIP | CITY | COUNCIL_DISTRICT | SUPERVISORIAL_DISTRICT | SPA | COC`.
`interactionsByRegion` requires `reports.view_reports` at the payload org — the same
permission the existing Reports page already gates on.

**Frontend — nothing.** The region queries appear nowhere in `apps/betterangels-admin`
or `libs/react/betterangels-admin`. The existing Reports page is a summary only:
KPIs (total interactions, unique clients, active teams, services provided) plus six
charts (interactions over time, unique clients over time, by team, by purpose, top
provided services, top requested services). There is no geographic breakdown
anywhere in the product.

So the answer to "did we integrate a data example in the admin" is **no** — the
machinery exists and is unreachable from the UI.

## The blocker, and it is only a build-order problem

`libs/ba-platform/codegen.ts` reads its schema from
`../../apps/betterangels-backend/schema.graphql` — i.e. **whatever is on the current
branch**. Before #2540 merges, that file has no region types, so codegen cannot
produce `RegionDimension` or the operation hooks. It silently emits nothing for the
new operations rather than failing, which is why this is easy to misdiagnose.

After #2540 merges this resolves itself: the schema file carries the region types,
codegen emits them, and the UI can be built normally.

If you want to build the UI *before* the merge, point codegen at the PR's schema for
the run:

```bash
# from the worktree that has the PR checked out
cp apps/betterangels-backend/schema.graphql /tmp/schema.backup
cp /path/to/pr/schema.graphql apps/betterangels-backend/schema.graphql
cd libs/ba-platform && npx graphql-codegen --config codegen.ts
cp /tmp/schema.backup apps/betterangels-backend/schema.graphql   # restore
```

The generated types are a pure function of the schema plus the operations, so
generating against the PR's schema produces exactly what main will produce once the
PR is in. Note `codegen` must be run from `libs/ba-platform` — run from the repo root
it fails to resolve the schema with a misleading "please provide a schema" error.

## What the UI does (built)

`LocationBreakdown` renders on the Reports page beneath the existing charts and
inherits its `dateRange` and `activeOrg`, so the geographic figures always match the
KPIs above them. It offers a dimension selector (all six, from `regionDimensions`),
a **map**, a bar chart of the top 20, and a sortable table of all of them.

`RegionMap` is a **choropleth**: region polygons shaded by interaction count. Two
implementation notes worth keeping:

- It uses the map's built-in **Data layer** (`map.data`), not one `<Polygon>` per
  region. The API returns GeoJSON, which `addGeoJson` consumes directly, and
  `google.maps.Data` handles **MultiPolygon** properly — regions with islands or
  enclaves (Long Beach, Santa Catalina, the unincorporated pockets) are
  multipolygons, and a naive one-polygon-per-feature render silently draws only the
  first ring. Using `map.data` also avoids `useMapsLibrary`, since Data is core Maps
  rather than a separately-loaded library, so there is no load-order race.
- Geometry and counts are fetched separately and joined on `code` client-side.
  `interactionsByRegion` reports only regions that have interactions, so requesting
  geometry for those codes avoids shipping polygons nobody will look at — a real
  saving on the 311-region ZIP dimension.

The **unassigned buckets render separately**, deliberately. `NO_LOCATION` ("no
address on file") is a data-completeness gap the team can act on; `OUTSIDE_ALL_REGIONS`
("outside every boundary we load") is a coverage gap. Merging them into one
"Unassigned" slice would hide which problem you have. They are excluded from the chart
and the map — an 8,000-count unassigned bar beside districts numbering in the dozens
distorts the comparison, and unassigned rows have no polygon to shade.

## Maps API key

The admin app had no Maps key, so the map is the first thing here that needs one.
It reads `VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY` and **falls back to
`VITE_SHELTER_GOOGLE_MAPS_API_KEY`** so it can be evaluated without a new secret.

That fallback should not survive to production: sharing the key shares its quotas and
HTTP-referrer restrictions, and the two apps are served from different origins. Add
the admin-specific variable and the fallback can be dropped.

The key is deliberately **not** a hard requirement: `config.ts` throws for a missing
`apiUrl` but not for a missing Maps key, and `RegionMap` degrades to an explanatory
panel. The rest of the admin app works without a map, so a missing key should cost
one panel rather than the page.

## Not built

**Individual interaction points.** There is no query returning per-interaction
coordinates, so pins cannot be drawn without a new backend query — `Note` →
`Location.point`, org- and permission-scoped. That also raises a privacy question
about plotting individual client locations on a shared map, which should be decided
explicitly rather than defaulted.

## Numbers to expect

Measured on the real layers at 120,000 notes across all six dimensions, the backend
query returns in **410–1,312 ms** depending on dimension (raw SQL against subdivided
pieces). A denormalised assignment table would cut that to 2× faster but is not
adopted — see the comment in `regions/selectors.py` for why, and for the measurement
that shows the ORM subquery equivalent is 10–26× slower and linear in note count.
