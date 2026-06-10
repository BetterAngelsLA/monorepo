"""
Organization services — higher-level operations per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#services
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from django.db import transaction

if TYPE_CHECKING:
    from organizations.models import Organization

    from .models import User


@transaction.atomic
def member_add(
    *,
    email: str,
    first_name: str,
    last_name: str,
    middle_name: str | None,
    organization: Organization,
) -> User:
    """Add a new member to an organization.

    Returns the :class:`~accounts.models.User` that was created or
    retrieved.  Raises :class:`~django.core.exceptions.ValidationError`
    if the user is already a member of *organization*.
    """
    from django.core.exceptions import ValidationError
    from organizations.models import OrganizationUser

    from .models import User as UserModel

    user, created = UserModel.objects.get_or_create(
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

    return user
