"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from accounts.models import User
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated, get_current_organization
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated

from .models import Team
from .selectors import team_get, team_list
from .services import team_create, team_delete, team_update
from .types import CreateTeamInput, TeamType, UpdateTeamInput


@strawberry.type
class Query:
    @strawberry_django.offset_paginated(TeamType, permission_classes=[IsAuthenticated])
    def teams(self, info: Info) -> OffsetPaginated[TeamType]:
        organization = get_current_organization(info)
        return team_list(organization=organization)


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.ADD)],
    )
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        user = cast(User, get_current_user(info))
        organization = get_current_organization(info)
        return team_create(slug=data.slug, name=data.name, organization=organization, user=user)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.CHANGE)],
    )
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        organization = get_current_organization(info)
        team = team_get(pk=int(data.id), organization=organization)
        if team is None:
            raise ValueError(f"Team with id {data.id} not found.")

        kwargs = {}
        if data.slug is not strawberry.UNSET:
            kwargs["slug"] = data.slug
        if data.name is not strawberry.UNSET:
            kwargs["name"] = data.name
        if data.is_active is not strawberry.UNSET:
            kwargs["is_active"] = data.is_active
        return team_update(team=team, **kwargs)

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
