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

# ── Role definitions (ADR 0001 §5.3, provisioning) ─────────────────────
# Role-backing ORG_ADMIN / ORG_SUPERUSER is the §5.3 org-admin milestone: once
# ``sync_roles`` creates these scoped Role rows, ``reconcile_org_groups`` stops
# provisioning their legacy ``PermissionGroup`` rows and deletes stale ones, and
# ``OrgRoleManager`` writes Grants instead of group memberships.  Both templates
# are offered by every org type (outreach and shelter) and are scoped (never
# global).

ORG_ADMIN_ROLE = RoleDef.from_template(ORG_ADMIN)
ORG_SUPERUSER_ROLE = RoleDef.from_template(ORG_SUPERUSER)

ORG_ADMIN_ROLES: tuple[RoleDef, ...] = (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE)
