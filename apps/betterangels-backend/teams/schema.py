"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.selectors import organization_get_for_member
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import (
    IsAuthenticated,
    get_current_organization,
    require_can,
)
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated

from .models import Team
from .selectors import team_get, team_list
from .services import team_create, team_delete, team_update
from .types import CreateTeamInput, TeamFilter, TeamType, UpdateTeamInput


@strawberry.type
class Query:
    @strawberry_django.offset_paginated(
        OffsetPaginated[TeamType],
        permission_classes=[IsAuthenticated],
    )
    def teams(self, info: Info, filters: Optional[TeamFilter] = None) -> QuerySet[Team]:
        """List the active organization's teams, if the user is a member of it."""
        org = organization_get_for_member(
            user=get_current_user(info),
            organization_id=get_current_organization(info),
        )

        if org is None:
            raise PermissionDenied("You do not have access to this organization.")

        return team_list(organization=org)


@strawberry.type
class Mutation:
    """Team mutations — grant-only authority (ADR 0001 §5.3, teams cutover).

    The three mutations authorize via :func:`common.permissions.utils.require_can`
    — the grant predicate (``can()``) over the active organization from the
    ``X-Organization-ID`` header.  ``ORG_ADMIN`` / ``ORG_SUPERUSER`` are
    role-backed with backfilled Grants, so every existing org admin is covered;
    the legacy ``PermissionGroup`` arm is no longer consulted here.
    """

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        org = Organization.objects.get(pk=get_current_organization(info))
        require_can(get_current_user(info), Team.perms.ADD, org=org)
        return cast(TeamType, team_create(name=data.name, organization=org))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        org = Organization.objects.get(pk=get_current_organization(info))
        require_can(get_current_user(info), Team.perms.CHANGE, org=org)
        team = team_get(pk=data.id, organization=org)
        if team is None:
            raise PermissionDenied("You do not have permission to update this team.")

        return cast(
            TeamType,
            team_update(
                team=team,
                name=data.name.value if data.name else None,
                is_active=data.is_active.value if data.is_active else None,
            ),
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_team(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        org = Organization.objects.get(pk=get_current_organization(info))
        require_can(get_current_user(info), Team.perms.DELETE, org=org)
        team = team_get(pk=data.id, organization=org)
        if team is None:
            raise PermissionDenied("You do not have permission to delete this team.")
        deleted_id = team.pk
        team_delete(team=team)
        return DeletedObjectType(id=deleted_id)
