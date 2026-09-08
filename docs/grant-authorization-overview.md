# Grant-based authorization — overview & path (from PR #2409)

This is the **intent and roadmap** doc for the grant-based authorization migration.
Read this first; ADR 0001 (`docs/adr/0001-grant-based-authorization.md`) is the full
design source of truth, and the practical review/merge guide
(`docs/grant-migration-merge-guide.md`) is written as the stack matures.

## What we are building

BetterAngels' authorization today is two legacy mechanisms that do not scale to
cross-org work:

- **`PermissionGroup`** (a `Group` subclass) — org-scoped *role* rows, one per
  organization, whose permissions are **model-level**. A holder's reach is
  "everything of that model in my org" — or, when a perm is granted globally,
  "everything everywhere" (the org-bypass bug class).
- **guardian per-record rows** — written at record-creation time to say "the creating
  org may edit this row". This is ADR rule 4's forbidden shape, and it cannot express
  cross-org delegation, sharing, or a coherent read/write split.

We are replacing both with a **grant-based model** (ADR 0001):

1. **`Role` is organization-independent; a `Grant` carries the organization.**
   A `Role` (a `Group` subclass) is a named capability set. It is either
   *global* (`is_global=True`, held directly in `user.groups` — the global tier) or
   *scoped* (`is_global=False`, exercised only through a `Grant`).
2. **`Grant` rows are the only delegation.** A grant says "this principal
   (user, or org acting through its members) holds this role at this scope
   (an organization, or a single object)". One-hop, no denies, no transitivity.
3. **Three tiers compose per check:**
   - **Global** — superuser / global `Role` → unconfined (`ALL`).
   - **Org-scoped** — a `Grant` at an org → rows whose org is in the user's scopes
     (plus org→org delegation, one hop, no amplification).
   - **Object** — a `Grant` on a single record (the object arm) → per-record sharing.
4. **Shared subject matter is a property of the data.** Each model declares its org
   reach via `OrgScoped.org_via` (`()` = own `organization` FK; hop tuples; `None` =
   platform-shared). Per-record *writes* fail closed (`can_obj`), never fall back to
   the read rule (finding C1).

**Intended end state:** every domain reads and writes through the predicate
(`scopes`/`visible`/`can`/`can_obj`/`can_anywhere` in
`common/permissions/selectors.py`); legacy `PermissionGroup` and guardian rows are
torn down per domain; and the frontend gates on capabilities
(`currentUser.permissions`) rather than raw perms.

## The access model in one picture

A user's authority is the union of:

| Tier | How granted | Reach |
|---|---|---|
| Global | global `Role` in `user.groups` | every row of every permitted model |
| Org | `Grant(role=…, scope_org=org)` | rows whose org is in `scopes()` |
| Object | `Grant(role=…, scope_object=row)` | that one row (plus `org_via` descendants) |

Roles are declared as code-owned `RoleDef`s per domain (e.g.
`shelters/groups.py`: `SHELTER_OPERATOR_ROLE` scoped + `GLOBAL_SHELTER_OPERATOR_ROLE`
global — the modern GSO; `accounts/groups.py`: `ORG_ADMIN_ROLE` /
`ORG_SUPERUSER_ROLE` scoped). Which roles an org type offers lives in
`common/org_types.py` `REGISTRY`. Per-model scope is declared on the model
(`OrgScoped.org_via`). The per-model **read/write tier matrix** (which actions are
SHARED vs org-owned vs per-record, per model) is designed in RFC 0002
(`docs/adr/0002-client-writes-ownership.md`).

## Terminology (one line each)

| Term | Meaning | Full design |
|---|---|---|
| **RoleDef** | the code declaration of a role: a name + its permission list + whether it is global | ADR §2.2 |
| **Role** | the `RoleDef` materialized as a DB row by `sync_roles` | ADR §2.2 |
| **Grant** | the **only** scoped authority row: *who holds which role where* (principal = user or org; scope = org or object) | ADR §2.2 |
| **global tier** | a global `Role` held directly in `user.groups` (never a `Grant`); reach = every row of every permitted model (`ALL`) | ADR §2.1/§2.4 |
| **org tier** | a `Grant` at an organization; reach = rows whose org is in `scopes()` | ADR §2.4 |
| **object arm** | a `Grant` on a single record; per-record sharing, user-principal only, whitelist-gated | ADR §2.5 |
| **delegation** | an org-principal `Grant`: org A holds role R *at* org B, so A's members who hold R at A act at B (one hop, role-keyed, no amplification) | ADR §2.2/§3, §2.9 Ex. 4 |
| **`scopes()`** | the function that answers "where does this user hold this permission": `ALL` or a set of org ids | ADR §2.4 |
| **`org_via`** | the per-model declaration of how a row reaches an org (`()` = own FK; hop tuples; `None` = platform-shared) | ADR §2.3 |
| **read/write tier** | the per-model choice of read scope (`SHARED`/`ORG`) and write scope (`SHARED`/`ORG`/`CREATOR`/`UPLOADER`/`OBJECT`) | RFC 0002 |

End-to-end traces of these pieces working together — shelter operator, global + read-only
roles, cross-org caseworkers, delegation, object grant — are in **ADR §2.9 worked examples**.

## The path — PR #2409 onward

Every PR is based on the previous branch (a linear stack; `#2409` bases `main`).
Review and merge **bottom-up**. What each PR delivers:

| # | Branch | Delivers |
|---|---|---|
| 2409 | `grant-redesign` | **This PR.** ADR 0001 + `Role`/`Grant`/`OrgScoped` models, constraints (partial uniques, `NULLS NOT DISTINCT`), E001–E005 checks, migrations. Schema-only — nothing reads it yet. |
| 2410 | `grant-roles` | `RoleDef` provisioning (`sync_roles`), grant backfills, `OrgScoped` declared on shelter-scoped models. Idempotency + `is_global` ownership rule. |
| 2411 | `grant-predicate` | `common/permissions/selectors.py` — the whole predicate (`scopes`/`visible`/`can`/`can_obj`/`can_anywhere`) + write services. The security core. |
| 2412 | `grant-cutover` | Shelter domain flipped to grants. Every mutation/service checks `visible`/`can` (no fail-open); `active_org` header optional. |
| 2413 | `grant-delegation` | Org→org delegation: inherited `scopes()` arm, one hop, no amplification, `grant_delegate`, admin inlines. |
| 2414 | `grant-reachability` | FE capability contract: `currentUser.permissions` (global), grants-based org list, per-org permissions. |
| 2415 | `grant-object-arm` | Object-grant arm: whitelist, `_object_grant_q`, `grant_obj`, orphan cleanup. **C1** — `can_obj` fails closed on per-record writes. |
| 2416 | `grant-teardown` | Shelter Operator grant-only; `reconcile_org_groups`; admin role-loss awareness. |
| 2418 | `grant-hygiene` | Global-role write guards; Grant admin role filter; dead-code removal; RFC 0002 decision doc. |
| 2419 | `grant-gso-teardown` | GSO legacy `PermissionGroup` deleted; Role-tier test contract. |
| 2420 | `grant-query-opt` | `scopes()` full memoization; reconcile single role-name lookup. |
| 2425 | `fe-capability-plumbing` | FE plumbing: `UserProvider` forwards `currentUser.permissions`; pure `hasPermission` gate. |
| 2426 | `grant-matrix-fix` | ADR §4.1 per-domain readiness matrix + §5.3 milestone + `org_via = ()` corrections. |
| 2427 | `grant-teams-dual` | §5.3 slice 1 — teams mutations authorize via grant OR legacy (transitional). |
| 2428 | `grant-reports-dual` | §5.3 slice 2 — reports reads authorize via grant OR legacy. |
| 2429 | `grant-members-dual` | §5.3 slice 3 — member management via grant OR legacy. |
| 2433 | `perm-single-seam` | Single seam: `HasOrgPerm` → `permitted_org`; dual extensions deleted. |
| 2434 | `grant-orgadmin-provision` | **§5.3 step 4** — `ORG_ADMIN`/`ORG_SUPERUSER` role-backed + grant-only seam. |
| 2435 | `rfc-guardian-equivalence` | RFC 0003 — caseworker (notes/tasks/referrals) cutover design. |

Earlier audit **fix** links (`#2421`–`#2424`) were folded into their origin PRs and
deleted, not merged as separate PRs.

## What is gated (not in this stack)

- **Clients / HMIS cutover** — gated on the product decision in RFC 0002
  (parity-first: shared read **and** shared write today; owner-tier parked).
- **Notes / tasks / referrals cutover** — RFC 0003 design (guardian-at-creation rows
  are rule-4 violations; org-role writes org-scoped via `can_obj`, shared/foreign rows
  via the object arm).
- **Phase-5 teardown** — delete the legacy `PermissionGroup` model and collapse the
  global-tier helper to `user.has_perm`, once every domain is migrated.
- **Tier-3 FE surfacing** (§5.2) — `canChange`/`canDelete` per row where node-enabled.

## Reading order

1. This overview — the terminology table above; **ADR §2.9** has the concrete traces.
2. `docs/adr/0001-grant-based-authorization.md` — design, rules, migration plan.
   New reader: start at **§2.9 worked examples** (roles/grants/delegation resolved
   for real people and orgs), then read §2 for the formal mechanics.
3. `docs/grant-migration-merge-guide.md` — per-PR review focus (written as the stack
   matures; later PRs carry the current version).
4. RFC 0002 / RFC 0003 (`docs/adr/0002-…`, `0003-…`) — the gated cutovers.
