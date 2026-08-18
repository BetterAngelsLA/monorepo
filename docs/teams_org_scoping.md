# Teams Org-Scoping — Deployment Runbook & Follow-ups

Deployment checklist for the per-org teams work (org-scoped mutations,
legacy-column removal, team/organization enforcement).

## Background: the enum → Team migration already happened

`Team` and the `old_team` → `team` FK copy shipped in **#2151 (June 2026)**,
as `RunPython` inside `notes.0033` and `tasks.0006`. The migration squash in
**#2247** deleted those files *after* production had applied them, so the data
moved in June and only the files went away — the squashed `0001_initial` /
`0002_initial` carry schema operations only.

The FK has therefore been the live source of truth since June, and `old_team`
has been vestigial — nothing in application code writes it, so the set of rows
carrying one has been frozen since then.

**This release therefore contains no backfill.** An earlier draft added one as a
safety net; production shows it would have been a no-op. `teams_team` holds 46
rows: the 15 legacy enum teams for each of three organizations (created by the
June migration, in three timestamp clusters seconds apart), plus one team an
admin created through the Teams UI on 26 June. Every row the backfill would
have created already exists.

### Before dropping `old_team`, confirm nothing still needs it

Without a backfill this check is more important, not less — the drop is
irreversible:

```sql
SELECT count(*) FROM notes_note  WHERE old_team IS NOT NULL AND team_id IS NULL;
SELECT count(*) FROM tasks_task  WHERE old_team IS NOT NULL AND team_id IS NULL;

-- History tables: the June migration updated live rows, so pre-June event
-- rows may carry old_team with no team_id. Dropping the column removes the
-- only team attribution on that history.
SELECT count(*) FROM notes_noteevent WHERE old_team IS NOT NULL AND team_id IS NULL;
SELECT count(*) FROM tasks_taskevent WHERE old_team IS NOT NULL AND team_id IS NULL;
```

If the live counts are non-zero, decide what those rows should be before
deploying rather than guessing in a migration. If the *event* counts are
non-zero and anyone reports on historical team attribution, copy `old_team`
into `team_id` on the event tables first.

## Deploy steps

1. **Migrate** — in graph order:

   | Migration | What it does |
   | --- | --- |
   | `notes.0003`, `tasks.0003` | drop the `old_team` columns |
   | `teams.0003` | drop `Team.slug`; uniqueness moves to `(lower(name), organization)`, deduping first |
   | `teams.0004` | add the `(id, organization)` unique constraint the composite FKs target |
   | `notes.0004`, `tasks.0004` | add the composite FK that makes a cross-org team unstorable, detaching any existing violation first |

   Every data step is idempotent and re-runnable.

   > The `old_team` drops are the only irreversible operations here — they
   > reverse to empty columns, not to the values. Run the counts above first.
   > Consider shipping the org-scoped mutations on their own, confirming
   > teams behave correctly in production, and dropping the
   > columns in a follow-up release; nothing in the feature depends on them
   > being gone.

2. **Permission groups sync themselves — no step required.** Every org's
   groups are reconciled against their templates (including `teams.*` for Org
   Admin) by the `post_migrate` handler in `accounts/signals.py`, so step 1
   already did it.

   There is deliberately no management command for this. Running one would
   call the same function, so it could only fail the same way a failed
   automatic run did — it would report success without telling you anything
   the migrate had not already determined.

   Known gap: the handler currently catches broadly, so a failure there is
   quiet rather than fatal. If org admins report missing `teams.*`
   permissions after this deploy, check the migrate logs before assuming the
   feature is broken.

3. **Teams are org-admin created.** New orgs start with no teams; org
   admins create them through the admin UI (Teams page / `createTeam`).
   Nothing in this release creates teams. The three organizations that
   already hold the 15 legacy enum teams keep them — they are ordinary
   rows now, renameable and deletable like any other. Test fixtures
   (`load_report_test_data`) remain available for local data.

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

### Where a mutation declares which one it is

Every `PermissionedQuerySet` takes a **required** `organization_field`:

```python
extensions=[
    PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE],
                         organization_field="organization_id"),   # org-owned
]
```

`None` opts out and means the records are deliberately shared. Because the
argument is required, adding a mutation forces an answer, and reviewing one
means reading the decorator rather than hunting for a filter in the body.

This replaced a hand-written `.filter(organization_id=...)` in each resolver.
Four of eleven call sites did not have it — `generateNoteFileUploads`,
`resolveNoteFileUploads`, `deleteServiceRequest` and `updateReferral` — so
those records could be written while the caller's active organization was a
different one than the record's owner. Guardian grants object permissions to
the permission group that *created* the record, and that grant says nothing
about the header, so nothing else was confining them.

### Why the org filter is load-bearing, and what it is not

It is **not** compensating for guardian's global fallback in the usual case:
in practice `CASEWORKER` does not hold `notes.change_note` globally, so
`filter_for_user` already refuses a stranger's note.

What it does confine is the **multi-org caller**. Object permissions follow
the record's creating group, so a user who legitimately reaches a record
through org A can act on it while their active organization header says org
B. Without the filter, the action is accepted and attributed to the wrong
organization.

The global fallback is still a real hazard wherever a template *does* grant a
model-level permission — it makes `filter_for_user` match every row in the
table. Replacing it with an explicit shared-vs-org-owned layer is tracked in
**#2313**; the required `organization_field` is what makes that migration
mechanical, since every call site's intended layer is now written down.

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

- **Retire guardian's global-permission fallback (#2313).** Every
  `PermissionedQuerySet` now declares its layer via `organization_field`, so
  the remaining work is to stop relying on model-level grants for row access:
  audit which templates grant model-level permissions, decide per model
  whether it is shared or org-owned, and drop the fallback so
  `filter_for_user` cannot match rows the caller has no object grant on. Until
  that lands, the `organization_field` filter is the only thing standing
  between a model-level grant and every row in its table.
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
