# RFC 0003 — Caseworker guardian-equivalence (notes, tasks, referrals)

**Status:** Proposed — design for the §5 cutover PRs.
**Date:** 2026-09-02
**Scope:** Resolves the "Not mechanical — guardian-at-creation (§5)" rows of ADR
0001 §4.1. Gates the notes / tasks / referrals cutovers to the grant model (ADR
0001 §4 phase 4) after the §5.3 org-admin milestone role-backed
`ORG_ADMIN`/`ORG_SUPERUSER`.

## Problem

After the §5.3 provisioning (RFC-adjacent, ADR §5.3 step 4), **`CASEWORKER` is
the only org-scoped template left on the legacy path** across the org types
(`outreach` = CASEWORKER + the two role-backed admin roles; `shelter` =
role-backed Shelter Operator + the two admin roles). Its rows' CHANGE/DELETE
authority does not come from the role at all — it comes from **guardian
per-record rows written at creation**, tied to the creating org's group:

- `tasks/services.py` — `assign_object_permissions(permission_group, task, [Task.CHANGE, Task.DELETE])`
- `referrals/services.py` — `assign_object_permissions(permission_group, referral, [VIEW, CHANGE, DELETE])`
- `notes/services.py` (service requests) — `assign_object_permissions(permission_group, sr, [VIEW, CHANGE, DELETE])`

That is ADR 0001 §2.1 rule 4's forbidden shape — "grant rows written at
record-creation time" — and the reason these cutovers are **not mechanical**
(ADR §5, finding F23):

> Caseworkers hold ADD/VIEW on the template; CHANGE/DELETE comes from per-note
> guardian rows written at creation — *"the creating org may edit this note."*
> Moving CHANGE/DELETE onto the role changes the semantic to "every caseworker
> at the org edits every note in the org's scope," which **over-permits** on rows
> shared into an org's scope (e.g. via referrals) that the org should only view.

The same class of problem applies to tasks and referrals; referrals add a second
non-mechanical wrinkle (ADR §4.1): its "own org **or** via shelter" reach is
inexpressible in today's `OrgScoped` (`org_via` is either `()` or a hop tuple,
never both), so `OrgScoped` needs an `own_org_or` form before Referral can cut
over at all.

## Target model

End-state authority (the same shape ADR 0001 designs for the shelter and
org-admin cutovers, which ship earlier in this stack). A concrete trace of this exact
scenario — caseworkers in orgs A and B read everyone's notes but write only their own
org's — is **ADR 0001 §2.9 Example 3**:

1. **Org-owned rows** — CHANGE/DELETE ride the org role, org-scoped. The row's
   own `organization` FK is the anchor (`org_via = ()`, `OrgScoped`): a
   `can_obj(CHANGE, row)` resolves to the org-scoped `visible()` filter, so a
   caseworker only mutates rows whose org is the org they are acting as.
2. **Shared / foreign rows** — per-record control via the **object arm**
   (`Grant.scope_object_*`), never guardian rows. The receiving org's *view*
   comes from the platform-shared read rule; its *edit* only from an explicit
   object grant. `can_obj` **fails closed** on rows without one
   (ADR 0001 §2.4 / finding C1): for an org-scoped row seen through the
   platform-shared read rule, an org-scoped `can_obj` at a non-owner org returns
   nothing, and the object arm is the only scoped path that restores it.
3. **Guardian teardown** — `assign_object_permissions` calls and the guardian
   tables are deleted only after the equivalence is proven by tests (the shelter
   cutover suite is the contract, extended with shared-row cases — ADR §5).

Because caseworker CHANGE/DELETE is per-record by product rule ("the creating
org may edit this row"), the interesting design work is not the mechanics — they
are the shelter playbook — but **which rows count as org-owned**, and **how a
shared row gains an edit grant**. Those are the sub-decisions below.

> **Read tiers (cross-ref RFC 0002).** The read/write-tier vocabulary and the
> parity-first principle live in RFC 0002 § Guiding principle. For this RFC's
> domains the parity target is: `Note` reads SHARED, writes CREATOR; `Task`
> reads SHARED **today** (model-level VIEW on `main`), writes CREATOR. Org-only
> `Task` reads are a **product-signaled behavior change, not a parity target** —
> they must not silently ship inside the caseworker cutover.
>
> **Vocabulary mapping.** RFC 0002's `CREATOR` write cell for these org-owning rows is
> implemented here as the org-scoped `can_obj` arm: `Note.organization` /
> `Task.organization` is set to the creating org, so "the creating org edits its rows"
> and "the acting org edits rows whose org is in its scopes" are the same check. And
> `SHARED` read means **all** rows of the model to any VIEW holder (there is no narrower
> read tier today): org B reads org A's notes through that same rule; its *edit* of
> them is what fails closed.

## Options for the caseworker role

`CASEWORKER` today grants ADD + VIEW (reads are deliberate and platform-shared,
`docs/teams_org_scoping.md`), with per-record CHANGE/DELETE underneath.

### Option A — role carries CHANGE/DELETE; org-ownership decides scope (recommended)

Role-back `CASEWORKER` as `CASEWORKER_ROLE` carrying ADD/VIEW/CHANGE/DELETE, and
let `can_obj`'s org-scoped arm be the gate: acting at org A edits rows whose
`organization` is A; acting elsewhere fails closed. The platform-shared *read*
rule never feeds a *write*.

- Pros: single authority for the common case (a caseworker edits their org's
  rows), mechanical org-scoped writes, mirrors shelter/org-admin exactly.
- Cons: only correct where every row a role may edit is org-owned. Any row an
  org may *view* but not *edit* (a shared/foreign row) must be excluded by the
  org-scoped arm — which it is, automatically, because its `organization` is
  another org. **The over-permission the ADR warns about therefore does not come
  from the role carrying CHANGE/DELETE** — it comes from a write path that loads
  rows through the *read* rule (`visible`) instead of `can_obj`. The cutover's
  hard rule: write services load rows via `can_obj` (or the object arm), never
  read-side `visible` — the same convention finding C1 already pinned for
  platform-shared models.

### Option B — role carries ADD/VIEW only; CHANGE/DELETE stays object-grant-only

Every edit requires an explicit per-record grant (object arm).

- Pros: maximally conservative; no role-level edit authority at all.
- Cons: contradicts the product rule that an org edits its own rows as the
  default; would require a sharing grant at creation on every org-owned row —
  recreating guardian rows under a new name (rule 4 again).

**Recommendation: Option A**, with the C1 convention stated as a precondition:
*per-record writes load via `can_obj`, never `visible`*. This is exactly the
direction ADR §5 already records ("Org-owned notes: CHANGE/DELETE on the role,
org-scoped … Shared/foreign notes: per-record control via the object arm").

## Sub-decisions for the cutover PRs (not this RFC)

1. **Object-grant whitelist** — `common/permissions/object_grants.py` currently
   whitelists only `ClientProfile`, with a note that `Note` joins at the notes
   cutover as the explicit sharing consumer. Decide per model whether shared
   edits are product-real (whitelist + a sharing edge) or impossible-by-design
   (org-owned only → no whitelist entry; the object arm stays off for it).
2. **Sharing edges** — when org B may edit a row owned by org A, who creates the
   object grant and how is it audited (mirrors the unresolved client-sharing
   data-edge shape, RFC 0002 § Open sub-decisions). Default proposal: BA/staff in
   the Django admin (as today), with a `GrantAdmin` object-grant inline.
3. **Referral `own_org_or`** — `OrgScoped` needs an `own_org_or=("shelter",)`
   declaration form before Referral cuts over (ADR §4.1). This RFC does not
   design the multi-path form; it is called out as a prerequisite. Note that
   `Referral.organization` **and** `Referral.shelter` are both nullable
   (`SET_NULL`), so even with `own_org_or` a referral with org NULL and no
   shelter is an orphan — the same class as RFC 0002's `created_by_org` backfill
   orphans. The cutover must decide default-org or global-only handling for
   those rows before the org-scoped write arm can anchor on them.
4. **Notes' sibling rows** — notes create related rows at write time (service
   requests in `notes/services.py`) that also take guardian perms. Each related
   model must declare its own org reach and cut over with its parent.
5. **Guardian teardown ordering** — per domain: cutover PR role-backs the role,
   adds the parity tests (legacy-equivalent success cases + shared-row fail-closed
   cases), then a follow-up removes `assign_object_permissions` calls and the
   guardian tables once nothing reads them. Keep `guardian` installed until every
   consumer is gone (clients §5.1 included).

## Preconditions (designed in ADR 0001; implemented by earlier PRs in this stack)

- **C1 fail-closed `can_obj`** (ADR §2.4 / finding C1): platform-shared per-record
  writes fail closed; write services must use `can_obj`. Option A extends the same
  rule to org-scoped shared-row cases.
- **Object arm + whitelist + orphan cleanup** (ADR §2.5): the per-record machinery
  is designed here; `Note` joins the whitelist when its sharing edge ships.
- **Org-admin role-backing playbook** (§5.3 provisioning): the mechanical shape
  this RFC's cutovers follow (RoleDef → sync_roles → backfill → reconcile retires
  the legacy group → seam grant-only).

## Out of scope

- Clients (§5.1) — platform-shared, no org FK; RFC 0002 (recast: parity-first,
  per-model read/write tiers) owns the decision.
- HMIS — rides clients.
- Tier-3 FE surfacing (§5.2) — orthogonal.
