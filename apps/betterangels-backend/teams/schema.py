"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.graphql.utils import maybe_value
from common.permissions.utils import IsAuthenticated, get_current_organization
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django.pagination import OffsetPaginated

from .models import Team
from .selectors import team_get, team_list
from .services import team_create, team_delete, team_update
from .types import CreateTeamInput, TeamType, UpdateTeamInput


@strawberry.type
class Query:
    @strawberry_django.offset_paginated(
        OffsetPaginated[TeamType],
        permission_classes=[IsAuthenticated],
    )
    def teams(self, info: Info) -> QuerySet[Team]:
        org_id = info.context.request.organization_id

        if org_id is None:
            # Every user has an active organization: ActiveOrgProvider selects
            # and persists one as soon as the org list loads, and the clients
            # that query teams wait for it (see useOrgTeams / TeamsPage) rather
            # than asking the server to guess.
            #
            # The server must not guess.  The previous fallback resolved an
            # arbitrary first-match org, which for a multi-org user returned
            # another organization's teams — and it resolved a Caseworker
            # group, so an Org Admin who was not also a caseworker got an
            # error instead of their teams.
            raise PermissionError("Organization ID (X-Organization-ID header) is required.")

        org = Organization.objects.get(pk=str(org_id))
        return team_list(organization=org)


@strawberry.type
class Mutation:
    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.ADD)],
    )
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        org = Organization.objects.get(pk=get_current_organization(info))
        return cast(TeamType, team_create(name=data.name, organization=org))

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.CHANGE)],
    )
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        org = Organization.objects.get(pk=get_current_organization(info))
        team = team_get(pk=int(data.id), organization=org)
        if team is None:
            # Unknown id, or a team belonging to another organization.  A bare
            # ValueError is not one of the exceptions strawberry-django turns
            # into OperationInfo, so it surfaced as an internal server error
            # instead of a denial.
            raise PermissionDenied("You do not have permission to update this team.")

        return cast(
            TeamType,
            team_update(
                team=team,
                name=maybe_value(data.name),
            ),
        )

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.DELETE)],
    )
    def delete_team(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        org = Organization.objects.get(pk=get_current_organization(info))
        team = team_get(pk=int(data.id), organization=org)
        if team is None:
            raise PermissionDenied("You do not have permission to delete this team.")
        team_delete(team=team)
        return DeletedObjectType(id=int(data.id))
