"""Read-only queries for teams — per the Django Styleguide."""

from typing import Optional

from django.db.models import QuerySet
from organizations.models import Organization

from .models import Team


def team_list(*, organization: Organization) -> QuerySet[Team]:
    """Return all teams for *organization*, in ``Team.Meta.ordering``."""
    return Team.objects.filter(organization=organization)


def team_get(*, pk: int | str, organization: Organization) -> Optional[Team]:
    """Return a single team by PK, scoped to *organization*."""
    try:
        return Team.objects.filter(pk=pk, organization=organization).first()
    except ValueError, TypeError:
        return None
