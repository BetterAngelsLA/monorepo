# Permission System Redesign — Architecture Proposal

**Branch:** `arch/permission-system-redesign`
**Status:** Proposal — for engineering review
**Date:** 2026-07-22

---

## 1. Problem Statement

The current permission system has no tier for **cross-org (platform-level)** roles. A BA staff member who needs to manage shelters across all organizations must either be a Django superuser (too broad) or be manually added to every org (unscalable).

Additionally, Django's built-in `has_perm()` leaks org-scoped group permissions globally — if a user is a "Shelter Operator" in Org A, `user.has_perm("shelters.view_shelter")` returns `True` everywhere, masking whether a check was intended to be org-scoped or global.

---

## 2. Design Goals

| Goal | How |
|---|---|
| **Cross-org roles** (BA Shelter Admin) | Django Groups with real permissions — `has_perm()` works natively |
| **Org-scoped roles** (Shelter Operator, Caseworker) | `PermissionGroup` with org FK and direct M2M to Permission + User |
| **Single entry point for authorization** | `User.has_perm(perm, organization_id=None)` — one function, one mental model |
| **`has_perm()` safety** | Org-scoped backing Groups carry **zero** app-level permissions; `has_perm()` only returns True for global roles |
| **Guardian object-level perms still work** | Each `PermissionGroup` keeps a backing Django `Group` (permissions empty) as guardian anchor |
| **Minimal migration surface** | Drop one field (`PermissionGroup.group`), add two M2Ms, make one FK nullable |

---

## 3. Target Data Model

### 3.1 Django Group — global (platform-level) roles

```python
# Created once, managed via Django admin or seed command
Group.objects.create(name="BA Shelter Administration")
# permissions = [view_shelter, add_shelter, change_shelter, delete_shelter, ...]
# users = [alice, bob]  ← BA staff
```

**Purpose:** Cross-org access. `user.has_perm("shelters.view_shelter")` returns `True` for BA staff. Backed by Django's native `Group`/`Permission` — no custom model needed.

### 3.2 PermissionGroup — org-scoped roles

```python
class PermissionGroup(models.Model):
    name = models.CharField(max_length=255, blank=True)
    
    organization = models.ForeignKey(
        Organization,
        null=True,           # NULL = cross-org (future: PermissionGroupScope)
        blank=True,
        on_delete=models.CASCADE,
        related_name="permission_groups",
    )
    template = models.ForeignKey(
        PermissionGroupTemplate,
        null=True, blank=True,
        on_delete=models.SET_NULL,
    )
    
    # App-level permission checks (used by user.has_perm + permissioned_queryset)
    permissions = models.ManyToManyField(Permission, blank=True)
    
    # Membership
    users = models.ManyToManyField(User, related_name="permission_groups", blank=True)
    
    # Guardian anchor for object-level permissions
    # ⚠️ This Group's permissions MUST remain empty.
    #    App-level checks go through self.permissions (above).
    #    Object-level checks go through guardian via self.group.
    group = models.OneToOneField(Group, on_delete=models.CASCADE, blank=True)

    class Meta:
        constraints = [
            UniqueConstraint(fields=["organization", "template"], name="unique_org_template"),
        ]
```

**Key invariant:** `self.group.permissions` is always empty. App-level permission queries use `self.permissions` (direct M2M). Object-level queries use `self.group` (guardian target). The two never intersect.

### 3.3 PermissionGroupTemplate — role definitions (unchanged structurally)

```python
class PermissionGroupTemplate(models.Model):
    name = models.CharField(max_length=255)
    permissions = models.ManyToManyField(Permission, blank=True)
```

### 3.4 TemplateConfig — registry entries

```python
@dataclass(frozen=True)
class TemplateConfig:
    name: str
    permissions: list[str]
    is_cross_org: bool = False    # ← NEW: True = system-wide Django Group, not PermissionGroup
    is_invitable: bool = True
    # ... email template fields unchanged
```

---

## 4. Authorization Entry Point

### 4.1 User.has_perm() — extended signature

```python
class User(AbstractBaseUser, PermissionsMixin):
    def has_perm(
        self,
        perm: str,
        obj=None,
        organization_id: str | None = None,   # ← NEW kwarg
    ) -> bool:
        """
        Single entry point for all permission checks.
        
        When organization_id is None (default):
          → Django-native global check (Groups + superuser).
          → Safe for admin, middleware, third-party code.
        
        When organization_id is provided:
          → Global check (Django Groups) OR org-scoped check (PermissionGroup).
        """
        if self.is_superuser:
            return True
        
        # Tier 1: Global (Django Groups)
        if super().has_perm(perm, obj=obj):
            return True
        
        # Tier 2: Org-scoped (PermissionGroup)
        if organization_id is not None:
            app_label, codename = perm.split(".", 1)
            return PermissionGroup.objects.filter(
                users=self,
                permissions__codename=codename,
                permissions__content_type__app_label=app_label,
            ).filter(
                Q(organization__isnull=True) | Q(organization_id=organization_id)
            ).exists()
        
        return False
```

### 4.2 Usage across surfaces

```python
# ── Strawberry GraphQL (HasOrgPerm extension) ──
org_id = str(info.context.request.organization_id)
if not user.has_perm("shelters.view_shelter", organization_id=org_id):
    raise PermissionDenied(...)

# ── DRF (HasReportAccess) ──
org_id = request.GET.get("org_id")
if not request.user.has_perm("reports.view_reports", organization_id=org_id):
    raise PermissionDenied(...)

# ── Django admin (no org context) ──
request.user.has_perm("shelters.change_is_reviewed")
# → global only — correct for admin panel

# ── Public shelter listing ──
user.has_perm(Shelter.perms.VIEW_PRIVATE)
# → global only — BA staff see all private shelters

# ── Templates ──
{% if user.has_perm "shelters.view_shelter" organization_id=current_org.id %}
```

### 4.3 permissioned_queryset() — unchanged API, updated internals

The core org-scoping function keeps its current signature. Internally, join paths change:

| Before | After |
|---|---|
| `permission_groups__group__user` | `permission_groups__users` |
| `permission_groups__group__permissions__codename` | `permission_groups__permissions__codename` |
| Cross-org bypass: none | `Q(organization__isnull=True) \| Q(organization_id=...)` |

---

## 5. Role Management

### 5.1 OrgRoleManager — org-scoped roles (updated)

Same API surface. Internal change: `user.groups.add(group)` → `pg.users.add(user)`.

```python
class OrgRoleManager:
    def __init__(self, organization): ...
    def add_roles(self, user, *templates): ...    # pg.users.add(user)
    def remove_roles(self, user, *templates): ... # pg.users.remove(user)
    def clear_roles(self, user): ...              # pg.users.remove(user) per pg
    def replace_roles(self, user, *templates): ...# clear + add
```

### 5.2 SystemRoleManager — cross-org roles (new)

Manages assignments to global Django Groups:

```python
class SystemRoleManager:
    @staticmethod
    def assign(user, *, template_name: str) -> None:
        """Add user to a global Django Group for cross-org access."""
        # e.g., group = Group.objects.get(name="BA Shelter Administration")
        # user.groups.add(group)

    @staticmethod
    def remove(user, *, template_name: str) -> None:
        """Remove user from a global Django Group."""

    @staticmethod
    def create_all() -> None:
        """Idempotent — create all global Groups from CROSS_ORG_ROLES registry."""
```

---

## 6. Guardian (Object-Level Permissions)

### How it works

Guardian's `assign_perm(perm, group, obj)` requires a Django `Group` target. Each `PermissionGroup` has a `group` (OneToOne to `Group`) for this purpose.

```
assign_perm("notes.change_note", permission_group.group, note)
```

This `Group` carries **zero app-level permissions**. It exists solely as a guardian target. This is the key safety invariant.

### Why not a custom UserObjectPermission model?

Guardian supports custom `UserObjectPermission` models (already configured). But `GroupObjectPermission` is more practical — you assign object perms to all members of a role at once. Removing a user from the role automatically revokes object perms.

---

## 7. Cross-Org Role Definitions

```python
# accounts/system_roles.py — NEW FILE
BA_SHELTER_ADMIN = TemplateConfig(
    name="BA Shelter Administration",
    permissions=[
        Shelter.perms.ADD, Shelter.perms.CHANGE, Shelter.perms.DELETE, Shelter.perms.VIEW,
        Bed.perms.ADD, Bed.perms.CHANGE, Bed.perms.DELETE, Bed.perms.VIEW,
        Room.perms.ADD, Room.perms.CHANGE, Room.perms.DELETE, Room.perms.VIEW,
        Reservation.perms.ADD, Reservation.perms.CHANGE, Reservation.perms.DELETE, Reservation.perms.VIEW,
        Shelter.perms.VIEW_PRIVATE,
    ],
    is_cross_org=True,
    is_invitable=False,
)

CROSS_ORG_ROLES = [BA_SHELTER_ADMIN]
```

---

## 8. Query Path Summary

```
                    ┌─────────────────────────────────┐
                    │        user.has_perm()          │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              is_superuser?   Django Groups?   PermissionGroup?
              → GRANT         → GRANT          → GRANT if cross-org
                                               OR org match
                                    │               │
                                    │     ┌─────────┴──────────┐
                                    │     ▼                    ▼
                                    │   permissions            group
                                    │   (app-level             (guardian
                                    │    M2M to                anchor,
                                    │    Permission)           empty perms)
                                    │     │                    │
                                    └─────┴────────────────────┘
                                          │
                                    GRANT / DENY
```

---

## 9. Migration Plan

### Phase 1: Model changes (single migration)

1. Add `PermissionGroup.permissions` — M2M to Permission
2. Add `PermissionGroup.users` — M2M to User
3. Alter `PermissionGroup.organization` — `null=True, blank=True`
4. Add `PermissionGroupTemplate.is_cross_org` — `BooleanField(default=False)`
5. Add `TemplateConfig.is_cross_org` — `bool = False`
6. Replace `Meta.unique_together` with `Meta.constraints` UniqueConstraint

### Phase 2: Data migration

For each existing PermissionGroup:
- Copy `group.permissions.all()` → `self.permissions`
- Copy `group.user_set.all()` → `self.users`
- Clear `group.permissions` (the safety invariant)
- Leave `group` in place (guardian anchor, permissions now empty)

### Phase 3: Code changes

| File | Change |
|---|---|
| `accounts/models.py` | Model fields + `User.has_perm()` override |
| `common/permissions/config.py` | Add `is_cross_org` to TemplateConfig |
| `common/permissions/utils.py` | Updated join paths in `permissioned_queryset()` |
| `accounts/role_manager.py` | `user.groups` → `pg.users` |
| `accounts/extensions.py` | `HasOrgPerm` delegates to `user.has_perm(org_id=...)` |
| `accounts/services.py` | `member_add()` query + seed hook |
| `accounts/system_roles.py` | **NEW** — cross-org role definitions |
| `accounts/system_role_manager.py` | **NEW** — assign/remove/create_all |

### Phase 4: Seed / deploy

```python
# Run once on deploy (idempotent):
from accounts.system_role_manager import SystemRoleManager
SystemRoleManager.create_all()
```

---

## 10. Cross-Org Scope — Future Extension

For "regional manager" use cases (access to orgs A, B, C but not D, E), the design is forward-compatible. Add later:

```python
class PermissionGroup(models.Model):
    # ... existing fields ...
    organizations = models.ManyToManyField(Organization, blank=True)
    # empty = cross-org (all). [org_a, org_b] = subset.
```

The `has_perm()` query already supports this via the `Q(organization__isnull=True) | Q(organization_id=organization_id)` pattern — adding a M2M scope would be a filter addition, not a query rewrite.

---

## 11. Decisions Record

| Decision | Rationale |
|---|---|
| Django Groups = cross-org roles | Django-native, admin-compatible, `has_perm()` works without modification |
| PermissionGroup = org-scoped roles | Already built, just needs internal rewire |
| Keep `PermissionGroup.group` (empty, guardian-only) | Guardian requires `Group` target for `assign_perm()` |
| `User.has_perm(perm, organization_id=None)` as single entry point | Opt-in kwarg, backward-compatible, one function to learn |
| `is_cross_org` on TemplateConfig, not on PermissionGroupTemplate | Config drives behavior; the template model is just storage |
| Defer `organizations` M2M on PermissionGroup | Not needed yet; add when first regional manager use case lands |

---

## 12. References

- [WorkOS: How to design an RBAC model for multi-tenant SaaS](https://workos.com/blog/how-to-design-multi-tenant-rbac-saas) (Nov 2025)
- [AWS Prescriptive Guidance: Multi-tenant access control with RBAC](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/avp-mt-abac-examples.html)
- [Medium: RBAC in Django SaaS — The Architecture That Actually Scales](https://medium.com/@mmoznu/role-based-access-control-in-django-saas-the-architecture-that-actually-scales-with-your-product-8b908a8996f9) (Apr 2026)
- [vCodeWonders: Handling Multitenancy in SaaS](https://vcodewonders.com/handling-multitenancy-in-saas-roles-permissions-rbac-tenant-isolation/) (Jun 2026)
- [Dusko Licanin: Designing RBAC for Multi-Tenant SaaS](https://www.duskolicanin.com/blog/saas-role-based-access-control-rbac-design) (Jun 2026)
