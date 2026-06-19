from accounts.permissions import ReportOrgPermissions, UserOrganizationPermissions
from common.permissions.config import TemplateConfig
from teams.models import Team

ORG_ADMIN = TemplateConfig(
    name="Organization Admin",
    permissions=[
        UserOrganizationPermissions.ACCESS_ORG_PORTAL,
        UserOrganizationPermissions.ADD_ORG_MEMBER,
        UserOrganizationPermissions.REMOVE_ORG_MEMBER,
        UserOrganizationPermissions.VIEW_ORG_MEMBERS,
        ReportOrgPermissions.VIEW_REPORTS,
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
        UserOrganizationPermissions.ACCESS_ORG_PORTAL,
        UserOrganizationPermissions.ADD_ORG_MEMBER,
        UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE,
        UserOrganizationPermissions.REMOVE_ORG_MEMBER,
        UserOrganizationPermissions.VIEW_ORG_MEMBERS,
        ReportOrgPermissions.VIEW_REPORTS,
        Team.perms.ADD,
        Team.perms.CHANGE,
        Team.perms.DELETE,
        Team.perms.VIEW,
    ],
    is_invitable=False,
)
