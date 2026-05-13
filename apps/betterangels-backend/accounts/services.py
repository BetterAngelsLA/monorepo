"""
Account services — business logic for write operations.

Following the Django Styleguide (HackSoft), services are the single source
of truth for write operations.  They are framework-agnostic: no GraphQL /
Strawberry imports, no ``info`` parameter, no API-layer exceptions.

Raises ``django.core.exceptions.ValidationError`` on invalid data.
"""

import uuid

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationOwner, OrganizationUser

from .models import (
    OrganizationProfile,
    OrgType,
    User,
)


def organization_add_member(
    *,
    organization: Organization,
    email: str,
    first_name: str,
    last_name: str,
    middle_name: str | None = None,
    invited_by: User,
) -> User:
    """Add a member to an organization and send an invitation email.

    If a user with the given email already exists, they are added to the org.
    Otherwise a new inactive-password user is created first.

    Returns the (possibly newly created) user.
    """
    with transaction.atomic():
        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": str(uuid.uuid4()), "is_active": True},
        )
        if created:
            user.first_name = first_name
            user.last_name = last_name
            user.middle_name = middle_name
            user.set_unusable_password()
            user.save()

        try:
            OrganizationUser.objects.create(user=user, organization=organization)
        except Exception:
            raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")

        invitation = invitation_backend().create_organization_invite(
            organization=organization,
            invited_by_user=invited_by,
            invitee_user=user,
        )

    site = Site.objects.get(pk=settings.SITE_ID)
    invitation_backend().send_invitation(
        user=user,
        sender=invited_by,
        organization=organization,
        domain=site,
        invitation=invitation,
    )

    return user


def organization_remove_member(
    *,
    organization: Organization,
    user_id: int,
    removed_by: User,
) -> int:
    """Remove a member from an organization.

    Returns the removed user's id.
    """
    try:
        org_user = OrganizationUser.objects.get(
            organization=organization,
            user_id=user_id,
        )
    except OrganizationUser.DoesNotExist:
        raise ValidationError("User is not a member of this organization.")

    if OrganizationOwner.objects.filter(
        organization=organization,
        organization_user=org_user,
    ).exists():
        raise ValidationError("You cannot remove the organization owner. Transfer ownership first.")

    if user_id == removed_by.pk:
        raise ValidationError("You cannot remove yourself from the organization.")

    with transaction.atomic():
        org_user.delete()

    return user_id


def create_organization(*, name: str, presets: list[str]) -> Organization:
    """Create an organization with the given presets applied.

    Each preset key must exist in settings.ORG_TYPE_PRESETS. The org gets:
    - An OrganizationProfile with the corresponding OrgType(s)
    - PermissionGroupTemplates & PermissionGroups for each preset's templates

    Returns the created Organization.
    """
    from .models import PermissionGroup, PermissionGroupTemplate

    # Validate presets
    for preset_key in presets:
        if preset_key not in settings.ORG_TYPE_PRESETS:
            raise ValidationError(f"Unknown preset: {preset_key}")

    with transaction.atomic():
        organization = Organization.objects.create(name=name)
        # ensure_organization_profile signal creates the profile,
        # but we need to attach org_types
        profile = organization.profile
        for preset_key in presets:
            org_type, _ = OrgType.objects.get_or_create(
                key=preset_key,
                defaults={"label": settings.ORG_TYPE_PRESETS[preset_key]["label"]},
            )
            profile.org_types.add(org_type)

        # Create permission groups from all presets' templates
        template_names: set[str] = set()
        for preset_key in presets:
            template_names.update(settings.ORG_TYPE_PRESETS[preset_key]["templates"])

        for temp_name in template_names:
            template, _ = PermissionGroupTemplate.objects.get_or_create(name=temp_name)
            PermissionGroup.objects.get_or_create(organization=organization, template=template)

    return organization
