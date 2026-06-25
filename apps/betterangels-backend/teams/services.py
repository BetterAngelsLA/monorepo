"""Team mutation services — per the Django Styleguide."""

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.text import slugify
from organizations.models import Organization

from .models import Team


def team_create(
    *,
    name: str,
    organization: Organization,
) -> Team:
    """Create a new Team for *organization*. Slug is auto-generated from name."""
    name = name.strip()
    slug = slugify(name)

    if not slug:
        raise ValidationError("Team name must contain at least one alphanumeric character.")

    if Team.objects.filter(slug=slug, organization=organization).exists():
        raise ValidationError(f'A team with slug "{slug}" already exists in this organization.')

    return Team.objects.create(
        slug=slug,
        name=name,
        organization=organization,
    )


@transaction.atomic
def team_update(
    *,
    team: Team,
    name: str | None = None,
) -> Team:
    """Update a Team's name. Slug is auto-generated from name."""
    if name is not None:
        name = name.strip()
        slug = slugify(name)
        if not slug:
            raise ValidationError("Team name must contain at least one alphanumeric character.")
        if Team.objects.filter(slug=slug, organization=team.organization).exclude(pk=team.pk).exists():
            raise ValidationError(f'A team with slug "{slug}" already exists in this organization.')
        team.name = name
        team.slug = slug

    team.save()
    return team


@transaction.atomic
def team_delete(
    *,
    team: Team,
) -> None:
    """Hard-delete a Team. FK references are SET_NULL by the database."""
    team.delete()
