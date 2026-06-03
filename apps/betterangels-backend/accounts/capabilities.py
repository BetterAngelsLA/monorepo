from common.permissions.capabilities import make_capabilities_type

from .permissions import UserOrganizationPermissions

AccountsCapabilities = make_capabilities_type("AccountsCapabilities", UserOrganizationPermissions)
