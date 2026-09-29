from accounts.permissions import UserOrganizationPermissions
from common.permissions.config import RoleDef, TemplateConfig
from reports.permissions import ReportPermissions
from teams.models import Team

ORG_ADMIN = TemplateConfig(
    name="Organization Admin",
    permissions=[
        UserOrganizationPermissions.ACCESS_ORG_PORTAL,
        UserOrganizationPermissions.ADD_ORG_MEMBER,
        UserOrganizationPermissions.REMOVE_ORG_MEMBER,
        UserOrganizationPermissions.VIEW_ORG_MEMBERS,
        ReportPermissions.VIEW_REPORTS,
        Team.perms.ADD,
        Team.perms.CHANGE,
        Team.perms.DELETE,
        Team.perms.VIEW,
    ],
    is_invitable=False,
)

ORG_SUPERUSER = TemplateConfig(
    name="Organization Superuser",
    permissions=[
        *ORG_ADMIN.permissions,
        UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE,
    ],
    is_invitable=False,
)


# ── Role definitions (ADR 0001 §2.2 — org-admin cutover) ─────────────────
# Role-backing ORG_ADMIN / ORG_SUPERUSER lets the teams and reports surfaces
# read authority from Grants (``can()``) instead of legacy ``PermissionGroup``
# rows.  The scoped Role carries ``teams.*`` + ``reports.view_reports`` —
# codenames that resolve to a real model (``_resolve_permissions`` binds
# ``reports.view_reports`` to ``ScheduledReport``'s ContentType).  The
# member-management codenames (``organizations.*``) are portal actions
# registered on no concrete model, so they cannot ride a RoleDef and stay
# legacy until their own cutover; the legacy ``PermissionGroup`` rows are kept
# (dual write) until the org-admin teardown retires them (``reconcile`` only
# drops stale derived groups, and ORG_ADMIN is still a preset until then).
ORG_ADMIN_ROLE = RoleDef(
    name=ORG_ADMIN.name,
    permissions=[
        ReportPermissions.VIEW_REPORTS,
        Team.perms.ADD,
        Team.perms.CHANGE,
        Team.perms.DELETE,
        Team.perms.VIEW,
    ],
    is_invitable=ORG_ADMIN.is_invitable,
)

ORG_SUPERUSER_ROLE = RoleDef(
    name=ORG_SUPERUSER.name,
    # Same bundle as ORG_ADMIN while teams + reports are the only scoped
    # permissions either role can carry (the phantom-ContentType guard keeps
    # member management legacy).  Derived so the two cannot drift apart until
    # that changes.
    permissions=list(ORG_ADMIN_ROLE.permissions),
    is_invitable=ORG_SUPERUSER.is_invitable,
)

ORG_ADMIN_ROLES: tuple[RoleDef, ...] = (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE)
