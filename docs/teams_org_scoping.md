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

1. **Pre-deploy audit** (against production DB, before migrating):

   ```bash
   manage.py audit_team_org_scoping
   ```

   Reports the total team count, teams per organization, and any note/task
   whose team belongs to a different organization; exits non-zero if it finds
   one.  It does **not** report legacy `old_team` values — read the pre-migrate
   baseline off the teams-per-org counts, which should be zero for orgs that
   have never used teams.

2. **Migrate** — applies `teams.0002_backfill_org_teams` (safety-net backfill,
   see above) and the `old_team` removals (`notes.0003`, `tasks.0003`).
   Idempotent.

   > Both run in the same `migrate`, so the backfill's source columns are gone
   > by the time it finishes. That is fine **when the counts above are zero** —
   > there is nothing to back up and nothing to verify. If either count is
   > non-zero, deploy the backfill without the `old_team` removals first,
   > confirm the counts have gone to zero, and ship the removals in a
   > follow-up release; the removals reverse only to empty columns, so there
   > is no recovering the values afterwards.

3. **Sync permission groups** — ensures every org's groups carry current
   template permissions (including `teams.*` for Org Admin):

   ```bash
   manage.py sync_org_permission_groups          # write
   manage.py sync_org_permission_groups --check  # verify-only
   ```

4. **Post-deploy audit** — re-run `audit_team_org_scoping`; must exit `OK:
   no cross-org team references.`

5. **Teams are org-admin created.** New orgs start with no teams; org
   admins create them through the admin UI (Teams page / `createTeam`).
   The legacy-team backfill migration only creates teams for orgs that
   already have notes/tasks carrying legacy `old_team` values. Test
   fixtures (`load_report_test_data`) remain available for local data.

## Permission model (post-deploy)

- **Org-owned**: teams, members, reports, shelter operations, and
  note/task **writes** (header-driven via `HasOrgPerm`).
- **Platform-shared by design**: client profiles, note/task **reads**
  (orgs coordinate on shared clients and see cross-org interactions).

## Follow-up decisions (product)

1. Can org B edit/delete org A's client profiles? (Today: yes, via global
   perms. Suggested: edits shared, deletes admin-only.)
2. Can org B complete/reassign a task on a shared client? (Today: no —
   object-level perms are org-owned.)
3. Are client documents shared-read or org-owned? (Today: shared read via
   global `Attachment.VIEW`.)

## Known leftovers

- `resolve_permission_group` first-match still used in
  `clients.create_client_document`, `referrals`, `hmis`, and the `teams`
  query fallback (mobile pre-org-header). Migrate to header-driven org.
- GraphQL `teamId` cannot be set to explicit `null` (strawberry
  `Maybe[ID]` rejects it) — teams can't be cleared via the API. Use
  `Maybe[ID | None]` if clearing is ever required.
- `scripts/archived/backfill_attachment_perms.py` is a retired one-off
  (hardcoded SELAH org) — kept for reference only.
