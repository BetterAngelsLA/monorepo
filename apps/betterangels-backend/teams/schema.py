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
        org = _resolve_read_org(info, filters)
        require_can(user, Team.perms.VIEW, org=org)
        return team_list(organization=org)


def _org_or_deny(org_id: object) -> Organization:
    """Resolve an org id, failing closed on a missing/unknown one.

    A missing/unknown org is a permission problem (``PermissionDenied``), not a
    ``DoesNotExist`` crash.  Module-level because strawberry-django mutation
    resolvers are invoked unbound.
    """
    org = Organization.objects.filter(pk=org_id).first()
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


def _resolve_read_org(info: Info, filters: Optional[TeamFilter]) -> Organization:
    """The org whose teams are listed: the ``organizationId`` filter wins; the
    ``X-Organization-ID`` header is the deprecated fallback while clients
    migrate to the filter (and will be stripped once none send it)."""
    filter_org_id = getattr(filters, "organization_id", None) if filters else None
    return _org_or_deny(filter_org_id or get_current_organization(info))


@strawberry.type
class Mutation:
    """Team mutations — grant-only authority (ADR 0001 §5.3, teams cutover).

    The three mutations authorize via :func:`common.permissions.utils.require_can`
    — the grant predicate (``can()``) — at the target organization, which no
    longer comes from the ``X-Organization-ID`` header: ``createTeam`` carries
    it in the payload (``CreateTeamInput.organizationId`` — no row exists to
    scope by yet), and update/delete derive it from the team row the payload
    names by id.  ``ORG_ADMIN`` / ``ORG_SUPERUSER`` are role-backed with
    backfilled Grants; the legacy ``PermissionGroup`` arm is not consulted.
    """

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_team(self, info: Info, data: CreateTeamInput) -> TeamType:
        org = _org_or_deny(data.organization_id)
        require_can(get_current_user(info), Team.perms.ADD, org=org)
        return cast(TeamType, team_create(name=data.name, organization=org))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_team(self, info: Info, data: UpdateTeamInput) -> TeamType:
        team = team_get(pk=data.id)
        if team is None:
            raise PermissionDenied("You do not have permission to update this team.")
        # The row names its org — authorize there, no header needed.
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
            raise PermissionDenied("You do not have permission to delete this team.")
        # The row names its org — authorize there, no header needed.
        require_can(get_current_user(info), Team.perms.DELETE, org=team.organization_id)
        deleted_id = team.pk
        team_delete(team=team)
        return DeletedObjectType(id=deleted_id)
