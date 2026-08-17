# Teams Org-Scoping — Deployment Runbook & Follow-ups

Deployment checklist for the per-org teams work (team FK validation,
org-scoped mutations, legacy-team backfill, permission sync).

## Background: the enum → Team migration already happened

`Team` and the `old_team` → `team` FK copy shipped in **#2151 (June 2026)**,
as `RunPython` inside `notes.0033` and `tasks.0006`. The migration squash in
**#2247** deleted those files *after* production had applied them, so the data
moved in June and only the files went away — the squashed `0001_initial` /
`0002_initial` carry schema operations only.

The FK has therefore been the live source of truth since June, and `old_team`
has been vestigial. `teams.0002_backfill_org_teams` in this release is an
idempotent **safety net**, not the original migration: it only touches rows
with `old_team` set and no FK, which on a normally-migrated database is none.

Confirm that before deploying:

```sql
SELECT count(*) FROM notes_note WHERE old_team IS NOT NULL AND team_id IS NULL;
SELECT count(*) FROM tasks_task WHERE old_team IS NOT NULL AND team_id IS NULL;
```

Both zero means the backfill has nothing to do and dropping `old_team` is
removing a column unused since June.

## Deploy steps

1. **Migrate** — in graph order:

   | Migration | What it does |
   | --- | --- |
   | `teams.0002` | safety-net backfill (see above); a no-op on a normally-migrated database |
   | `notes.0003`, `tasks.0003` | drop the `old_team` columns |
   | `teams.0003` | drop `Team.slug`; uniqueness moves to `(lower(name), organization)`, deduping first |
   | `teams.0004` | add the `(id, organization)` unique constraint the composite FKs target |
   | `notes.0004`, `tasks.0004` | add the composite FK that makes a cross-org team unstorable, detaching any existing violation first |

   Every data step is idempotent and re-runnable.

   > Both run in the same `migrate`, so the backfill's source columns are gone
   > by the time it finishes. That is fine **when the counts above are zero** —
   > there is nothing to back up and nothing to verify. If either count is
   > non-zero, deploy the backfill without the `old_team` removals first,
   > confirm the counts have gone to zero, and ship the removals in a
   > follow-up release; the removals reverse only to empty columns, so there
   > is no recovering the values afterwards.

2. **Sync permission groups** — ensures every org's groups carry current
   template permissions (including `teams.*` for Org Admin):

   ```bash
   manage.py sync_org_permission_groups          # write
   manage.py sync_org_permission_groups --check  # verify-only
   ```

3. **Teams are org-admin created.** New orgs start with no teams; org
   admins create them through the admin UI (Teams page / `createTeam`).
   The legacy-team backfill migration only creates teams for orgs that
   already have notes/tasks carrying legacy `old_team` values. Test
   fixtures (`load_report_test_data`) remain available for local data.

## Why there is no cross-org team audit

Notes and tasks carry a composite foreign key on `(team_id, organization_id)`
referencing `teams_team(id, organization_id)`, so a team from another
organization cannot be stored in the first place. The migrations that add it
detach any pre-existing violation first, so there is nothing to audit before or
after deploying.

## Permission model (post-deploy)

- **Org-owned**: teams, members, reports, shelter operations, and
  note/task **writes** (header-driven via `HasOrgPerm`).
- **Platform-shared by design**: client profiles, note/task **reads**
  (orgs coordinate on shared clients and see cross-org interactions).

## Product decisions (decided)

| Question | Decision | Matches today |
| --- | --- | --- |
| Can org B **edit** org A's client profile? | Yes — client profiles are global/shared | yes |
| Can org B **complete/reassign** a task on a shared client? | No — tasks are org-specific | yes |
| Are client **documents** shared-read? | Yes — shared read | yes |

All three confirm current behavior, so no permission changes are needed —
only encoding and tests (tracked in #2313 / #2314). The templates already
implement the matrix:

- `CASEWORKER` holds `ClientProfile` ADD/CHANGE/DELETE/VIEW → shared edits.
- `Task.perms` is ADD + VIEW only, with CHANGE/DELETE granted per object at
  creation → a task is write-owned by the org that created it.
- `Attachment.perms` is ADD + VIEW only → documents are shared-read with no
  cross-org delete.

### Still open: cross-org **delete** of a client profile

The decision above covers editing. Deletion is the case that matters most and
is not settled: `delete_client_profile` filters on `ClientProfile.perms.DELETE`,
which `CASEWORKER` holds globally, and `Note.client_profile` is
`on_delete=CASCADE`. So one org deleting a shared client profile destroys
**every other org's notes** for that client. (`Task.client_profile` is
`SET_NULL`, so tasks survive orphaned.) Either restrict delete to org admins,
or keep it global and make the cascade non-destructive.

### Consequence to check in the app

Note/task **reads** are shared but task **writes** are org-owned, so on a
shared client one org sees another org's tasks and cannot complete or reassign
them. The UI needs to distinguish those, or users meet permission errors on
controls that look available.

## Known leftovers

- `resolve_permission_group` first-match still used in
  `clients.create_client_document`, `referrals`, `hmis`, and the `teams`
  query fallback (mobile pre-org-header). Migrate to header-driven org
  (#2315). Team *mutations* are already header-driven; only the query
  fallback remains. Note the fallback resolves `CASEWORKER`, so an Org Admin
  who is not also a caseworker cannot list teams without the header — and
  document *ownership* on upload is still first-match, so "shared read,
  org-owned write" for client documents is not guaranteed until this lands.
- GraphQL `teamId` cannot be set to explicit `null` (strawberry
  `Maybe[ID]` rejects it) — teams can't be cleared via the API (#2316).
  Smaller than it looks: `Maybe[ID]`, `Maybe[ID] = UNSET` and
  `Maybe[ID | None]` all emit the same SDL, so it is not a breaking change
  and needs no codegen, and `apply_maybe` already maps `Some(None)` to a
  cleared field.
- `HasOrgPerm` does not check that the user's group is the group holding the
  permission — see the separate fix PR. Until that lands, any org member
  effectively holds the union of every template's permissions in their org.
- `scripts/archived/backfill_attachment_perms.py` is a retired one-off
  (hardcoded SELAH org) — kept for reference only.
