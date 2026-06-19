"""Read-only queries for teams — per the Django Styleguide."""

from typing import Optional

from django.db.models import QuerySet
from organizations.models import Organization

from .models import Team


def team_list(*, organization: Organization, active_only: bool = True) -> QuerySet[Team]:
    """Return all teams for *organization*, optionally filtering to active only."""
    qs = Team.objects.filter(organization=organization)
    if active_only:
        qs = qs.filter(is_active=True)
    return qs.order_by("slug")


def team_get(*, pk: int, organization: Organization) -> Optional[Team]:
    """Return a single team by PK, scoped to *organization*."""
    try:
        return Team.objects.get(pk=pk, organization=organization)
    except Team.DoesNotExist:
        return None
