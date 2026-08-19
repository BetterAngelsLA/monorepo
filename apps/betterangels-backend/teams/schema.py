"""Team GraphQL Query + Mutation — thin delegation to services + selectors."""

from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from accounts.selectors import organization_get_for_member, resolve_permission_group
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated, get_current_organization
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from notes.groups import CASEWORKER
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
        """List the active organization's teams.

        The header *names* the organization; it does not grant access to it.
        Membership is checked rather than a ``teams.*`` permission because
        caseworkers must be able to list teams to pick one, and CASEWORKER
        holds no Team perms — gating on ``Team.perms.VIEW`` would break the
        team picker for exactly the people who use it.
        """
        org_id = info.context.request.organization_id

        if org_id is None:
            # App builds older than #2330 do not send the header, and have
            # queried teams since #2167 -- denying them removes the team picker
            # from every one still installed.  First-match resolution can still
            # return the wrong organization's teams to a multi-org user on such
            # a build; a follow-up PR replaces this with a denial once builds have
            # rolled over.
            permission_group = resolve_permission_group(info.context.request.user, template=CASEWORKER)
            return team_list(organization=permission_group.organization)

        org = organization_get_for_member(user=get_current_user(info), organization_id=org_id)

        if org is None:
            # Unknown org, an org the user does not belong to, and a malformed
            # header all report the same way — see the selector.
            raise PermissionDenied("You do not have access to this organization.")

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
        team = team_get(pk=data.id, organization=org)
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
                name=data.name.value if data.name else None,
                is_active=data.is_active.value if data.is_active else None,
            ),
        )

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(Team.perms.DELETE)],
    )
    def delete_team(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        org = Organization.objects.get(pk=get_current_organization(info))
        team = team_get(pk=data.id, organization=org)
        if team is None:
            raise PermissionDenied("You do not have permission to delete this team.")
        deleted_id = team.pk
        team_delete(team=team)
        return DeletedObjectType(id=deleted_id)
