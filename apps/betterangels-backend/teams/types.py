"""Strawberry GraphQL types for the Team model."""

from typing import Optional

import strawberry_django
from django.db.models import Q
from strawberry import ID, Info, Maybe, auto

from .models import Team


@strawberry_django.filter_type(Team)
class TeamFilter:
    is_active: auto

    @strawberry_django.filter_field
    def organization_id(self, info: Info, value: Optional[ID], prefix: str) -> Q:
        """Narrow to one organization — the org whose teams are listed.

        The resolver treats a provided ``organizationId`` as the authoritative
        org (authorized via ``can(teams.view_team)`` at that org), with the
        ``X-Organization-ID`` header as a backward-compatible fallback while
        clients migrate to the filter.  The DB-level confine here is defense in
        depth for whichever org the resolver authorizes.
        """
        if not value:
            return Q()
        return Q(**{f"{prefix}organization_id": value})


@strawberry_django.type(Team, filters=TeamFilter, pagination=True)
class TeamType:
    id: ID
    name: auto
    is_active: Optional[bool]
    created_at: auto

    @strawberry_django.field(deprecation_reason="Always null. Team.name is the only identifier.")
    def slug(self) -> Optional[str]:
        # Kept so documents shipped in native app builds still validate; every
        # ``currentTeam`` selection in those builds is ``{ id slug name }``.
        # Removed together with ``currentTeam`` -- see #2342.
        return None


@strawberry_django.input(Team, partial=True)
class CreateTeamInput:
    name: str


@strawberry_django.input(Team, partial=True)
class UpdateTeamInput:
    id: ID
    name: Maybe[str]
    is_active: Maybe[bool]
