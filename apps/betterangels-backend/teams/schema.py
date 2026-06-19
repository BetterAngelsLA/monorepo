"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated, get_current_organization
from common.team_shim import maybe_value
from strawberry.types import Info

from .models import Team
from .selectors import team_get, team_list
from .services import team_create, team_delete, team_update
from .types import CreateTeamInput, TeamType, UpdateTeamInput


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def teams(self, info: Info) -> list[TeamType]:
        organization = get_current_organization(info)
        return [cast(TeamType, t) for t in team_list(organization=organization)]


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.ADD)],
    )
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        organization = get_current_organization(info)
        return cast(TeamType, team_create(name=data.name, organization=organization))

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.CHANGE)],
    )
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        organization = get_current_organization(info)
        team = team_get(pk=int(data.id), organization=organization)
        if team is None:
            raise ValueError(f"Team with id {data.id} not found.")

        return cast(
            TeamType,
            team_update(
                team=team,
                name=maybe_value(data.name),
                is_active=maybe_value(data.is_active),
            ),
        )

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.DELETE)],
    )
    def delete_team(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        organization = get_current_organization(info)
        team = team_get(pk=int(data.id), organization=organization)
        if team is None:
            raise ValueError(f"Team with id {data.id} not found.")
        team_delete(team=team)
        return DeletedObjectType(id=int(data.id))
