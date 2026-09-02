# Grant-based authorization — merge & review guide (PRs #2409–#2434)

How to review and land the grant-migration stack. ADR 0001 is the design source of
truth; this is the practical landing order and what each PR deserves scrutiny on.

## Stack shape

16 stacked PRs (plus this docs PR), each based on the previous branch (`#2409`
bases `main`). Review and merge **bottom-up**; after each merge, retarget the next
PR's base to the merged branch and resolve.

The audit **fix** links that used to sit mid-stack were **folded into their origin
PRs and deleted** — they are not separate PRs (see "Folded into" notes below).

| # | Branch / PR | Review focus |
|---|---|---|
| 2409 | `grant-redesign` | ADR 0001 + `Role`/`Grant` models, constraints (partial uniques, `NULLS NOT DISTINCT`), checks E001–E005. Schema-only — **nothing reads it yet**. |
| 2410 | `grant-roles` | `RoleDef` provisioning (`sync_roles`), backfills, OrgScoped declarations. Idempotency + the `is_global` ownership rule. *Folded in: `view_private_shelter` global-tier-only.* |
| 2411 | `grant-predicate` | `common/permissions/selectors.py` — the whole predicate. Read `scopes`/`visible`/`can`/`can_obj`/`can_anywhere` carefully; this is the security core. |
| 2412 | `grant-cutover` | Shelter domain flipped. Every mutation/service must check `visible`/`can` (no fail-open), `active_org` header optionality. *Folded in: `bed_clone`/`room_clone` require `ADD`.* |
| 2413 | `grant-delegation` | Org→org delegation: `scopes()` inherited arm, one-hop, no-amplification, `grant_delegate`, Grant admin inlines. *Folded in: C-1 role-keyed delegation.* |
| 2414 | `grant-reachability` | FE capability contract: `currentUser.permissions` (global), grants-based org list, per-org permissions. Frontend is the harder-to-verify half — run vitest/codegen in a node-enabled checkout. |
| 2415 | `grant-object-arm` | Object grants: whitelist, `_object_grant_q`, `grant_obj`, orphan cleanup. *Folded in: **C1** — `can_obj` fails closed on per-record writes for platform-shared models; the RFC-0002 precondition note ships with #2418.* |
| 2416 | `grant-teardown` | Shelter Operator grant-only; `reconcile_org_groups` (skip role-backed create, delete stale, revoke grants for dropped roles); admin role-loss grant-awareness. |
| 2418 | `grant-hygiene` | Global-role write guards; Grant admin role filter; dead-code removal; ADR §2.5 reconciliation; RFC 0002. |
| 2419 | `grant-gso-teardown` | GSO legacy `PermissionGroup` deleted by `backfill_global_role_members`; Role-tier test contract. |
| 2420 | `grant-query-opt` | `scopes()` full memoization; `reconcile` single role-name lookup. |
| 2425 | `fe-capability-plumbing` | Sits on `query-opt` (the old docs-matrix link between them was folded into #2426 and removed). FE plumbing + RFC 0002 revocation note + this merge guide. |
| 2426 | `grant-matrix-fix` | Docs. ADR §4.1 matrix **introduced and corrected in this one PR** (the original matrix PR #2424 was folded here), §5.3 milestone, `org_via = ()` corrections. |
| 2427 | `grant-teams-dual` | §5.3 slice 1 — team mutations read grant OR legacy (transitional). |
| 2428 | `grant-reports-dual` | §5.3 slice 2 — reports reads dual. *Folded in: single-join `get_user_permitted_org` fix.* |
| 2429 | `grant-members-dual` | §5.3 slice 3 — member management dual. *Folded in: C-8 — member-list filters + role selectors union Grants.* |
| 2433 | `perm-single-seam` | Single seam: `HasOrgPerm` delegates to `permitted_org`; `HasOrgPermOrGrant` deleted; directives revert to `@hasOrgPerm`. |
| 2434 | `grant-orgadmin-provision` | **§5.3 step 4** — `ORG_ADMIN`/`ORG_SUPERUSER` role-backed + backfill + **grant-only** seam (legacy arms deleted). Tests go grant-only; `Team`/`ScheduledReport` declare `OrgScoped` (E005). |

The old `#2421`–`#2424` fix/docs links no longer exist as PRs — their content is
folded per the table above. `perm/perm-e006` (E006 system check) is a scratch
branch, red by design until audit finding C-0 resolves.

## Verification per PR

- Backend: `POSTGRES_TEST_NAME=<unique> uv run pytest -q` (shared test DB is a hazard —
  isolate before `--create-db`).
- `uv run ruff format --check`, `uv run ruff check`, mypy (strict).
- Schema: export `schema.graphql` and check no diff; FE generated types must be
  regenerated in a node-enabled checkout (`nx codegen` / vitest) — **cannot run in the
  dev container** (no node_modules).
- Pre-commit gate: `ynx-precommit` on the final head.

## After the stack lands

The §5.3 org-admin milestone is **inside** the stack (#2427–#2429 dual slices,
#2433 seam, #2434 provisioning). What remains:

1. **RFC 0003 (§5-equivalence)** — guardian-at-creation domains (notes, tasks,
   referrals). Read this guide's companion RFC: `docs/adr/0003-caseworker-guardian-equivalence.md`.
2. Decide RFC 0002 / ADR §7.6 (per-model read/write tiers for clients; parity-first
   cutover, owner-tier parked) with product — gates clients/HMIS.
3. Clients/notes cutovers (§5/§5.1), then tasks/referrals, then **phase-5 teardown**
   (`PermissionGroup` model removal + global-tier `has_perm` collapse), then tier-3 FE
   surfacing (§5.2) where node-enabled.

Full details: `docs/adr/0001-grant-based-authorization.md`, RFCs
`docs/adr/0002-client-writes-ownership.md` and `docs/adr/0003-caseworker-guardian-equivalence.md`.
