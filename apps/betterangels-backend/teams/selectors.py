"""Read-only queries for teams — per the Django Styleguide."""

from typing import Optional

from django.db.models import QuerySet
from organizations.models import Organization

from .annotations import annotate_is_in_use
from .models import Team


def team_list(*, organization: Organization) -> QuerySet[Team]:
    """Return all teams for *organization*."""
    return Team.objects.filter(organization=organization)


def team_get(*, pk: int | str, organization: Organization) -> Optional[Team]:
    """Return a single team by PK, scoped to *organization*.

    ``_is_in_use`` is annotated here because a mutation payload is an instance, not a
    queryset the optimizer sees; the ``teams`` query gets it from ``TeamType`` instead.
    """
    try:
        return Team.objects.filter(pk=pk, organization=organization).annotate(_is_in_use=annotate_is_in_use()).first()
    except ValueError, TypeError:
        return None
