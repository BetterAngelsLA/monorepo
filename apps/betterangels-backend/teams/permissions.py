import strawberry
from common.permissions.utils import permissions_enum_from_model

from .models import Team

TeamPermissions: type = permissions_enum_from_model(Team)
strawberry.enum(TeamPermissions)
