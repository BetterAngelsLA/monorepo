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

## What the UI needs

1. `libs/react/betterangels-admin/src/lib/pages/reports/regions.graphql` — the two
   operations. Written; mirrors `reports.graphql`.
2. A `LocationBreakdown` component: a dimension selector (`regionDimensions`),
   a chart and table of `interactionsByRegion` for the selected range and dimension.
3. Wire it into the existing Reports page beneath the current charts, reusing the
   page's `dateRange` state and `activeOrg`.
4. Render the unassigned bucket deliberately rather than dropping it. `NO_LOCATION`
   is a data-completeness signal ("this client has no address on file") and
   `OUTSIDE_ALL_REGIONS` is a coverage signal ("this client is outside every
   boundary we load") — they mean different things to a program manager and should
   not be merged into one "Unassigned" slice.
5. `formatBucketLabel` already exists for axis labels; region codes are short enough
   to need no equivalent.

## Numbers to expect

Measured on the real layers at 120,000 notes across all six dimensions, the backend
query returns in **410–1,312 ms** depending on dimension (raw SQL against subdivided
pieces). A denormalised assignment table would cut that to 2× faster but is not
adopted — see the comment in `regions/selectors.py` for why, and for the measurement
that shows the ORM subquery equivalent is 10–26× slower and linear in note count.
