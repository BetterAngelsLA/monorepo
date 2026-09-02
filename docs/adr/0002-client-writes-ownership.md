# RFC 0002 — ClientProfile write-ownership model (ADR 0001 §5.1 / §7.6)

**Status:** Proposed — decision requested from product/BA.
**Date:** 2026-09-02
**Scope:** Resolves ADR 0001 §7.6 (the §5.1 client-writes design). Gates the
clients cutover to the grant model (ADR 0001 §4 phase 4). Independent of the
tier-3 FE surfacing shape, which is already chosen (ADR §5.2 — `canChange`/
`canDelete` via `can_obj`).

## Problem

`ClientProfile` has **no organization FK** (no `clients/` migration ever added one),
yet the product rule is *"reads are platform-shared, writes stay org-owned."* Today
org-owned CHANGE/DELETE is enforced by **guardian per-record rows** written at creation
and tied to the creating org's group. Under the grant model:

- `ClientProfile.org_via = None` (platform-shared by decision) — `scopes()` returns org
  ids and the client has no org, so **org-scoped writes are inexpressible**.
- Guardian is being torn down per domain (ADR §5) — its per-record ownership rows have
  no home unless we pick one.

Cross-org edit/delete of profiles is an open product follow-up
(`docs/teams_org_scoping.md`); the model must make it *expressible*, not decide it.

## ADR rule 4 is the tiebreaker

ADR 0001 §2.1 rule 4: *"Delegated authority is a grant row. **Shared subject matter is
a property of the data.** Never grant rows written at record-creation time."*

This says ownership (who can CHANGE/DELETE by default) should be a **data property**, not
a grant written at creation — a grant row per record at creation would multiply rows
linearly with every client and every role that touches it. The object arm exists for
**explicit sharing** (cross-org), not for routine ownership.

## Options

### Option A — `ClientProfile.created_by_org` FK (recommended)

Add `created_by_org = ForeignKey(Organization)` (nullable), backfilled at cutover from
the guardian rows (the creating org's group). CHANGE/DELETE go on the `Caseworker` role,
org-scoped via `created_by_org`. Cross-org *sharing* uses the object arm (a grant on the
row, written deliberately).

- ✅ Ownership is a data property (rule 4), so org-owned writes are one org-filter, not
  per-record grants.
- ✅ "Who owns this client" is answerable by a column — reporting, HMIS export, admin.
- ✅ Backfill is mechanical (guardian group → org).
- ✅ Cross-org edit/delete stays expressible via object grants.
- ⚠️ Adds a column + backfill migration; `created_by_org` must be set on create
  (service convention, like `create_shelter` takes `organization_id`).
- ⚠️ Old rows whose guardian rows are missing/orphaned need a fallback (NULL → global
  tier only, i.e. orphaned clients editable only by GSO).

### Option B — per-record object grants only (no new column)

Ownership lives entirely in a `Grant(scope_object=client, role=Caseworker)` written at
creation; org-scoped writes are derived from the object arm.

- ✅ No schema change, no backfill.
- ❌ **Violates rule 4** — ownership becomes grant rows written at record-creation time
  (one row per client per owning role).
- ❌ Every client write is a per-record grant check (object arm) instead of an org
  filter — the expensive path becomes the default.
- ❌ "Who owns this client" requires a grant query; no column for reporting/HMIS.
- ❌ Admin/BA can't see ownership at a glance; harder to reason about.

## Recommendation

**Option A** (`created_by_org` FK): it matches ADR rule 4, keeps the common path (org
writes) cheap and filterable, and reserves the object arm for what it is for — explicit
cross-org sharing. The §5.2 tier-3 fields (`canChange`/`canDelete`) are identical either
way; only the backing query differs (org filter + object arm vs. object arm alone).

## Precondition — finding C1 (shipped before this decision)

Per-record **writes** on a platform-shared model must fail closed: `can_obj` checks the
object arm (or the global tier) and never "holds the perm anywhere" — which is the
platform-shared **read** rule and would otherwise let any org-grant holder CHANGE/DELETE
every client (ADR 0001 §2.4, finding C1; implemented in the predicate). This is a
precondition to any option here: it guarantees that until `created_by_org` (or a sharing
grant) exists, no scoped role can silently mutate clients it was never granted.

## Open sub-decisions (for the cutover PR, not this RFC)

- Nullability/fallback for orphaned rows (NULL → global-only, vs. backfill to a
  default org).
- Whether `created_by_org` is immutable (set at create) or transferable later.
- Who may set it: always the creating service, or also the admin.
- **Sharing revocation on member removal (audit note):** `organization_remove_member`
  revokes org-scoped Grants but not `principal_user` object grants — a removed member
  would keep per-record access to shared clients. The sharing model must define
  revocation semantics (e.g., object grants tied to membership and cleaned on removal,
  or an explicit unshare action) before the clients cutover wires sharing; it is a
  design decision of this RFC, not a predicate gap.
