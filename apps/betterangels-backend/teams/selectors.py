"""Read-only queries for teams — per the Django Styleguide."""

from typing import Optional

from common.utils import get_or_none
from django.db.models import QuerySet
from organizations.models import Organization

from .models import Team


def team_list(*, organization: Organization) -> QuerySet[Team]:
    """Return all teams for *organization*."""
    return Team.objects.filter(organization=organization)


def team_get(*, pk: int | str, organization: Organization) -> Optional[Team]:
    """Return a single team by PK, scoped to *organization*."""
    return get_or_none(Team.objects.filter(organization=organization), pk)
