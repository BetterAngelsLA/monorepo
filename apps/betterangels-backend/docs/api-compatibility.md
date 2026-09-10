# API Compatibility — Mobile Clients vs Instant Backend Deploys

How to change the GraphQL API without breaking the **released mobile app** (`libs/expo/betterangels`, shipped through EAS).

## The asymmetry

- The backend deploys in minutes; the app in users' hands does not.
- Web apps (`betterangels-admin`, `shelter-web`, `react/*`) deploy with the backend — they do not constrain schema changes. **Mobile clients do.**
- **EAS Update** can ship JS-only changes without a store review, but the update still applies on a user's **next app open** and only within the same `runtimeVersion`. It is a fast window, not an instant one — and a native-dependency change needs a full store build.

## The rules

1. **Never add a required input field (or required argument) in one step.**
   - New client → old backend: `Field 'organizationId' is not defined by type 'CreateTaskInput'`.
   - Old client → new backend: `Field 'organizationId' of required type 'ID!' was not provided`.
   - So neither side can ship first alone — a **tolerant middle phase is mandatory** (below).
2. **Never remove a field, mutation, or fallback** until clients using it are gone. Check usage first: `git grep <symbol> origin/main -- libs/expo`.
3. **Additive changes are deploy-safe**: new fields, new *optional* inputs/arguments, new queries/mutations, and server-side directive swaps (`@hasPerm` etc. — clients never send directives). No staging needed.
4. **Semantic tightening needs its data story**: if enforcement starts denying callers who previously succeeded, the conversion (grant/role backfills — e.g. the `post_migrate` grant backfills in `accounts/apps.py`) must be live **before** the enforcement ships.

## The recipe: tolerant → release → strict

For any change that moves the contract (new required field, fallback removal, enforcement flip), split it across **three deployments**:

| Step | What ships | Why it's safe |
| ---- | ---------- | ------------- |
| **1. Tolerant backend** | Backend accepts both behaviors: implement the new path when the new input/argument is present; keep the **old behavior verbatim** when it is absent. Pin both paths in tests. | Old binaries keep working; new binaries exercise the new path early. Deploy immediately. |
| **2. Client release** | The app change that sends the new input. Prefer EAS Update on the current `runtimeVersion`; store build otherwise. | Backend already accepts it; un-updated binaries still ride the tolerant path. |
| **3. Strict flip** | Make the field required / delete the fallback. A **separate, small PR**. | Only after adoption. Old binaries now fail — by design, and only when we chose the moment. |

Rules of thumb:

- **Do not bundle step 3 into step 1 "to save a deploy."** Review/merge timing is not release timing; the gate is *adoption*, and a bundled flip removes the option to wait.
- Ship each step as its own PR (steps 1 and 3 may be stacked, with the step-3 PR carrying a **DO NOT LAND** checklist: tolerant backend live → build released → adoption window elapsed).
- Put the ordering requirement in the PR bodies and link the related PRs (see examples below).

## Examples

- **Teams — header retirement (DEV-2566).** `TeamFilter.organizationId` already existed and the backend already prefers the filter, falling back to the `X-Organization-ID` header — so the FE change alone was safe to ship **first** (#2458). The header/middleware retirement (#2450) and the interceptor removal (#2452) wait for the FE build's adoption.
- **Tasks — payload org (RFC 0003 slice 1, DEV-2561).** `createTask` grew `organizationId`. Tolerant backend + mobile wiring (#2457, with `task_create_legacy` preserving the pre-cutover path), strict flip (#2459) gated on the app build being live.

## What non-holders see

Staging controls *when* the contract moves; what a caller *without* authority gets (OperationInfo vs top-level error vs empty list) is pinned per mechanism in [`graphql_errors.md` §1.4.1](./graphql_errors.md) — denial-shape tests belong in the domain's parity suite (`tasks/tests/test_grant_authorization.py`, `clients/tests/test_clients_grant_authorization.py`, …).
