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
    legacy_inert=True,
)

ORG_SUPERUSER = TemplateConfig(
    name="Organization Superuser",
    permissions=[
        *ORG_ADMIN.permissions,
        UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE,
    ],
    is_invitable=False,
    legacy_inert=True,
)


# ── Role definitions (ADR 0001 §2.2 — org-admin cutover) ─────────────────
# Role-backing ORG_ADMIN / ORG_SUPERUSER lets the teams, reports, and
# member-management surfaces read authority from Grants (``can()``) instead of
# legacy ``PermissionGroup`` rows.
#
# Each RoleDef is built from its TemplateConfig via ``RoleDef.from_template``
# so the grant-side bundle is the SAME source as the (now inert) legacy
# template — ORG_SUPERUSER = ORG_ADMIN + ``change_org_member_role`` — and a
# mirrored Grant can never drift from, or amplify beyond, the legacy bundle.
# ``RoleDef.from_template`` copies the permission list, so the two cannot
# diverge by hand.  (This is deliberate for ORG_ADMIN/ORG_SUPERUSER only:
# ``CASEWORKER_ROLE`` carries a strict subset of its template — RFC 0003 step
# 1 — and is defined by hand in notes/groups.py.)
ORG_ADMIN_ROLE = RoleDef.from_template(ORG_ADMIN)
ORG_SUPERUSER_ROLE = RoleDef.from_template(ORG_SUPERUSER)

ORG_ADMIN_ROLES: tuple[RoleDef, ...] = (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE)
