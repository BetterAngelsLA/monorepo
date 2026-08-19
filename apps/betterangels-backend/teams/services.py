"""Team mutation services — per the Django Styleguide."""

from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.models import Organization

from .models import Team


def _validate_name_is_unique(*, name: str, organization: Organization, exclude_pk: int | None = None) -> None:
    """Raise if *name* is already taken within *organization*.

    This duplicates a check ``full_clean()`` already performs: it validates
    ``unique_team_name_per_org`` and rejects the duplicate on its own.  What it
    cannot do is name the team -- it reports only that the constraint was
    violated -- so this exists for the message, not for the guarantee.  The
    constraint is the guarantee; the query below is check-then-insert and two
    concurrent creates can both pass it.
    """
    qs = Team.objects.filter(name__iexact=name, organization=organization)

    if exclude_pk is not None:
        qs = qs.exclude(pk=exclude_pk)

    if qs.exists():
        raise ValidationError(f'A team named "{name}" already exists in this organization.')


def team_create(
    *,
    name: str,
    organization: Organization,
) -> Team:
    """Create a new Team for *organization*."""
    name = name.strip()
    _validate_name_is_unique(name=name, organization=organization)

    team = Team(name=name, organization=organization)
    team.full_clean()
    team.save()

    return team


@transaction.atomic
def team_update(
    *,
    team: Team,
    name: str | None = None,
    is_active: bool | None = None,
) -> Team:
    """Update a Team's name and/or active flag."""
    if name is not None:
        name = name.strip()
        _validate_name_is_unique(name=name, organization=team.organization, exclude_pk=team.pk)
        team.name = name

    if is_active is not None:
        team.is_active = is_active

    team.full_clean()
    team.save()
    return team


@transaction.atomic
def team_delete(
    *,
    team: Team,
) -> None:
    """Hard-delete a Team. FK references are SET_NULL by the database."""
    team.delete()
