"""Team mutation services — per the Django Styleguide."""

from accounts.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.models import Organization

from .models import Team


def team_create(
    *,
    slug: str,
    name: str,
    organization: Organization,
    user: User,
) -> Team:
    """Create a new Team for *organization*."""
    slug = slug.strip()
    name = name.strip()

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
    slug: str | None = None,
    name: str | None = None,
    is_active: bool | None = None,
) -> Team:
    """Update a Team's slug, name and/or active status."""
    if slug is not None:
        slug = slug.strip()
        if Team.objects.filter(slug=slug, organization=team.organization).exclude(pk=team.pk).exists():
            raise ValidationError(f'A team with slug "{slug}" already exists in this organization.')
        team.slug = slug

    if name is not None:
        team.name = name.strip()

    if is_active is not None:
        team.is_active = is_active

    team.save()
    return team


@transaction.atomic
def team_delete(
    *,
    team: Team,
) -> None:
    """Hard-delete a Team. Caller must verify no FK references remain."""
    team.delete()
