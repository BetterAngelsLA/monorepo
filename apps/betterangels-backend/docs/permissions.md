# Permission Architecture

## Two-Layer Model

BetterAngels uses a **two-layer permission model** — org-scoped permissions gate access at the organization level, and object-level permissions (via django-guardian) provide fine-grained per-object access control.

| Layer | Mechanism | Scope | Used for |
|---|---|---|---|
| **Org-scoped** | `HasOrgPerm` extension + `permissioned_queryset()` | "Can this user perform action X in organization Y?" | Mutations, operator queries (shelters, rooms, beds) |
| **Object-level** | django-guardian + `HasRetvalPerm` | "Can this user access this specific object?" | Notes, tasks, referrals, client documents |

Both layers are backed by Django's permission system (Groups + Permissions), but they ask different questions and are checked independently.

## How Org-Scoped Permissions Work

### Header-based organization context

A custom `OrganizationMiddleware` (in `common/middleware/organization.py`) reads the `X-Organization-ID` header from incoming requests and sets `request.organization_id`. This value is the canonical source of "which organization are we operating in?" for every request.

### `HasOrgPerm` — the gatekeeper

`accounts/extensions.py` defines a `HasOrgPerm` Strawberry extension that replaces the old `@HasPerm(global)` + `get_user_permitted_org()` pattern:

```python
@strawberry_django.mutation(
    permission_classes=[IsAuthenticated],
    extensions=[HasOrgPerm(Shelter.perms.ADD)],
)
def create_shelter(self, info, data):
    ...
```

How it validates:
1. Reads `info.context.request.organization_id` (set by middleware).
2. If `None`, raises `DjangoNoPermission` immediately.
3. Delegates to `permissioned_queryset(Organization.objects.all(), ...)` with `organization_field="pk"` — checking that the user belongs to the org AND holds the required permission(s) via their `PermissionGroup` → `Group` → `Permission` chain.
4. Fails fast with `fail_silently=False` (default).

### `permissioned_queryset()` — single source of truth

`common/permissions/utils.py` provides `permissioned_queryset(qs, *, user, organization_id, perms=None, any_perm=True, organization_field="organization_id")`:

- Filters `qs` to records in `organization_id`.
- If `perms` is `None`, only checks org membership (user belongs to org).
- If `perms` is provided, also verifies the user holds those permissions through their org's `PermissionGroup` → `Group` → `Permission` chain.
- `organization_field` controls the FK path: use `"organization_id"` for direct-FK models (Shelter), `"shelter__organization_id"` for indirect (Bed, Room), or `"pk"` for Organization itself.

This single function is shared by:
- **`HasOrgPerm.resolve_for_user`** — permission validation at the GraphQL extension level.
- **`shelter_queryset` / `room_queryset` / `bed_queryset`** — selector wrappers that scope list queries and entity lookups.
- **`OperatorShelterType.get_queryset`** — the `strawberry_django` type hook that scopes returned data.

### `_perm_q()` — reusable ORM permission path

`common/permissions/utils.py` provides `_perm_q(app_label, codename, *, prefix="permission_groups__group__permissions")`:

- Default `prefix` resolves `Organization` → `PermissionGroup` → `Group` → `Permission` → `ContentType`.
- Pass `prefix="group__permissions"` when querying `PermissionGroup` directly (e.g., in `permission_annotations()`).
- Used by `HasOrgPerm`, `permission_annotations()`, and `get_user_permitted_org()`.

## Overview

Permission group templates define a **set of Django permissions** that can be assigned to users within an organization. A user's effective permissions are the **union of all templates** assigned to them for that org.

This composable model means you never need a single monolithic role — you combine templates to build the desired access level.

Each `OrgTypeConfig` exposes a `member_template` field that identifies the default member-level role (e.g. `SHELTER_OPERATOR`, `CASEWORKER`), used by self-signup flows and invite forms.

## Templates

### Organization (app-agnostic)

| Template                   | Config source        | Permissions                                                                                              |
| -------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| **Organization Superuser** | `accounts/groups.py` | `ACCESS_ORG_PORTAL`, `ADD_ORG_MEMBER`, `CHANGE_ORG_MEMBER_ROLE`, `REMOVE_ORG_MEMBER`, `VIEW_ORG_MEMBERS` |
| **Organization Admin**     | `accounts/groups.py` | `ACCESS_ORG_PORTAL`, `ADD_ORG_MEMBER`, `REMOVE_ORG_MEMBER`, `VIEW_ORG_MEMBERS`                           |

Both use the `UserOrganizationPermissions` enum directly — org-level permissions are not tied to a specific model's `model.perms`.

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
- **GraphQL domain perms**: `UserOrganizationPermissions` enum (`@strawberry.enum`), resolved via `GrantedPermissions` factory

### Template ↔ permission binding

`TemplateConfig` is a frozen dataclass that binds a template name to its permission list in one place. This eliminates the risk of a template name and its permissions drifting apart.

## Key Files

| File | Purpose |
|---|---|
| `common/permissions/utils.py` | `permissioned_queryset()`, `_perm_q()`, `PermissionSet`, `get_current_organization()` |
| `accounts/extensions.py` | `HasOrgPerm` Strawberry extension |
| `accounts/permissions.py` | `get_user_permitted_org()`, `permission_annotations()`, `GrantedPermissions` factory |
| `common/middleware/organization.py` | `OrganizationMiddleware` — sets `request.organization_id` |
| `shelters/selectors/operator.py` | `shelter_queryset`, `room_queryset`, `bed_queryset` wrappers; `_get` selectors |
| `shelters/selectors/reports.py` | Report aggregation functions |
| `shelters/selectors/__init__.py` | Re-exports from operator.py and reports.py |
| `shelters/open_at.py` | `shelters_open_at` helper (extracted from models to break circular imports) |
| `shelters/schema.py` | GraphQL Query/Mutation — thin layer delegating to services + `HasOrgPerm` |
| `shelters/services/` | Business logic (shelter/room/bed create/update/delete/clone) |
| `shelters/types/outputs.py` | `OperatorShelterType` with `get_queryset` hook |

## Testing

`accounts/tests/test_extensions.py::HasOrgPermTestCase` tests the `HasOrgPerm` extension in isolation (no GraphQL round-trips), covering:
- Happy path (valid org + permission)
- Missing `X-Organization-ID` header
- User not a member of the organization
- User is a member but lacks the required permission
- Unauthenticated user

`GraphQLBaseTestCase` (`common/tests/utils.py`) provides `execute_graphql()` which accepts `**extra` kwargs (e.g., `HTTP_X_ORGANIZATION_ID=str(org_id)`) forwarded to Django's test client for header-based testing.

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
- The old `AdminShelterManager`/`AdminShelterQuerySet` and `Shelter.admin_objects` manager were removed — they've been replaced by `permissioned_queryset()` + selectors + `HasOrgPerm`, which provide the same org-scoping in a single, shared function.
- The `adminShelters`/`adminShelter` GraphQL queries have been renamed to `operatorShelters`/`operatorShelter` and `AdminShelterType` → `OperatorShelterType` to reflect their role as operator-facing endpoints.