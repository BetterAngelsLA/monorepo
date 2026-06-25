from common.permissions.utils import permissions_enum_from_model

from .models import Team

TeamPermissions = permissions_enum_from_model(Team)
