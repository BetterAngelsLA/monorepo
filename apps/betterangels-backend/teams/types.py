"""Strawberry GraphQL types for the Team model."""

from typing import Optional

import strawberry_django
from strawberry import ID, Maybe, auto

from .models import Team


@strawberry_django.filter_type(Team, lookups=True)
class TeamFilter:
    is_active: auto


@strawberry_django.type(Team, filters=TeamFilter)
class TeamType:
    id: ID
    slug: Optional[str]
    name: auto
    is_active: Optional[bool]
    created_at: auto


@strawberry_django.input(Team, partial=True)
class CreateTeamInput:
    name: str


@strawberry_django.input(Team, partial=True)
class UpdateTeamInput:
    id: ID
    name: Maybe[str]
    is_active: Maybe[bool]
