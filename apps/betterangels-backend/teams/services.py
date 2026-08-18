"""Team mutation services — per the Django Styleguide."""

from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.models import Organization

from .models import Team


def _validate_name(*, name: str, organization: Organization, exclude_pk: int | None = None) -> None:
    """Raise unless *name* has real content and is free within *organization*.

    Uniqueness is enforced case-insensitively by ``unique_team_name_per_org``,
    which ``full_clean()`` does validate -- but it reports only that the
    constraint was violated, naming the constraint rather than the team.
    Checking here first is what produces a message the caller can act on.

    The alphanumeric requirement predates the removal of ``Team.slug``, where it
    fell out of ``slugify("---")`` being empty. It is kept deliberately: a team
    called "---" is indistinguishable from a blank one to anyone reading a list,
    and name is now the only identifier there is.
    """
    if not any(character.isalnum() for character in name):
        raise ValidationError("Team name must contain at least one alphanumeric character.")

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
    _validate_name(name=name, organization=organization)

    team = Team(name=name, organization=organization)
    # full_clean() before save(), per the styleguide.  Not ceremony: nothing
    # else bounds the name, so an over-long one reached Postgres and came back
    # as DataError -- a 500 rather than a message the caller can act on.
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
        _validate_name(name=name, organization=team.organization, exclude_pk=team.pk)
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
