# Permission Architecture

## Two-Layer Model

BetterAngels uses a **two-layer permission model** — org-scoped authority gates access at the organization level, and object-level permissions provide fine-grained per-object access control.

| Layer            | Mechanism                                                        | Scope                                               | Used for                                            |
| ---------------- | ---------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------- |
| **Org-scoped**   | Grants: `can()` / `require_can()` / `scopes()` / `visible()`     | "Can this user perform action X in organization Y?" | Teams, reports, member management, shelters, operator queries |
| **Object-level** | django-guardian + `HasRetvalPerm` (grant object arm in progress) | "Can this user access this specific object?"        | Notes, tasks, referrals, client documents           |

Both layers sit on Django's permission primitives, but they ask different questions and are checked independently.  **ADR 0001 is the source of truth** for the target model — this page describes the current backend wiring.

## How Org-Scoped Authority Works

### Where the org comes from

Prefer the **payload**: query filters and mutation inputs carry the organization (`TeamFilter.organizationId`, `CreateTeamInput.organizationId`), and row-scoped mutations derive it from the row they name.  The `X-Organization-ID` header (set by `OrganizationMiddleware` in `common/middleware/organization.py`) survives in exactly one place — the *teams list read* keeps it as a deprecated fallback so mobile's `useOrgTeams` callers (still sending only `{ isActive }`) keep working until they pass `organizationId` (DEV-2566).  Every other cut-over surface is header-free.

### Grants — the authority

`OrgRoleManager` (`accounts/role_manager.py`) is the mechanical add/remove/clear/replace API for org roles:

- A **`Role`** carries the permission bundle; org-scoped roles are built from a `TemplateConfig` via `RoleDef.from_template()` (e.g. `ORG_ADMIN_ROLE` in `accounts/groups.py`), so the grant bundle cannot drift from the template.
- A **`Grant`** binds a `principal` (user) to a `Role` at a `scope` (org) — and on the object arm, optionally to a specific row.
- Dual-write templates keep their legacy `PermissionGroup` membership, and the `User.groups` m2m edge mirrors it to a `Grant` (`accounts/signals.py`) so every writer — the role manager, Django admin, scripts — stays consistent.  `legacy_inert` templates (ORG_ADMIN / ORG_SUPERUSER, whose apps are all in `LEGACY_INERT_APPS`) are grant-only: no `PermissionGroup` row is created, assigned, or consulted.

### Checking authority

`common/permissions/selectors.py`:

- `can(user, perm, org=…)` — does the user hold the permission at the org?
- `scopes(user, perm)` — the orgs where the user holds it (finite list).
- `visible(qs, perm, …)` / `can_obj(user, perm, obj)` — the object arm: filter/check rows by grant (guardian fallback while domains migrate).
- `switchable_orgs(user)` — the finite org set the frontend may switch into.

`common/permissions/utils.py`:

- `require_can(user, perm, org=…)` — the write gate: raises `PermissionDenied(PERMISSION_DENIED_MESSAGE)` when `can()` is false.  Creates carry an explicit target org and are authorized by `can()`; `can()` never implies the org exists, so resolvers validate the org first (the `_org_or_deny` pattern).
- `IsAuthenticated` — the custom strawberry permission class (raises `UnauthenticatedGQLError`).

The old `HasOrgPerm` extension and the `permissioned_queryset()` / `perm_filter()` / `_perm_q()` helpers are **deleted** — org-scoped surfaces authorize through the selectors above.

## Overview

Permission group templates define a **set of Django permissions** that can be assigned to users within an organization. A user's effective authority is the **union of the roles/Grants** they hold at that org — the template defines the bundle (mirrored by `RoleDef.from_template()`), and cut-over domains read the `Grant` arm while legacy-only domains (notes/clients) still read the template-backed `PermissionGroup` rows.

This composable model means you never need a single monolithic role — you combine templates to build the desired access level.

Each `OrgTypeConfig` exposes a `member_template` field that identifies the default member-level role (e.g. `SHELTER_OPERATOR`, `CASEWORKER`), used by self-signup flows and invite forms.

## Templates

### Organization (app-agnostic)

| Template                   | Config source        | Permissions                                                                                                                    |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Organization Superuser** | `accounts/groups.py` | Org Admin bundle + `CHANGE_ORG_MEMBER_ROLE`                                                                                    |
| **Organization Admin**     | `accounts/groups.py` | `ACCESS_ORG_PORTAL`, `ADD_ORG_MEMBER`, `REMOVE_ORG_MEMBER`, `VIEW_ORG_MEMBERS`, `reports.view_reports`, `teams.add/change/delete/view` |

Both use the `UserOrganizationPermissions` enum directly for the org-level codenames — org-level permissions are not tied to a specific model's `model.perms`.  Both are also `legacy_inert=True`: role-backed (`ORG_ADMIN_ROLE` / `ORG_SUPERUSER_ROLE`, built via `RoleDef.from_template`) and **grant-only** — no `PermissionGroup` row is created, assigned, or consulted (ADR 0001 §5.3).

### Outreach

| Template       | Config source     | Permissions (via `model.perms`)                   |
| -------------- | ----------------- | ------------------------------------------------- |
| **Caseworker** | `notes/groups.py` | CRUD on `Note`, `ServiceRequest`, `ClientProfile` |

Permissions use `Note.perms.*`, `ServiceRequest.perms.*`, `ClientProfile.perms.*` — the model is the source of truth.

### Shelter

| Template             | Config source        | Permissions (via `model.perms`)                 |
| -------------------- | -------------------- | ----------------------------------------------- |
| **Shelter Operator** | `shelters/groups.py` | CRUD on `Shelter`, `Bed`, `Room`, `Reservation` |

Permissions use `Shelter.perms.*`, `Bed.perms.*`, `Room.perms.*`, `Reservation.perms.*`.

## Composing Roles

Roles are built by assigning **one or more templates** to a user within an org:

### Outreach Org Roles

| Role       | Templates Assigned                      |
| ---------- | --------------------------------------- |
| Caseworker | `Caseworker`                            |
| Org Admin  | `Organization Admin` + `Caseworker`     |
| Org Owner  | `Organization Superuser` + `Caseworker` |

### Shelter Org Roles

| Role             | Templates Assigned                            |
| ---------------- | --------------------------------------------- |
| Shelter Operator | `Shelter Operator`                            |
| Shelter Admin    | `Organization Admin` + `Shelter Operator`     |
| Shelter Owner    | `Organization Superuser` + `Shelter Operator` |

## Architecture

### Template ownership

Each app owns its template definitions using the `TemplateConfig` dataclass (`common/permissions/config.py`):

```
common/permissions/config.py  — TemplateConfig dataclass
accounts/groups.py            — ORG_ADMIN, ORG_SUPERUSER
notes/groups.py               — CASEWORKER
shelters/groups.py            — SHELTER_OPERATOR
```

Each `groups.py` imports `TemplateConfig` and defines one or more template configs with a `name` and `permissions` list. The migration imports the config and creates the `PermissionGroupTemplate` in the database.

### Permission sources

- **Django model CRUD**: `model.perms.ADD`, `model.perms.CHANGE`, etc. — auto-generated by `PermissionSet` via `BaseModel`
- **GraphQL domain perms**: enums marked `@register_permission` (e.g. `UserOrganizationPermissions` in `accounts/permissions.py`, `ReportPermissions` in `reports/permissions.py`) — registered in `common/permissions/utils.py` for frontend codegen

### Template ↔ permission binding

`TemplateConfig` is a frozen dataclass that binds a template name to its permission list in one place. This eliminates the risk of a template name and its permissions drifting apart.

## Key Files

| File                                | Purpose                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `common/permissions/selectors.py`   | `can()`, `scopes()`, `visible()`, `can_obj()`, `switchable_orgs()` — grant authority                  |
| `common/permissions/utils.py`       | `require_can()`, `IsAuthenticated`, `register_permission()`, `PERMISSION_DENIED_MESSAGE`              |
| `common/permissions/config.py`      | `TemplateConfig`, `RoleDef` (incl. `from_template()`)                                                 |
| `common/permissions/domain.py`      | `LEGACY_INERT_APPS` / `GLOBAL_TIER_ORG_APPS` — which domains are grant-only                           |
| `accounts/groups.py`                | `ORG_ADMIN` / `ORG_SUPERUSER` templates + role definitions                                            |
| `accounts/role_manager.py`          | `OrgRoleManager` — add/remove/clear/replace org roles; grant-only mirroring for `legacy_inert` roles  |
| `accounts/signals.py`               | `User.groups` m2m edge — mirrors dual-write memberships to `Grant` rows                               |
| `accounts/permissions.py`           | `UserOrganizationPermissions` enum + Django-admin-only `OrganizationAdminPermissions`                 |
| `common/middleware/organization.py` | `OrganizationMiddleware` — kept only for the teams-read fallback (strip = DEV-2566)                   |
| `shelters/selectors/operator.py`    | `shelter_queryset`, `room_queryset`, `bed_queryset` wrappers; `_get` selectors                        |
| `shelters/selectors/reports.py`     | Report aggregation functions                                                                          |
| `shelters/selectors/__init__.py`    | Re-exports from operator.py and reports.py                                                            |
| `shelters/open_at.py`               | `shelters_open_at` helper (extracted from models to break circular imports)                           |
| `shelters/schema.py`                | GraphQL Query/Mutation — thin layer delegating to services + `require_can()`                          |
| `shelters/services/`                | Business logic (shelter/room/bed create/update/delete/clone)                                          |
| `shelters/types/outputs.py`         | `OperatorShelterType` with `get_queryset` hook                                                        |

## Testing

Grant authority is pinned per domain in `tests/test_grant_authorization.py` (teams, reports, member management, clients): scoped Grant holders pass, stale legacy-only holders are denied, cross-org grants are denied, and the global tier applies only where `GLOBAL_TIER_ORG_APPS` says so.  The org-admin backfill conversions are covered in `accounts/tests/test_roles.py`.

`GraphQLBaseTestCase` (`common/tests/utils.py`) provides `execute_graphql()` plus `_set_active_org()` — the latter feeds the deprecated `X-Organization-ID` fallback that the teams-read tests still pin until DEV-2566.

## Adding templates or permissions

- **New template**: Add a `TemplateConfig` entry to the relevant app's `groups.py`, write a data migration that creates a `PermissionGroupTemplate`
- **New model perms for an existing template**: Update the permission list in the app's `groups.py` config
- **New org type role**: Compose existing templates — no migration needed

## Frontend

The GraphQL `OrgPermissions` type exposes granted permissions per domain:

```graphql
type OrgPermissions {
  accounts: [UserOrganizationPermissions!]!
  reports: [ReportPermissions!]!
  shelters: [ShelterPermissions!]!
}
```

The frontend `hasPermission()` helper checks across all domains with O(1) lookup. See `libs/react/betterangels-admin/src/lib/providers/activeOrg/hasPermission.ts`.

## Notes

- `accounts/group_names.py` contains `GroupTemplateNames` — a registry of template name strings. This enum is intentionally thin and may eventually be replaced by each app registering its own names independently, removing the need for `accounts` to know about downstream apps.
- `shelters/permissions.py` is a 3-line bridge that delegates to `Shelter.perms.as_text_choices()` for GraphQL schema generation — `model.perms` is the single source of truth.
- The old `AdminShelterManager`/`AdminShelterQuerySet` and `Shelter.admin_objects` manager were removed — org-scoping now lives in the per-domain selectors (`visible()` / `can()` on the grant arm, with guardian fallback while domains migrate) and `require_can()` at the write boundary.
- The `adminShelters`/`adminShelter` GraphQL queries have been renamed to `operatorShelters`/`operatorShelter` and `AdminShelterType` → `OperatorShelterType` to reflect their role as operator-facing endpoints.
