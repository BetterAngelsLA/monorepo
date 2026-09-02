# RFC 0002 — Per-model read/write tiers & the client domain (ADR 0001 §5.1 / §7.6)

**Status:** Proposed — records the per-model tiering product rule (2026-09-02) and the
client-domain write-tier decision; the architectural prerequisite (decoupling read scope
from write scope, § Precondition) is the work that gates the clients cutover.
**Date:** 2026-09-02 (amended 2026-09-02)
**Scope:** Resolves ADR 0001 §7.6 (the §5.1 client-writes design) and establishes the
per-model read/write-tier vocabulary that the caseworker domains (RFC 0003) inherit.
Gates the clients cutover (ADR §4 phase 4). Independent of the tier-3 FE surfacing
shape, which is already chosen (ADR §5.2 — `canChange`/`canDelete` via `can_obj`).

## Problem

The earlier draft framed clients as one decision — *"reads are platform-shared, writes
stay org-owned"* — and offered ownership models to pick from. Product clarifies the rule
is **not uniform**: writes are tiered **per model**, and a model's read scope and write
scope are chosen **independently**. Some rows are shared for reading but owned by one org
for writing; some are shared for both; some are org-scoped for both. DELETE may be
narrower than CHANGE on the same model.

## Guiding principle — parity first, advanced cells later

**The cutover matches what `main` does today; the tier vocabulary exists so the more
advanced cells are expressible later without re-architecture.** Each content type's
"main today" cell (verified against `origin/main`) is the parity target the cutover must
preserve; its "product target" cell is a future narrow that is *expressible but not
activated* until product asks. No behavior change ships in the cutover; every future
narrow is a later, deliberate tier-table change. The underlying mechanics — roles,
grants, `scopes()`, delegation — are traced for real people and orgs in ADR 0001 §2.9.

Verified matrix (`main today` read from the code paths cited; product target from
product/BA, 2026-09-02):

| Content | main today — read | main today — write | product target |
|---|---|---|---|
| `ClientProfile` | shared (model-level perm) | **shared** (model-level perm, no per-record rows) | owner org (later) |
| `ClientDocument` | shared (model-level VIEW) | **creating/uploading org** (per-record CHANGE+DELETE) | keep creating-org; explicit sharing only via object grants |
| `Note` | shared (model-level VIEW) | creating org (per-record CHANGE+DELETE) | same |
| `Task` | **shared** (model-level VIEW) | creating org (per-record CHANGE+DELETE) | org-only read + org write — a behavior change, needs sign-off |

Concretely (all verified on `main`):

- `ClientProfile` — any caseworker in any org reads, edits, and deletes any client
  **today**. Org ownership/transfer is a future aspiration, not current behavior.
- `ClientDocument` — read is shared; **write (CHANGE/DELETE) is already the uploading
  org only** via per-record guardian rows assigned at upload. The "future" restriction
  in earlier drafts was describing the present — there is no broad doc-write to narrow.
- `Note` — readable by all caseworkers (model-level VIEW), only the creating org edits
  (per-record rows at creation).
- `Task` — readable by **all caseworkers today** (model-level VIEW; `tasks_for_user`
  filters client vs HMIS only, no org filter); writes are creating-org per-record.
  Org-only task reads are a *product aspiration*, not current behavior.

None of this is a bug — it is the product today. The grant model must reproduce the
`main today` column in the cutover and make the `product target` column expressible
without re-architecture.

## The tier model

Two independent declarations per model.

**Read scope:**
- `SHARED` — any holder of the VIEW permission anywhere reads **all rows of the model**
  (the existing platform-shared read rule). There is no intermediate "rows related to
  what I can see" read tier today — `SHARED` cross-org reads mean literally everything,
  which is the `main`-today parity target for clients/notes/tasks.
- `ORG` — rows are scoped to the acting org.

**Write scope (CHANGE; DELETE may declare a narrower tier) — tiers are defined by the
anchor the check filters on, not by where the actor's grant came from:**
- `SHARED` — any holder of the permission anywhere may change any row.
- `ORG` — the row's own organization: rows carry an org FK and the check is the
  org-scoped `can_obj` arm (`row.organization` in the acting scopes).
- `CREATOR` — the org that created the row (org FK set at create). **On an org-owning
  row whose org is set at creation, `ORG` and `CREATOR` are the same check** — RFC 0003
  implements the Note/Task "creating org" cells as that org-scoped `can_obj` arm. The
  vocabulary only separates when creation org and row org can differ (transfer) or the
  anchor is not on the row itself.
- `UPLOADER` — the org that recorded/uploaded the row. The anchor must be an **org
  captured at upload time** (the acting org); `Attachment.uploaded_by` is a *user* FK,
  and a user may hold memberships in several orgs, so it is not an org anchor by itself.
- `OBJECT` — per-record object grants only (explicit sharing, never routine ownership).

Target matrix (tier vocabulary): `ClientProfile` = SHARED read / SHARED CHANGE now,
CREATOR (owner) later; `ClientDocument` = SHARED read / CREATOR write (matches `main`
today, expressed as a tier instead of guardian rows); `Note` = SHARED read / CREATOR
write; `Task` = SHARED read now / ORG read later (product change), CREATOR write now /
ORG write later.

For the org-owning domains (`Note`, `Task`, `ClientDocument`) the `CREATOR` and `ORG`
write cells coincide — the row's org is set to the creating org, so both are the
org-scoped `can_obj` arm RFC 0003 implements. `Task`'s listed `CREATOR` → `ORG` write
movement is therefore not a write change at all: **the only `Task` behavior change is
the read narrowing (SHARED → ORG)**, which needs explicit product sign-off.

## Why the current machinery cannot express this

`OrgScoped.org_via` is a single knob that drives **both** `visible()` (read) and
`can_obj()` (write):

- `org_via = ()` → ORG read **and** ORG write — the future `Task` cell. Expressible.
- `org_via = None` → SHARED read, but writes **fail closed** (finding C1): `can_obj` only
  accepts the object arm or the global tier. That expresses only "shared read, writes
  need an owner/object grant" — **not** the `ClientProfile` SHARED-write cell (`main`
  today) and **not** a `Note`-style SHARED-read + CREATOR-write cell.

So the cells that are inexpressible today are: (1) SHARED write on a platform-shared
row (`ClientProfile` today), and (2) SHARED read with an org-anchored write (`Note`, and
the `Task` future). Both are the same root cause: **read scope and write scope fall out
of one declaration instead of being chosen independently.** The creating-org writes that
`main` already does per-record (notes, tasks, docs) are expressible today only through
the object arm / guardian rows — exactly the rule-4 shape the cutover must replace.

## Precondition — decouple read scope from write scope

The prerequisite to the clients cutover (and inherited by the notes/tasks cutovers in
RFC 0003) is letting a model declare read scope and write scope independently:

- `visible()` (read) keeps using the **read scope**: `SHARED` ⇒ the platform-shared read
  rule; `ORG` ⇒ the org filter.
- `can_obj()` (write) consults the model's **write tier**: `SHARED` ⇒ holds the perm
  anywhere (`can_anywhere`); `CREATOR`/`ORG` ⇒ org filter against the declared anchor;
  `OBJECT` ⇒ object arm.

**C1 reframed, not discarded.** Finding C1 made platform-shared writes fail closed on the
premise that writes would be org-owned. The product says `ClientProfile` writes are
SHARED today. So C1 becomes the **default** for a platform-shared model with **no
declared write tier** — and declaring a SHARED write tier for a specific model is an
explicit, reviewed exception to that default. The fail-closed default still applies to
any model that has not declared a write tier, and the read rule never feeds an undeclared
write. C1's safety property is preserved; it is no longer a universal invariant for
platform-shared models.

ADR rule 4 still holds: ownership is a data property or an explicit sharing grant, never
a grant row written at record-creation time. The tier model is consistent with rule 4 —
`CREATOR`/`UPLOADER` tiers are data properties (org FKs), `OBJECT` is explicit sharing,
and nothing writes grants at creation for routine ownership.

## Client-domain decisions (this RFC)

1. **`ClientProfile` — SHARED read, SHARED write (matches `main` today); owner-tier
   later.** On `main`, client CHANGE/DELETE come from **model-level permissions on the
   CASEWORKER group** (`notes/groups.py` grants `ClientProfile.CHANGE/DELETE/ADD/VIEW`;
   `create_client_profile` assigns no per-record guardian rows), so `filter_for_user`
   returns every client to any holder — global-tier behavior in disguise. The cutover
   preserves this exactly: the write check is "holds the permission anywhere"
   (`can_anywhere`) rather than C1 fail-closed. **No column, no backfill, no object
   grants at creation, no behavior change.** The later owner-tier (created-by-org) is a
   write-tier change, not schema debt now — see "Future Option A" below.

2. **`ClientDocument` — read shared; write = creating/uploading org (matches `main`
   today).** On `main`, `resolve_upload` assigns per-record CHANGE+DELETE to the
   uploading org's caseworker group, and delete gates on `PermissionedQuerySet(…,
   [DELETE])` — so doc writes are **already** uploading-org-scoped. The cutover
   expresses that as a `CREATOR`/`UPLOADER` tier instead of guardian rows — same
   behavior, no expansion. The org anchor must be **captured at upload** (the acting org
   that `resolve_upload` assigns the guardian row to today) — `Attachment.uploaded_by`
   is only a *user* FK and is not an org anchor by itself; explicit cross-org doc
   sharing, if ever product-real, rides the OBJECT tier. There is no broad doc-write to
   narrow later.

3. **`Note` / `Task` — owned by RFC 0003**, but their cells (`Note` SHARED-read /
   CREATOR-write; `Task` SHARED-read now / ORG-read later) are why the § Precondition
   decoupling is shared infrastructure, not client-specific. RFC 0003 must treat
   org-only task reads as a **product-signaled behavior change**, not a parity target.

**The client family rides `ClientProfile`'s tier.** `ClientContact`,
`ClientHouseholdMember`, `HmisProfile`, and `SocialMediaProfile` are platform-shared
full-CRUD on `CASEWORKER` today (`notes/groups.py`) — the same shape as `ClientProfile`.
They cut over together and **inherit `ClientProfile`'s tier cells** (SHARED read / SHARED
write now; the owner-tier applies to the family later), so no sibling is forgotten or
left on the legacy path with a divergent tier.

**Client read surface (decision — 2026-09-02): dedupe search, not blanket VIEW.**
The `ClientProfile` tier cell stays SHARED (any holder reads all rows); this decision
sets **which roles hold the client perms**. Shelter operators need to find existing
profiles (so they do not create duplicates), but they do not need — and should not
get — the full platform-wide casework record:

- **Full `ClientProfile.VIEW`/`CHANGE`/`DELETE` leave the `SHELTER_OPERATOR` role**
  (caseworker/global-tier territory). A client shown *inside a shelter-scoped record*
  (a guest on a visible reservation) is a **contextual read** — authorized by the
  parent's shelter scope (ADR §2.6), never by a platform-wide client perm.
- **A purpose-built dedupe search** (`clientSearch`) returns a narrow projection —
  name, DOB, and enough to pick the right record, not the casework fields — gated by a
  dedicated permission (e.g. `clients.search_clientprofile`) on Shelter Operator and
  Caseworker. Row scope is platform-wide **on purpose** (dedupe must find clients other
  orgs created); the *field surface* is capped by the endpoint, so no field-level ACL
  or condition axis is required.
- **No client writes** for shelter operators, ever.
- Cutover notes: removing full VIEW is a *narrow* vs `main` (operators surface clients
  only through reservations today), so it ships with the reservation re-gating; the
  search projection's fields and PII-search audit logging are cutover sub-decisions.

## Future Option A — `created_by_org` (owner-tier for clients, parked)

When product adopts org ownership/transfer, `ClientProfile` gains
`created_by_org = ForeignKey(Organization)` (nullable) and its write tier becomes
`CREATOR`. Kept from the earlier draft for that day:

- ✅ Ownership is a data property (rule 4); "who owns this client" is a column —
  reporting, HMIS export, admin.
- ⚠️ Adds a column + backfill migration; creator-at-creation makes the first org to touch
  a client the authority even under routine co-service; a single mutable owner is
  zero-sum for co-service (mitigated by the OBJECT tier for explicit sharing).
- ⚠️ Backfill leaves orphans (importer-created rows with no guardian row → NULL →
  global-only unless a default org is chosen). The orphan fraction should be quantified
  before any owner-tier cutover.
- The owner arm is now well-defined: it is the `CREATOR` write tier applied to a
  platform-shared model — the § Precondition machinery, not a new ad-hoc seam.

## Not decided here (parked, product-triggered)

- When (or whether) org ownership/transfer becomes the `ClientProfile` rule (owner-tier
  via `created_by_org`).
- Whether `ClientProfile` DELETE becomes soft/anonymize, and whether DELETE narrows
  before CHANGE does.
- Whether `Task` reads narrow from shared (main today) to org-only — a **behavior
  change** that needs explicit product sign-off (RFC 0003 owns the mechanics).
- Whether explicit cross-org sharing (object grants) is product-real for client
  documents, notes, or tasks — the OBJECT tier stays available but unactivated.
- Whether read privacy narrows below `SHARED` (per-program / consent) — the write model
  rides whatever granularity the read model settles on.
- **Client-relative read scoping** — "org B sees only rows relevant to the clients it
  co-serves" — the condition axis below `SHARED`, not expressible with the read tiers
  as defined (ADR 0001 §3).

## Open sub-decisions (for the cutover PR, not this RFC)

- Exact declaration form for the decoupled scopes (e.g. `write_tier` alongside `org_via`,
  or a model capability) and the E00x checks that keep it honest at deploy time.
  Concretely: an E00x that **requires a declared write tier to be explicit and
  auditable** — e.g. it fires when a *scoped* Role carries a permission whose model
  declares a SHARED write tier without a tier-table entry, so parity SHARED writes
  riding scoped roles (like `ClientProfile.CHANGE/DELETE` on a scoped
  `CASEWORKER_ROLE`) are deliberate, not accidental.
- Which write services on `ClientProfile` switch from the legacy read-side load
  (`filter_for_user`) to the SHARED-write check, and the parity tests that prove no
  behavior change.
- How `ClientDocument` CHANGE/DELETE expresses the creating-org tier in the cutover
  (replacing the per-record guardian rows from `resolve_upload` / `PermissionedQuerySet`
  with the tier check) without changing behavior.
- **Sharing revocation on member removal — resolved (2026-09-02).** Object grants gain
  a **granting-org provenance** (the org the share was made on behalf of). On
  `organization_remove_member`, `OrgRoleManager` revokes the member's org-scoped Grants
  **and** their object grants whose granting org is the org they left (hybrid: org-
  member grantees lose org-derived shares; non-member collaborators keep access until
  an explicit admin unshare). Add an admin "shares held by former members" review list
  as a safety net. Schema: one nullable granting-org FK on `Grant` (plus the E00x
  org-principal-forbid check, ADR §2.5); no sharing has shipped, so no backfill.
