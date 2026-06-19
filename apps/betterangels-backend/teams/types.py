"""Strawberry GraphQL types for the Team model."""

import strawberry_django
from strawberry import ID, Maybe, auto

from .models import Team


@strawberry_django.type(Team)
class TeamType:
    id: ID
    slug: auto
    name: auto
    is_active: auto


@strawberry_django.input(Team, partial=True)
class CreateTeamInput:
    name: str


@strawberry_django.input(Team, partial=True)
class UpdateTeamInput:
    id: ID
    name: Maybe[str]
    is_active: Maybe[bool]
