# Teams Org-Scoping — Deployment Runbook & Follow-ups

Deployment checklist for the per-org teams work (team FK validation,
org-scoped mutations, legacy-team backfill, permission sync).

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

2. **Migrate** — applies `teams.0002_backfill_org_teams` (creates per-org
   `Team` rows from legacy values and backfills note/task FKs) and the
   `old_team` removals (`notes.0003`, `tasks.0003`). Idempotent.

   > **No verification window if these ship together.** `notes.0003` /
   > `tasks.0003` drop `old_team` in the same `migrate` run that reads from
   > it, so a gap in the backfill destroys the evidence needed to diagnose
   > it — and there is no way back (the backfill reverses to a no-op, and
   > un-dropping the columns yields empty ones). To get a window, deploy
   > the backfill + org-scoped mutations + audit tooling first, run step 4
   > against production, then ship the `old_team` removals in a follow-up
   > release.

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
