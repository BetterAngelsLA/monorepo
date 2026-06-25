import strawberry
from common.permissions.utils import permissions_enum_from_model

from .models import Team

TeamPermissions = permissions_enum_from_model(Team)
strawberry.enum(TeamPermissions, graphql_name_from='value')  # type: ignore[call-overload]
