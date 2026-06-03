from common.permissions.capabilities import make_capabilities_type

from .permissions import ShelterPermissions

SheltersCapabilities = make_capabilities_type("SheltersCapabilities", ShelterPermissions)
