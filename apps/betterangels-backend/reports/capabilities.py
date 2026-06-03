from common.permissions.capabilities import make_capabilities_type

from .permissions import ReportPermissions

ReportsCapabilities = make_capabilities_type("ReportsCapabilities", ReportPermissions)
