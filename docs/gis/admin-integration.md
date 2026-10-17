# Wiring region reports into betterangels-admin

How the region queries meet the admin app, and the one build detail that is easy to lose an
afternoon to.

## What ships

**Backend — three queries and two tile endpoints:**

```graphql
interactionsByRegion(organizationId, dimension, startDate, endDate, regionCodes): [RegionCountType!]!
interactionMap(organizationId, startDate, endDate, limit, dimension, regionCodes): InteractionMapType!
regionDimensions: [RegionDimensionInfo!]!
```

```http
GET /regions/tiles/<kind>/<z>/<x>/<y>.mvt          # public boundaries, authenticated session
GET /regions/tiles/density/<z>/<x>/<y>.mvt?org_id= # interaction density, reports.view_reports
```

`RegionCountType` carries `kind`, `code`, `name`, `count`, `isUnassigned`, and
`unassignedReason` (`OUTSIDE_ALL_REGIONS` | `NO_LOCATION`). `kind` is present because a
rollup can span every dimension at once, where a code alone is ambiguous — `"1"` is
simultaneously a council district, an SPA and a supervisorial district. `RegionDimension` is
`ZIP | CITY | COUNCIL_DISTRICT | SUPERVISORIAL_DISTRICT | SPA | COC`.

`interactionMap` returns points and a truncation flag. The **density tile** aggregates the same
pins into a grid of vector-tile cells; it takes `org_id` (not `organizationId`) because it is an
HTTP query parameter read by the same `HasReportAccess` permission the CSV export uses, plus
optional `start`/`end`/`dimension`/`codes`.

**Authorization differs by query, deliberately.**

`interactionMap` returns coordinates, so it carries two gates: `reports.view_reports` at the
payload org, **and** the note read scope, applied as
`filter_for_user(..., [NotePermissions.VIEW])`. The second is not redundant — a pin is a
note's location, so it inherits the note scope, and `ORG_ADMIN` holds `reports.view_reports`
with no note permission at all. `test_org_admin_without_note_permission_sees_no_pins` pins that
it receives no pins.

It is deliberately **not** `require_can(..., NotePermissions.VIEW)`: notes are a legacy
domain, no `Role` carries `notes.view_note`, and a grant predicate on that codename
resolves to an empty scope and denies every non-superuser. The scope is enforced through
the same legacy path the Notes pages use.

`interactionsByRegion` returns counts rather than coordinates, so it carries
`reports.view_reports` alone — the same authority as `reportSummary`, which it sits beside.
`regionDimensions` requires only an authenticated session: it exposes which boundary sets are
loaded, not any client data. So does the **boundary** tile endpoint — public reference polygons,
identical for every tenant. The **density** tile carries the same two gates as `interactionMap`,
because a filled cell is still a note's location.

**Frontend.** `LocationBreakdown` renders on the Reports page beneath the existing charts
and inherits their `dateRange` and `activeOrg`, so the geographic figures always match the
KPIs above. It provides:

- a **dimension selector** over the dimensions `regionDimensions` reports as loaded — not a fixed
  list of six, so a boundary set the importer has not loaded cannot be selected;
- a **drill-down selector** listing the regions that have interactions, with counts, so
  the map can answer "show me the SPA 4 visits" rather than only "every visit, coloured
  by SPA";
- a **region table** with the unassigned buckets labelled by cause;
- `RegionMap`, which draws region boundaries from the tile endpoint when a grouping is chosen,
  with a **Heatmap** / **Clusters** toggle in its card header and a `filteredTo` caption when
  the map is narrowed.

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
`../../apps/betterangels-backend/schema.graphql` — whatever is on the **current** branch.
Codegen against a schema that lacks the region types does not fail loudly: it emits nothing
for the new operations, so the hooks simply do not exist and the failure looks like a typo
in an import.

So when generating on a branch whose `schema.graphql` predates the region types, borrow the
schema from the worktree that has them for one run, then put yours back:

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

The generated types are a pure function of schema plus operations, so generating against
either schema produces the same output once the types are present. Run it from
`libs/ba-platform`: from the repo root it fails to resolve the schema with a misleading
"please provide a schema" error.

## Not built

**Geometry editing.** Boundaries are imported, not edited. There is no UI to adjust a
region or draw a new one, and the importer replaces a whole dimension at a time.

**Google's `visualization.HeatmapLayer`.** It was removed in Maps JS API 3.65, so the heatmap is
not that layer. Both the boundaries and the density grid are **deck.gl** `MVTLayer`s
(`@deck.gl/geo-layers`, mounted through `@deck.gl/google-maps`' `GoogleMapsOverlay`) over the two
tile endpoints; no separate heatmap dependency is involved, and nothing is drawn per point on the
client.

**The unincorporated-communities dimension.** Documented in
`unincorporated-communities.md`, not implemented.
