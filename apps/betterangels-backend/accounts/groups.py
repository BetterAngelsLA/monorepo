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
# Role-backing ORG_ADMIN / ORG_SUPERUSER lets the teams, reports, and
# member-management surfaces read authority from Grants (``can()``) instead of
# legacy ``PermissionGroup`` rows.
#
# The scoped Roles carry ``teams.*`` + ``reports.view_reports`` +
# ``organizations.*`` — codenames that resolve to a real model's ContentType
# (``_resolve_permissions`` binds ``reports.view_reports`` to
# ``ScheduledReport`` and the member-management portal codenames to the
# org-root ``Organization`` model).  The bundles mirror the legacy templates
# exactly — ORG_SUPERUSER = ORG_ADMIN + ``change_org_member_role`` — so a
# mirrored Grant never amplifies a holder beyond their legacy bundle.  The
# legacy ``PermissionGroup`` rows are kept (dual write) until reconcile
# retires them.
ORG_ADMIN_ROLE = RoleDef(
    name=ORG_ADMIN.name,
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
    is_invitable=ORG_ADMIN.is_invitable,
)

ORG_SUPERUSER_ROLE = RoleDef(
    name=ORG_SUPERUSER.name,
    # The template's bundle verbatim: ORG_ADMIN + ``change_org_member_role``.
    permissions=[
        *ORG_ADMIN_ROLE.permissions,
        UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE,
    ],
    is_invitable=ORG_SUPERUSER.is_invitable,
)

ORG_ADMIN_ROLES: tuple[RoleDef, ...] = (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE)
