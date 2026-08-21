"""Strawberry GraphQL types for the Team model."""

from typing import Optional

import strawberry_django
from strawberry import ID, Maybe, auto

from .models import Team


@strawberry_django.filter_type(Team)
class TeamFilter:
    is_active: auto


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
