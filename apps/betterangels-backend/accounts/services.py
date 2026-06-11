"""
Organization services — higher-level operations per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#services
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from common.org_types import REGISTRY
from common.permissions.config import TemplateConfig
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from organizations.models import Organization

from .models import OrganizationProfile, OrgTypeChoices, PermissionGroup, PermissionGroupTemplate
from .models import User as UserModel
from .role_manager import OrgRoleManager

if TYPE_CHECKING:
    from .models import User


# ── Member management ────────────────────────────────────────────────


@transaction.atomic
def member_add(
    *,
    email: str,
    first_name: str,
    last_name: str,
    middle_name: str | None,
    organization: Organization,
    permission_templates: tuple[TemplateConfig, ...],
) -> User:
    """Create or retrieve a user, link to an organization, and assign permissions.

    Returns the :class:`~accounts.models.User`.

    Raises :class:`~django.core.exceptions.ValidationError` if the user
    is already a member of *organization*.
    """
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

    # Reject re-invites to avoid IntegrityError from django-organizations
    # unique_together constraint on (user, organization).
    if organization.users.filter(pk=user.pk).exists():
        raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")

    # Link user to organization via the django-organizations helper
    # so that the framework's owner auto-assignment fires.
    try:
        organization.add_user(user)
    except IntegrityError:
        raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")

    # Delegate permission assignment to the manager.
    OrgRoleManager(organization).add_roles(user, *permission_templates)

    return user


# ── Organization creation ─────────────────────────────────────────────


@transaction.atomic
def create_organization_with_presets(
    name: str,
    preset_names: list[str],
    owner: UserModel,
    owner_roles: tuple[TemplateConfig, ...] = (),
) -> Organization:
    """Create an organization preloaded with permission groups and an owner.

    ``preset_names`` are org-type names from
    :data:`common.org_types.REGISTRY` (e.g. ``["shelter"]``,
    ``["outreach", "shelter"]``).

    *owner* is linked via ``organization.add_user`` (which auto-creates
    an ``OrganizationOwner``).  If *owner_roles* is provided, those roles
    are assigned to the owner explicitly via
    :class:`~accounts.role_manager.OrgRoleManager`.  The caller decides which
    roles the owner gets — no implicit derivation from org type order.

    Returns the new :class:`~organizations.models.Organization`.
    """
    for preset_name in preset_names:
        if REGISTRY.org_type(preset_name) is None:
            raise ValidationError(f"Unknown org-type preset: {preset_name}")

    org = Organization.objects.create(name=name)

    # Collect unique templates from all requested presets (deduplicate by name).
    templates_by_name: dict[str, PermissionGroupTemplate] = {}
    org_types: list[str] = []

    for preset_name in preset_names:
        org_config = REGISTRY.org_type(preset_name)
        assert org_config is not None
        org_types.append(org_config.name)
        for template_config in org_config.templates:
            if template_config.name not in templates_by_name:
                permission_group_template, _created = PermissionGroupTemplate.objects.get_or_create(
                    name=template_config.name
                )
                templates_by_name[template_config.name] = permission_group_template

    # Create PermissionGroup per template for this org.
    for permission_group_template in templates_by_name.values():
        PermissionGroup.objects.get_or_create(organization=org, template=permission_group_template)

    # Profile with org types.
    OrganizationProfile.objects.create(
        organization=org,
        org_types=[OrgTypeChoices(org_type) for org_type in org_types],
    )

    # Link the owner (django-organizations auto-creates OrganizationOwner).
    org.add_user(owner)

    if owner_roles:
        OrgRoleManager(org).add_roles(owner, *owner_roles)

    return org
