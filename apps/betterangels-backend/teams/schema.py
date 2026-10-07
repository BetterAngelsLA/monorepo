"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User as AccountUser
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import (
    PERMISSION_DENIED_MESSAGE,
    IsAuthenticated,
    get_current_organization,
    require_can,
)
from common.utils import get_or_none
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
        """List an organization's teams — grant-only at the payload org.

        The org comes from the ``organizationId`` filter when provided; the
        ``X-Organization-ID`` header remains a deprecated fallback while the
        mobile team pickers migrate (see ``_resolve_read_org`` for which send
        only it, and the ADR §5.3 note for the strip checklist).
        """
        user = cast(AccountUser, get_current_user(info))
        org = _resolve_read_org(info, filters)
        require_can(user, Team.perms.VIEW, org=org)
        return team_list(organization=org)


def _org_or_deny(org_id: object) -> Organization:
    """Resolve an org id, failing closed on a missing/unknown/malformed one.

    *org_id* is client input (payload field, filter, or header), so it is
    validated the way selectors validate pks: an id the column cannot hold
    (``""``, a UUID string) denies like an unknown one instead of reaching the
    DB as an unhandled ``ValueError``.  ``get_or_none`` is the house guard
    (``common.utils``) for exactly that.  Module-level because strawberry-django
    mutation resolvers are invoked unbound.
    """
    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


def _resolve_read_org(info: Info, filters: Optional[TeamFilter]) -> Organization:
    """The org whose teams are listed: the ``organizationId`` filter when the
    client sends one, otherwise the deprecated ``X-Organization-ID`` header
    (mobile's ``useOrgTeams`` callers still send only ``{ isActive }``; they
    must pass ``organizationId`` before the header is stripped).

    An absent filter field arrives as ``None`` — or ``strawberry.UNSET`` when a
    filter of another kind is given — and keeps the header fallback; an
    explicitly empty id is NOT treated as absent — it denies, so a blank value
    can never silently fall back to the header.
    """
    filter_org_id = getattr(filters, "organization_id", None) if filters else None
    if filter_org_id in (None, strawberry.UNSET):
        return _org_or_deny(get_current_organization(info))
    return _org_or_deny(filter_org_id)


@strawberry.type
class Mutation:
    """Team mutations — grant-only authority (ADR 0001 §5.3).

    Each authorizes via :func:`common.permissions.utils.require_can` at the org
    resolved from the payload: ``createTeam`` carries ``organizationId`` (no
    row exists to scope by yet); update/delete use the team row's org.  The
    ``X-Organization-ID`` header and legacy ``PermissionGroup`` arm are not
    consulted.
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
