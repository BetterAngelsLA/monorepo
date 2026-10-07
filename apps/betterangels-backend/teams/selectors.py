"""Read-only queries for teams — per the Django Styleguide."""

from typing import Optional

from common.utils import get_or_none
from django.db.models import QuerySet
from organizations.models import Organization

from .models import Team


def team_list(*, organization: Organization) -> QuerySet[Team]:
    """Return all teams for *organization*."""
    return Team.objects.filter(organization=organization)


def team_get(*, pk: int | str, organization: Optional[Organization] = None) -> Optional[Team]:
    """Return a single team by PK.

    When *organization* is given the lookup is confined to that org (a team in
    another org reads as absent); update/delete resolve the row by PK alone and
    authorize at ``team.organization`` instead, so no header/org is needed.
    """
    qs = Team.objects.all() if organization is None else Team.objects.filter(organization=organization)
    return get_or_none(qs, pk)
