# Wiring region reports into betterangels-admin

How the region queries meet the admin app, what ships in PR #2540, and the one build
detail that is easy to lose an afternoon to.

## What ships

**Backend — four queries, all tested:**

```graphql
interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes): [RegionCountType!]!
regionDimensions: [RegionDimension!]!
regions(dimension, codes): [RegionType!]!
interactionMap(organizationId, startDate, endDate, limit, dimension, regionCodes): InteractionMapType!
```

`RegionCountType` carries `kind`, `code`, `name`, `count`, `isUnassigned`, and
`unassignedReason` (`OUTSIDE_ALL_REGIONS` | `NO_LOCATION`). `kind` is present because a
rollup can span every dimension at once, where a code alone is ambiguous — `"1"` is
simultaneously a council district, an SPA and a supervisorial district. `RegionDimension` is
`ZIP | CITY | COUNCIL_DISTRICT | SUPERVISORIAL_DISTRICT | SPA | COC`.

`interactionMap` returns points and a truncation flag.

**Authorization.** `interactionsByRegion` and `interactionMap` need
`reports.view_reports` **and** `notes.view_note`, and the rows are then passed through
`filter_for_user(..., [NotePermissions.VIEW])`. `reports.view_reports` alone is not
enough: it is held by roles that are not entitled to read notes, and `ORG_ADMIN` is one
of them — it is **denied** in the tests. `regions` and `regionDimensions` are public
reference data and need only an authenticated user.

**Frontend — built, in this PR.** `LocationBreakdown` renders on the Reports page
beneath the existing charts and inherits their `dateRange` and `activeOrg`, so the
geographic figures always match the KPIs above. It provides:

- a **dimension selector** over all six, from `regionDimensions`;
- a **drill-down selector** listing the regions that have interactions, with counts, so
  the map can answer "show me the SPA 4 visits" rather than only "every visit, coloured
  by SPA";
- a **region table** with the unassigned buckets labelled by cause;
- `RegionMap`, which draws region boundaries when a grouping is chosen, with a **Heatmap** /
  **Clusters** toggle in its card header and a `filteredTo` caption when the map is narrowed.

The map needs `VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`. Without it the panel degrades to
an explanatory message rather than taking the page down — see
`apps/betterangels-admin/config.ts`.

## The Maps key is the admin's own

`VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`, plumbed through `.github/workflows/default.yml`
and `docker-compose-ci.yml`. It is deliberately not shelter-web's: one key shares its quotas and
its HTTP-referrer restrictions, and the two apps are served from different origins, so no single
referrer list can be correct for both.

**This needs a repository secret of the same name before the map renders in preview or
production**, with the key's referrer restrictions covering the admin's origins. Absent, the map
panel shows its own message and the rest of the page is unaffected.

## The build-order detail

`libs/ba-platform/codegen.ts` reads its schema from
`../../apps/betterangels-backend/schema.graphql` — whatever is on the **current**
branch. Codegen against a schema that lacks the region types does not fail loudly: it
emits nothing for the new operations, so the hooks simply do not exist and the failure
looks like a typo in an import.

While this branch is unmerged, point codegen at its schema for one run:

```bash
# from the worktree that has the branch checked out
branch_root=$(git rev-parse --show-toplevel)
cp apps/betterangels-backend/schema.graphql /tmp/schema.backup
cp "$branch_root/apps/betterangels-backend/schema.graphql" apps/betterangels-backend/schema.graphql
cd libs/ba-platform && npx graphql-codegen --config codegen.ts
cp /tmp/schema.backup apps/betterangels-backend/schema.graphql   # restore
```

The generated types are a pure function of schema plus operations, so generating
against the branch schema produces exactly what `main` will produce once merged. Run it
from `libs/ba-platform`: from the repo root it fails to resolve the schema with a
misleading "please provide a schema" error.

## Not built

**Geometry editing.** Boundaries are imported, not edited. There is no UI to adjust a
region or draw a new one, and the importer replaces a whole dimension at a time.

**A third-party heatmap library.** Google removed `visualization.HeatmapLayer` in Maps JS
API 3.65. The gradient is drawn on a canvas instead, which needs no dependency; deck.gl remains
the alternative if a standard implementation is wanted later.

**The unincorporated-communities dimension.** Documented in
`unincorporated-communities.md`, not implemented.
