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
# Role-backing ORG_ADMIN / ORG_SUPERUSER lets the team mutations authorize via
# Grants (``can()``).  The Role carries only ``teams.*``: the member-management
# codenames (``organizations.*``) and ``reports.view_reports`` resolve to no
# concrete model, so a RoleDef carrying them fails ``sync_roles``' phantom-
# ContentType guard; those surfaces stay legacy until their own cutover.
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
