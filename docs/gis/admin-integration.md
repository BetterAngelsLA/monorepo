# Wiring region reports into betterangels-admin

How the region queries meet the admin app, and the one build detail that is easy to lose an
afternoon to.

## What ships

**Backend — four queries:**

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

**Authorization differs by query, deliberately.**

`interactionMap` returns coordinates, so it carries two gates: `reports.view_reports` at the
payload org, **and** the note read scope, applied as
`filter_for_user(..., [NotePermissions.VIEW])`. The second is not redundant — a pin is a
note's location, so it inherits the note scope, and `ORG_ADMIN` holds `reports.view_reports`
with no note permission at all. `test_org_admin_without_note_permission_is_denied` pins that
it receives no pins.

It is deliberately **not** `require_can(..., NotePermissions.VIEW)`: notes are a legacy
domain, no `Role` carries `notes.view_note`, and a grant predicate on that codename
resolves to an empty scope and denies every non-superuser. The scope is enforced through
the same legacy path the Notes pages use.

`interactionsByRegion` returns counts rather than coordinates, so it carries
`reports.view_reports` alone — the same authority as `reportSummary`, which it sits beside.
`regions` and `regionDimensions` serve public reference boundaries and need only an
authenticated user.

**Frontend.** `LocationBreakdown` renders on the Reports page beneath the existing charts
and inherits their `dateRange` and `activeOrg`, so the geographic figures always match the
KPIs above. It provides:

- a **dimension selector** over all six, from `regionDimensions`;
- a **drill-down selector** listing the regions that have interactions, with counts, so
  the map can answer "show me the SPA 4 visits" rather than only "every visit, coloured
  by SPA";
- a **region table** with the unassigned buckets labelled by cause;
- `RegionMap`, which draws region boundaries when a grouping is chosen, with a **Heatmap** /
  **Clusters** toggle in its card header and a `filteredTo` caption when the map is narrowed.

The map needs `VITE_SHELTER_GOOGLE_MAPS_API_KEY` (or its own
`VITE_BETTERANGELS_ADMIN_GOOGLE_MAPS_API_KEY`). Without it the panel degrades to an
explanatory message rather than taking the page down — see
`apps/betterangels-admin/config.ts`.

## The Google Maps key is shared, and that is temporary

The admin app currently falls back to shelter-web's `VITE_SHELTER_GOOGLE_MAPS_API_KEY`
so that evaluating this needs no new secret. It should get its own key before this is
relied on in production: sharing one key also shares its quotas and its HTTP-referrer
restrictions, and the two apps have different referrers.

## The build-order detail

`libs/ba-platform/codegen.ts` reads its schema from
`../../apps/betterangels-backend/schema.graphql` — whatever is on the **current** branch.
Codegen against a schema that lacks the region types does not fail loudly: it emits nothing
for the new operations, so the hooks simply do not exist and the failure looks like a typo
in an import.

So when generating on a branch whose `schema.graphql` predates the region types, point
codegen at the schema that has them for one run:

```bash
# from the worktree that has the region types
branch_root=$(git rev-parse --show-toplevel)
cp apps/betterangels-backend/schema.graphql /tmp/schema.backup
cp "$branch_root/apps/betterangels-backend/schema.graphql" apps/betterangels-backend/schema.graphql
cd libs/ba-platform && npx graphql-codegen --config codegen.ts
cp /tmp/schema.backup apps/betterangels-backend/schema.graphql   # restore
```

The generated types are a pure function of schema plus operations, so generating against
either schema produces the same output once the types are present. Run it from
`libs/ba-platform`: from the repo root it fails to resolve the schema with a misleading
"please provide a schema" error.

## Not built

**Geometry editing.** Boundaries are imported, not edited. There is no UI to adjust a
region or draw a new one, and the importer replaces a whole dimension at a time.

**A third-party heatmap library.** Google removed `visualization.HeatmapLayer` in Maps JS
API 3.65. The gradient is drawn on a canvas instead, which needs no dependency; deck.gl remains
the alternative if a standard implementation is wanted later.

**The unincorporated-communities dimension.** Documented in
`unincorporated-communities.md`, not implemented.
