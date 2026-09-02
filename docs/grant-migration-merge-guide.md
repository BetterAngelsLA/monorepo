# Grant-based authorization — merge & review guide (PRs #2409–#2424)

How to review and land the grant-migration stack. ADR 0001 is the design source of
truth; this is the practical landing order and what each PR deserves scrutiny on.

## Stack shape

14 stacked PRs, each based on the previous branch (`#2409` bases `main`). Review and
merge **bottom-up**; after each merge, retarget the next PR's base to `main` (or the
merged branch) and resolve.

| # | Branch / PR | Review focus |
|---|---|---|
| 2409 | `grant-redesign` | ADR 0001 + `Role`/`Grant` models, constraints (partial uniques, `NULLS NOT DISTINCT`), checks E001–E005, migration 0008. Schema-only — **nothing reads it yet**. |
| 2410 | `grant-roles` | `RoleDef` provisioning (`sync_roles`), backfills, OrgScoped declarations, migration 0009. Idempotency + the `is_global` ownership rule. |
| 2411 | `grant-predicate` | `common/permissions/selectors.py` — the whole predicate. Read `scopes`/`visible`/`can`/`can_obj`/`can_anywhere` carefully; this is the security core. |
| 2412 | `grant-cutover` | Shelter domain flipped. Every mutation/service must check `visible`/`can` (no fail-open), `active_org` header optionality, `create_shelter` org-existence check. |
| 2413 | `grant-delegation` | Org→org delegation: `scopes()` inherited arm, one-hop, no-amplification ("member + holds a direct grant"), `grant_delegate`, Grant admin inlines. |
| 2414 | `grant-reachability` | FE capability contract: `currentUser.permissions` (global), grants-based org list, per-org permissions. Frontend is the harder-to-verify half — run vitest/codegen in a node-enabled checkout. |
| 2415 | `grant-object-arm` | Object grants: whitelist, `_object_grant_q`, `grant_obj`, orphan cleanup, `pk__lt=0` vs `EmptyResultSet` fix. Note: shipped before its consumer (documented in #2418's ADR §2.5 reconciliation). |
| 2416 | `grant-teardown` | Shelter Operator grant-only; `reconcile_org_groups` (skip role-backed create, delete stale, revoke grants for dropped roles); admin role-loss grant-awareness; **role-form fix** (union Grants into `held`). |
| 2418 | `grant-hygiene` | Global-role write guards on `grant_create`/`grant_delegate`; Grant admin role filter; dead-code removal; ADR §2.5 `OBJECT_ARM_ENABLED` reconciliation; RFC 0002. |
| 2419 | `grant-gso-teardown` | GSO legacy `PermissionGroup` deleted by `backfill_global_role_members`; `test_group_permissions.py` rewritten to the Role-tier contract. |
| 2420 | `grant-query-opt` | `scopes()` full memoization (global-tier checks included); `reconcile` single role-name lookup. |
| 2421 | `grant-canobj-failclosed` | **C1**: `can_obj` fails closed on platform-shared models (object arm / global only). Security-relevant — confirm the read/write split. |
| 2422 | `grant-viewprivate-global` | `view_private_shelter` removed from the scoped SO role (global-tier only). |
| 2423 | `grant-clone-perms` | `bed_clone`/`room_clone` require `ADD`. |
| 2424 | `grant-migration-matrix` | Doc: ADR §4.1 per-domain readiness matrix. |

## Verification per PR

- Backend: `POSTGRES_TEST_NAME=<unique> uv run pytest -q` (shared test DB is a hazard —
  isolate before `--create-db`).
- `uv run ruff format --check`, `uv run ruff check`, mypy (strict).
- Schema: `uv run python manage.py export_schema betterangels_backend.schema > schema.graphql`
  then check no diff; FE generated types must be regenerated in a node-enabled checkout
  (`nx codegen` / vitest) — **cannot run in the dev container** (no node_modules).
- Pre-commit gate: `ynx-precommit` on the final head.

## After the stack lands

1. Decide RFC 0002 / ADR §7.6 (client ownership) with product.
2. **§5.3 org-admin role-backed milestone** — `ORG_ADMIN`/`ORG_SUPERUSER` become
   scoped Roles with backfill; teams, reports, and member management convert to the
   grant selectors atomically (their perms ride that one legacy template — see
   ADR §4.1/§5.3; not standalone cutovers).
3. Tasks/referrals cutover after the §5-equivalence design (guardian-at-creation —
   not mechanical), then clients/notes (§5/§5.1), then phase-5 teardown
   (`PermissionGroup` removal + `has_perm` collapse).

Full details: `docs/adr/0001-grant-based-authorization.md`, RFC `docs/adr/0002-client-writes-ownership.md`.
