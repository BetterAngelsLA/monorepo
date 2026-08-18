"""Team mutation services — per the Django Styleguide."""

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.text import slugify
from organizations.models import Organization

from .models import Team


def _unique_slug_for_org(*, name: str, organization: Organization) -> str:
    """Derive a slug for *name* that is free within *organization*.

    Slugs are immutable once assigned, so a team renamed away from a name can
    still be holding that name's slug.  Suffix rather than reject: the slug is
    an internal identifier and must never block a name the user can see is
    available.
    """
    # slug is shorter than name (100 vs 255), so a long-but-legal name can
    # derive an over-long slug.  Truncate rather than reject: the slug is
    # internal, and a name the column accepts must not be refused because of
    # an identifier the user never sees.
    limit: int = Team._meta.get_field("slug").max_length or 100

    base = slugify(name)[:limit]
    slug = base
    suffix = 2

    while Team.objects.filter(slug=slug, organization=organization).exists():
        tail = f"-{suffix}"
        slug = f"{base[: limit - len(tail)]}{tail}"
        suffix += 1

    return slug


def _validate_name_available(*, name: str, organization: Organization, exclude_pk: int | None = None) -> None:
    """Raise unless *name* is free within *organization* (case-insensitive)."""
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
    """Create a new Team for *organization*.

    The slug is derived from *name* once, at creation, and never changes after
    that — notes, tasks, and report fixtures identify teams by it.
    """
    name = name.strip()

    if not slugify(name):
        raise ValidationError("Team name must contain at least one alphanumeric character.")

    _validate_name_available(name=name, organization=organization)

    team = Team(
        slug=_unique_slug_for_org(name=name, organization=organization),
        name=name,
        organization=organization,
    )
    # full_clean() before save(), per the styleguide.  Not ceremony: nothing
    # else bounds the field lengths, so a 300-character name reached Postgres
    # and came back as DataError -- a 500 rather than a message the caller can
    # act on.
    team.full_clean()
    team.save()

    return team


@transaction.atomic
def team_update(
    *,
    team: Team,
    name: str | None = None,
) -> Team:
    """Update a Team's name.

    The slug is deliberately left alone: it is the stable identifier for the
    team (report fixtures and the legacy-team backfill key off it), so a
    rename must not move it out from under existing references.
    """
    if name is not None:
        name = name.strip()

        if not slugify(name):
            raise ValidationError("Team name must contain at least one alphanumeric character.")

        _validate_name_available(name=name, organization=team.organization, exclude_pk=team.pk)

        team.name = name

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
