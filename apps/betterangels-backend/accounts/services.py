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
