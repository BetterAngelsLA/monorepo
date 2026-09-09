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
# Role-backing ORG_ADMIN / ORG_SUPERUSER is what lets the team mutations read
# authority from Grants (``can()``) instead of legacy ``PermissionGroup`` rows.
#
# The scoped Role deliberately carries only ``teams.*`` — the permissions whose
# codenames resolve to a real model.  The member-management codenames
# (``organizations.*``) and ``reports.view_reports`` are registered on no
# concrete model (their codename's last token is not a model name), so a
# RoleDef carrying them fails ``sync_roles``' phantom-ContentType guard; those
# surfaces stay legacy until their own cutover.  The legacy ``PermissionGroup``
# rows are kept (dual write) until reconcile retires them, so member
# management and the admin portal keep working off the legacy arm while the
# team mutations are grant-only.
ORG_ADMIN_ROLE_PERMISSIONS = [
    Team.perms.ADD,
    Team.perms.CHANGE,
    Team.perms.DELETE,
    Team.perms.VIEW,
]

ORG_ADMIN_ROLE = RoleDef(
    name=ORG_ADMIN.name,
    permissions=list(ORG_ADMIN_ROLE_PERMISSIONS),
    is_invitable=ORG_ADMIN.is_invitable,
)

ORG_SUPERUSER_ROLE = RoleDef(
    name=ORG_SUPERUSER.name,
    permissions=list(ORG_ADMIN_ROLE_PERMISSIONS),
    is_invitable=ORG_SUPERUSER.is_invitable,
)

ORG_ADMIN_ROLES: tuple[RoleDef, ...] = (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE)
