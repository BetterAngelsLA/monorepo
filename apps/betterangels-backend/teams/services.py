"""Team mutation services — per the Django Styleguide."""

from typing import Any

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
    data: dict[str, Any],
) -> Team:
    """Update a Team's name and/or active flag. Slug is auto-generated from name."""
    if data["name"] is not None:
        name = data["name"].strip()
        if not name:
            raise ValidationError("Team name must contain at least one alphanumeric character.")

        slug = slugify(name)
        if Team.objects.filter(slug=slug, organization=team.organization).exclude(pk=team.pk).exists():
            raise ValidationError(f'A team with slug "{slug}" already exists in this organization.')

        team.name = name
        team.slug = slug

    if data["is_active"] is not None:
        team.is_active = data["is_active"]

    team.save()
    return team


@transaction.atomic
def team_delete(
    *,
    team: Team,
) -> None:
    """Hard-delete a Team. FK references are SET_NULL by the database."""
    team.delete()
