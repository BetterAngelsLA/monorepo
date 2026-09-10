"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User as AccountUser
from common.graphql.org import resolve_org_or_deny
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import (
    PERMISSION_DENIED_MESSAGE,
    IsAuthenticated,
    require_can,
)
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
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
        """List an organization's teams — grant-only at the payload org.

        The org comes from the ``organizationId`` filter, and nowhere else — a
        caller who names no org (or an unknown one) is denied.  Teams is
        header-free like reports and member management (ADR 0001 §5.3).
        """
        user = cast(AccountUser, get_current_user(info))
        org = resolve_org_or_deny(getattr(filters, "organization_id", None) if filters else None)
        require_can(user, Team.perms.VIEW, org=org)
        return team_list(organization=org)


@strawberry.type
class Mutation:
    """Team mutations — grant-only authority (ADR 0001 §5.3).

    Each authorizes via :func:`common.permissions.utils.require_can` at the org
    resolved from the payload: ``createTeam`` carries ``organizationId`` (no
    row exists to scope by yet); update/delete use the team row's org.  The
    legacy ``PermissionGroup`` arm is not consulted.
    """

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        org = resolve_org_or_deny(data.organization_id)
        require_can(get_current_user(info), Team.perms.ADD, org=org)
        return cast(TeamType, team_create(name=data.name, organization=org))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        team = team_get(pk=data.id)
        if team is None:
            # One refusal for missing and forbidden rows — no existence oracle.
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)
        # Authorize at the row's org — no header involved.
        require_can(get_current_user(info), Team.perms.CHANGE, org=team.organization_id)

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
        team = team_get(pk=data.id)
        if team is None:
            # One refusal for missing and forbidden rows — no existence oracle.
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)
        # Authorize at the row's org — no header involved.
        require_can(get_current_user(info), Team.perms.DELETE, org=team.organization_id)
        deleted_id = team.pk
        team_delete(team=team)
        return DeletedObjectType(id=deleted_id)
