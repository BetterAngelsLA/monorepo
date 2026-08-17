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


def resolve_team_id_for_org(
    *,
    team_id: int | None,
    organization_id: int | None,
) -> int | None:
    """Validate *team_id* belongs to *organization_id*.

    Raises :class:`~django.core.exceptions.ValidationError` for unknown or
    cross-org team ids (never silently links another organization's team).
    Returns ``None`` when no team is requested.
    """
    if team_id is None:
        return None
    if organization_id is None:
        raise ValidationError(f"Team with id {team_id} cannot be set: the record has no organization.") from None
    try:
        return Team.objects.get(pk=team_id, organization_id=organization_id).pk
    except Team.DoesNotExist:
        raise ValidationError(f"Team with id {team_id} does not exist in organization {organization_id}.") from None


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
