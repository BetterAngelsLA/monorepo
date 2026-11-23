# Analytics and reporting — conventions

How the reporting surface is built and why. The views themselves live in
`apps/betterangels-backend/reports/migrations/`; this doc is the rulebook they follow, so
new views start consistent instead of re-deriving the reasoning.

Origin: **[DEV-2642] Spike—evaluate connecting PostgreSQL to PostHog for reporting and
dashboards** (<https://betterangels.atlassian.net/browse/DEV-2642>). The spike asked whether
Product can answer data questions without engineering. Its answer so far: the hard part is
not the tool, it is exposing the right shape of data — which is what this doc covers.

---

## Why the rules are strict: the reader is often an agent

Most of these views are not read by someone writing SQL against a spec. They are read by an
AI agent — PostHog's assistant, an MCP client, or whatever replaces it — that gets a
natural-language question and has to choose tables, columns, filters and aggregations from
what it can see: names, values, and whatever context the user happened to attach. It never
sees this file.

Three risks drive the conventions below. None is established behaviour — the evidence is
two short sessions and a handful of questions — but each is a way this surface can produce a
wrong number that looks right, and the design should not depend on how a given model happens
to behave.

1. **It may infer instead of refusing.** Asked for "completed last month", a human analyst
   says the model has no completion timestamp. An agent may instead substitute the closest
   column it can find and answer anyway — it did, using `updated_at` as a completion proxy.
   It also flagged that choice, which is the outcome you want, but a behaviour we rely on is
   a behaviour that can fail, and the guard belongs in the data either way.
2. **A wrong inference would be invisible.** This one is structural rather than behavioural:
   there is no compile error for "you misread the enum" or "you used a row-write timestamp
   as a completion proxy". The number is plausible, formatted correctly and internally
   consistent, so nothing in the result contradicts the mistake.
3. **Delivery does not track correctness.** Right and wrong answers arrived in the same
   register. The one answer that could not be defended — an org-level question answered from
   a client-filtered table — read no differently from the two that were right. Whether that
   is confidence or just consistent formatting, the practical consequence is the same: tone
   is not a signal anyone can audit.

So the posture is a guard, not a bet: **treat every ambiguity as a candidate silent error**,
because whatever resolves it may do so without saying so. That is why a legend goes in
the value rather than in a doc, why a stable id sits next to every free-text key, why names
carry meaning and grain, and why a column that can only ever be null is worse than a missing
one. A doc is a hint; the data is the specification.

The review test for a new column: _would a consumer who never read this file get the right
number?_ If the answer depends on knowing something that only lives in a comment, change
the data.

### The limit of that guard

Shipping the legend in the value (convention 2) is necessary but not sufficient: it assumes
the reader looks at the values. After the codes became text, a consumer carrying the old
assumption filtered the text column against `0/1`, matched nothing, and reported **0 tasks**
— in the same register as the answers that were right. The data could not prevent it; only
the reader looking could.

Two consequences worth carrying into review and into how answers are read:

- **A bare zero is an unverified answer**, not an answer. It is indistinguishable from a true
  zero, so it earns a second step: list the distinct values of the column, or ask which
  column and type the query used.
- **A schema change invalidates readers, not just queries.** Renames and type changes break
  what a cached context or remembered session believes about the table, silently. State the
  change somewhere the consumer will see it, or don't depend on that memory at all.

---

## The surface

Eight read-only SQL views, created by `RunSQL` migrations (Django has no view primitive;
`regions/0004`, `common/0003`, `referrals/0002` and `accounts/0007` are the house
precedent). Nothing is copied, refreshed, or scheduled — each is a live view, so
"updates at least daily" is the database's job, not a pipeline we operate.

| View                               | Grain                                 | Stable key                                        |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------- |
| `analytics_client_summary`         | one row per active (unmerged) client  | `client_id`                                       |
| `analytics_client_interaction`     | one row per `Note` with a client      | `note_id`                                         |
| `analytics_note_provided_service`  | one row per provided-service link     | `note_service_link_id` + `note_service_direction` |
| `analytics_note_requested_service` | one row per requested-service link    | `note_service_link_id` + `note_service_direction` |
| `analytics_client_task`            | one row per `Task` with a client      | `task_id`                                         |
| `analytics_client_document`        | one row per client-owned `Attachment` | `attachment_id`                                   |
| `analytics_client_referral`        | one row per `Referral` with a client  | `referral_id`                                     |
| `analytics_service_rollup`         | org × category × service × direction  | none (aggregate)                                  |

The two link views are split because `notes_note_provided_services` and
`notes_note_requested_services` are separate tables with independent `id` sequences; one
view over both could not be synced on a single cursor.

---

## Conventions

### 1. Nothing identifying leaves the database

No names, contact details, ID numbers, addresses, or free text — only presence flags,
counts, ids, enums and timestamps. Note `purpose`, `public_details`, `private_details`,
task `summary`/`description` and referral `notes` are reduced to `has_*` flags. A service
`location_id` is reduced to a flag too: location plus timestamp is close enough to an
address to avoid.

This is structural, not policy. The intended grant is `SELECT` on eight views, and the
views expose nothing to leak — instead of a column allowlist on `clients_clientprofile`
that someone can widen by accident. Any new view starts from the same premise.

### 2. If a value needs a legend to be read, the legend belongs in the value

`Task.Status` and `Referral.Status` are `IntegerChoicesField`s, so a naive view exports
`0/1/2` and every consumer is left guessing. The views render them as text
(`to_do`/`in_progress`/`completed`, `pending`/`accepted`/`declined`), the same way
`task_origin` renders `note`/`hmis_note`/`standalone` instead of a boolean.

The failure this prevents is quiet and total: a consumer that assumes `0 = New` inverts an
entire analysis, and nothing in the data contradicts it. The `CASE` mirrors the model enum
and has no `ELSE`, so an unlisted value exports `NULL` — louder than a code nobody can
read. It is a guard against a reader that checks values, not one that assumes them; see
"The limit of that guard" above.

### 3. A stable id sits next to every free-text key

`service_label` is authored per organisation, so grouping by it groups by spelling and
changes retroactively when the service is renamed. `service_id` is what a count or join
should use. Both are exported: read the label, count the id.

### 4. Names say what the column is, and at which grain

- **Meaning, not mechanic:** `client_last_saved_at`, not `client_updated_at`. A client row
  is written on every save, including one that changes nothing, so "updated" reads as a
  business event when it is only a write.
- **Grain in the name:** `client_task_count` on the summary, `note_provided_service_count`
  and `note_document_count` on the interaction view. These views get joined to each other,
  and summing client grain across a note-grain join is a mistake the name should argue
  against.
- **Entity in the name:** `task_created_at`, `referral_updated_at` — two bare `created_at`
  columns mean two different things once joined.
- **One vocabulary:** `*_organization_id` everywhere (`attachment_organization_id`, not
  `upload_org_id`).

### 5. One row per entity, not pre-aggregated columns

New questions are time-series and sliced, which a count column cannot answer. Per-entity
rows are the default; `analytics_client_summary` keeps its own counts for single-number
questions, and that duplication is deliberate.

The one aggregate is `analytics_service_rollup`, which exists because it is
delete-correct: it aggregates from the through-tables, so a removed service stops being
counted, at a size small enough to re-read in full.

### 6. Every view exposes a stable key

Postgres reports no primary key for a view, so a sync tool cannot dedupe or upsert unless a
column exists that it can be told to trust. Each view carries its entity's own primary key.
The rollup is the exception — no key, because it is re-read in full.

Composite identity is explicit: `note_service_link_id` is unique only _within_ each link
view, so a union of the two identifies rows by `(note_service_link_id, note_service_direction)`.

### 7. Never ship a column that can only ever be null or false

`ServiceRequest` has `due_by` and `status`, but `due_by` is in no create input and the only
mutation that could set it is called from nowhere; `status` is fixed at creation and never
transitions. Both were dropped from the link views along with the derived
`service_completed_on` and `is_overdue`. A column that is always empty is worse than a
missing one, because a chart of it looks like a finding. Add them back the day the app
captures either.

### 8. Do not "fix" overcounting timestamps inside a view

`updated_at` overcounts ("updated in the last 90 days" is inflated by no-op saves). What
counts as a real change is a Product decision, so the raw value is surfaced and the
inflated number is shown with that caveat. The material to tighten it exists: `pghistory`
records `add` and `update` separately, so a no-op save can be told from a real one by
comparing consecutive events.

---

## Adding or changing a view

1. **Decide the grain first.** One row per what? If the answer needs "and", it is two
   views.
2. **Write it as `RunSQL` with `CREATE OR REPLACE`**, and give the reverse as a `DROP`.
   Editing an **already-applied** migration does not re-run it — see below.
3. **Add the column list to the tests.** `reports/tests/test_analytics_client_summary_view.py`
   and `test_analytics_activity_views.py` assert the view's columns are _exactly_ an agreed
   set. That allowlist is the drift detector: adding a free-text or identifying column has
   to fail there, not in review.
4. **Test the grain with data.** A wrong join direction still produces rows — just the
   wrong number of them.
5. **Check for a key.** `client_id` / `note_id` / `task_id` / `attachment_id` /
   `referral_id` / `note_service_link_id`.

### Re-applying an edited migration

Both the dev database and the test database keep the old view, because migrations record
_that_ they ran, not what they contained. To pick up an edit, from the repo root:

```bash
# 1. dev database: unapply the view migration, then reapply
yarn nx run betterangels-backend:manage -- migrate reports 0002
yarn nx run betterangels-backend:migrate

# 2. test database: drop the stale cache, then the database itself
rm -f .cache/test-db.dump .cache/test-db.manifest.json
cd apps/betterangels-backend && source scripts/test_db_common.sh && test_db_export_pg_env
psql -tAc "select datname from pg_database where datname like 'test_postgres%'" \
  | xargs -r -n1 dropdb --force --if-exists
cd -

# 3. run the analytics tests, which rebuild the test database from current files
PYTEST_ADDOPTS="-k analytics" yarn nx run betterangels-backend:test
```

Deleting the cache alone is not enough: `pytest --reuse-db` will happily reuse the existing
database, and the cache manifest only compares applied migration _names_ against the ones on
disk, never view definitions.

---

## Not done yet

- **A dedicated schema.** The views sit in `public` alongside every PHI table. A reporting
  consumer needs `USAGE ON SCHEMA public` to read them, which is a blanket grant; an
  `analytics` schema would be default-deny and let the grant be `USAGE` on that schema
  only.
- **`service_id` in the rollup grain.** It groups by `(org, category, label, direction)`,
  so two catalogue rows sharing a label merge with summed counts — reachable because
  `_resolve_service` does `get_or_create(label=...)` on free text. No duplicates today;
  fixing it is a grain change, so it is deferred rather than forgotten.
- **A point-in-time history.** The views are current-state snapshots, so "how many clients
  had X at the end of March" has no answer. `pghistory` has the events; nothing exposes
  them as SCD-2.
- **Transition timestamps.** Task completion, service-request fulfilment, referral
  status changes — the models record state, not when it changed, so "completed last month"
  or "time to placement" can only be approximated.
