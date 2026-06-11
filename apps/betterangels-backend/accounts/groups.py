# GroupTemplateNames lives in its own module to avoid circular imports.
# Re-exported here for backward compatibility.
from accounts.group_names import GroupTemplateNames  # noqa: F401
from accounts.permissions import UserOrganizationPermissions
from common.permissions.config import TemplateConfig
from reports.permissions import ReportPermissions

ORG_ADMIN = TemplateConfig(
    name="Organization Admin",
    permissions=[
        UserOrganizationPermissions.ACCESS_ORG_PORTAL,
        UserOrganizationPermissions.ADD_ORG_MEMBER,
        UserOrganizationPermissions.REMOVE_ORG_MEMBER,
        UserOrganizationPermissions.VIEW_ORG_MEMBERS,
        ReportPermissions.VIEW_REPORTS,
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
        ReportPermissions.VIEW_REPORTS,
    ],
    is_invitable=False,
)
