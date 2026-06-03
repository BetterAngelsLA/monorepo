# Permission Group Templates

## Overview

Permission group templates define a **set of Django permissions** that can be assigned to users within an organization. A user's effective permissions are the **union of all templates** assigned to them for that org.

This composable model means you never need a single monolithic role — you combine templates to build the desired access level.

---

## Templates

### Shared (app-agnostic)

These templates handle **organization membership management** and are reused across all org types (outreach, shelter, etc.):

| Template | Permissions | Purpose |
|----------|-------------|---------|
| **Organization Superuser** | `access_org_portal`, `add_org_member`, `remove_org_member`, `view_org_members`, `change_org_member_role`, `view_reports` | Full org management — can promote/demote roles |
| **Organization Admin** | `access_org_portal`, `add_org_member`, `remove_org_member`, `view_org_members`, `view_reports` | Org management without role changes |

### Outreach

| Template | Permissions | Purpose |
|----------|-------------|---------|
| **Caseworker** | CRUD on notes, clients, tasks, attachments, HMIS profiles | Field work — manage client interactions |

### Shelter

| Template | Permissions | Purpose |
|----------|-------------|---------|
| **Shelter Operator** | CRUD on shelter, bed, room, reservation, reservationclient | Day-to-day shelter operations — manage beds, rooms, and reservations |

---

## Composing Roles

Roles are built by assigning **one or more templates** to a user within an org:

### Outreach Org Roles

| Role | Templates Assigned |
|------|-------------------|
| Caseworker | `Caseworker` |
| Org Admin | `Organization Admin` + `Caseworker` |
| Org Owner | `Organization Superuser` + `Caseworker` |

### Shelter Org Roles

| Role | Templates Assigned |
|------|-------------------|
| Shelter Operator | `Shelter Operator` |
| Shelter Admin | `Organization Admin` + `Shelter Operator` |
| Shelter Owner | `Organization Superuser` + `Shelter Operator` |

---

## How it works

1. Each `Organization` has `PermissionGroup` instances linking it to templates
2. When a user is assigned a role, they're added to the Django `Group` backing each relevant `PermissionGroup`
3. Django unions all group permissions — the user gets access to everything from all their assigned templates
4. `strawberry_django` `HasPerm` checks and the frontend `hasPermission()` helper both resolve against this unified permission set

---

## Adding permissions later

- **New model perms for an existing template**: Write a data migration that calls `template.permissions.add(...)` for the new permissions
- **New template**: Write a data migration that creates a `PermissionGroupTemplate` and assigns its permissions
- **New org type role**: Just compose existing templates — no migration needed

---

## Frontend capabilities

The GraphQL `OrgCapabilities` type exposes granted permissions per domain:

```graphql
type OrgCapabilities {
  accounts: [UserOrganizationPermissions!]!
  reports: [ReportPermissions!]!
  shelters: [ShelterPermissions!]!
}
```

The frontend `hasPermission()` helper checks across all domains with O(1) lookup. See `libs/react/betterangels-admin/src/lib/providers/activeOrg/hasPermission.ts`.
