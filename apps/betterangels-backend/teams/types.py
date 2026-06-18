"""Strawberry GraphQL types for the Team model."""

import strawberry
import strawberry_django
from strawberry import ID, auto

from .models import Team


@strawberry_django.type(Team)
class TeamType:
    id: ID
    slug: auto
    name: auto
    is_active: auto


@strawberry_django.input(Team, partial=True)
class CreateTeamInput:
    slug: str
    name: str


@strawberry_django.input(Team, partial=True)
class UpdateTeamInput:
    id: ID
    slug: str | None = strawberry.UNSET
    name: str | None = strawberry.UNSET
    is_active: bool | None = strawberry.UNSET
