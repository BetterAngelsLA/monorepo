"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User as AccountUser
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
        """List an organization's teams — grant-based (ADR 0001 §5.3).

        The org comes from the ``organizationId`` filter when provided
        (authorized via ``can(teams.view_team)`` at that org); the
        ``X-Organization-ID`` header remains a backward-compatible fallback
        while clients migrate to the filter (the header path is deprecated and
        will be stripped).  Authorizes role-backed ORG_ADMIN/ORG_SUPERUSER and
        CASEWORKER holders (backfilled Grants), the global tier, or a
        direct-grant holder.  Membership is not consulted.
        """
        user = cast(AccountUser, get_current_user(info))
        org = _resolve_teams_org(info, filters)
        require_can(user, Team.perms.VIEW, org=org)
        return team_list(organization=org)


def _resolve_teams_org(info: Info, filters: Optional[TeamFilter]) -> Organization:
    """The org whose teams are listed: the ``organizationId`` filter wins, the
    header is the deprecated fallback."""
    filter_org_id = getattr(filters, "organization_id", None) if filters else None
    org_id = filter_org_id or get_current_organization(info)
    org = Organization.objects.filter(pk=org_id).first()
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


def _active_org(info: Info) -> Organization:
    """Resolve the header org, failing closed on a missing/unknown one.

    Same denial as the read resolver (no ``DoesNotExist``: an unknown org
    header is a permission problem, not a crash).  Module-level because
    strawberry-django mutation resolvers are invoked unbound.
    """
    org = Organization.objects.filter(pk=get_current_organization(info)).first()
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


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
        org = _active_org(info)
        require_can(get_current_user(info), Team.perms.ADD, org=org)
        return cast(TeamType, team_create(name=data.name, organization=org))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        org = _active_org(info)
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
        org = _active_org(info)
        require_can(get_current_user(info), Team.perms.DELETE, org=org)
        team = team_get(pk=data.id, organization=org)
        if team is None:
            raise PermissionDenied("You do not have permission to delete this team.")
        deleted_id = team.pk
        team_delete(team=team)
        return DeletedObjectType(id=deleted_id)
