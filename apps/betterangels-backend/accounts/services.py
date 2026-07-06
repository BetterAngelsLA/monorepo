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
from django.db.models import Q
from organizations.models import Organization, OrganizationOwner, OrganizationUser

from .groups import ORG_ADMIN
from .models import (
    OrganizationProfile,
    OrgTypeChoices,
    PermissionGroup,
    PermissionGroupTemplate,
)
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

    When *user* is already a member of *organization*, only
    *permission_templates* the user does **not** already hold are
    assigned.  This allows the same user to be added through different
    portals (e.g. outreach and shelter operator) without raising an error.
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

    is_existing_member = organization.users.filter(pk=user.pk).exists()

    if not is_existing_member:
        # Fast path: new user — avoid the PermissionGroup query below.
        try:
            organization.add_user(user)
        except IntegrityError:
            raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")
        OrgRoleManager(organization).add_roles(user, *permission_templates)
        return user

    # Existing member: only assign templates they do not already hold.
    existing_template_names: set[str] = set(
        PermissionGroup.objects.filter(
            organization=organization,
            group__user=user,
            template__name__in=[t.name for t in permission_templates],
        ).values_list("template__name", flat=True)
    )

    new_templates = tuple(t for t in permission_templates if t.name not in existing_template_names)

    if new_templates:
        OrgRoleManager(organization).add_roles(user, *new_templates)

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

    org, _ = Organization.objects.get_or_create(name=name)

    # Collect unique templates from all requested presets (deduplicate by name).
    org_types: list[str] = []

    for preset_name in preset_names:
        org_config = REGISTRY.org_type(preset_name)
        assert org_config is not None
        org_types.append(org_config.name)

    # Profile with org types — update_or_create to fill in on existing orgs too.
    OrganizationProfile.objects.update_or_create(
        organization=org,
        defaults={"org_types": [OrgTypeChoices(org_type) for org_type in org_types]},
    )

    # Create PermissionGroup per template for this org.
    reconcile_org_groups(org)

    # Link the owner (django-organizations auto-creates OrganizationOwner).
    org.add_user(owner)

    if owner_roles:
        OrgRoleManager(org).add_roles(owner, *owner_roles)

    return org


# ── Group reconciliation ──────────────────────────────────────────────


def reconcile_org_groups(org: Organization) -> None:
    """Create missing and delete stale ``PermissionGroup`` records for *org*.

    Expected templates are derived from the org's ``profile.org_types``
    via :data:`common.org_types.REGISTRY`.  Groups whose template is no
    longer in the org's presets are deleted.

    Safe to call repeatedly — all operations are idempotent.
    """
    from .models import PermissionGroup

    # Expected template names from current org-type presets.
    expected: set[str] = set()
    org_type_values = org.profile.org_types if hasattr(org, "profile") else []
    for org_type_value in org_type_values:
        org_config = REGISTRY.org_type(org_type_value.value)
        if org_config is None:
            continue
        for template_config in org_config.templates:
            expected.add(template_config.name)

    if not expected:
        return

    # Create missing.
    for template_name in expected:
        permission_group_template, _ = PermissionGroupTemplate.objects.get_or_create(
            name=template_name,
        )
        PermissionGroup.objects.get_or_create(
            organization=org,
            template=permission_group_template,
        )

    # Delete stale (including groups whose template was set to NULL).
    PermissionGroup.objects.filter(organization=org).filter(
        Q(template__isnull=True) | ~Q(template__name__in=expected),
    ).delete()


# ── Member removal ───────────────────────────────────────────────────


@transaction.atomic
def organization_remove_member(
    *,
    organization: Organization,
    user_id: int,
    removed_by: UserModel,
) -> int:
    """Remove a user from an organization.

    Clears all org-scoped roles before deleting the membership.
    Returns the removed user's id.

    Raises :class:`~django.core.exceptions.ValidationError` if the user is
    not a member, is the organization owner, or is *removed_by*.
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

    OrgRoleManager(organization).clear_roles(org_user.user)
    org_user.delete()

    return user_id


# ── Organization-level permission group management ────────────────────


def create_default_org_permission_groups(organization: Organization) -> None:
    """Create ``PermissionGroup`` rows for every template in *organization*.

    Uses :meth:`Registry.templates_for` so the result is org-type-aware —
    an outreach org gets Caseworker, Org Admin, Org Superuser; a shelter org
    gets Shelter Operator, Org Admin, Org Superuser.
    """
    for template_config in REGISTRY.templates_for(organization):
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=template_config.name)
        PermissionGroup.objects.get_or_create(organization=organization, template=template)


# ── Self-signup ───────────────────────────────────────────────────────


@transaction.atomic
def create_organization_service(
    *,
    user: UserModel,
    organization_name: str,
    org_type_name: str,
) -> tuple[UserModel, Organization]:
    """Create an organization and link *user* as the owner.

    *org_type_name* must match a registered :class:`OrgTypeConfig` with
    ``allow_public_signup=True`` (e.g. ``"shelter"``).

    Returns ``(user, organization)``.

    Does **not** send a welcome email — callers (mutations) are
    responsible for triggering email delivery after the transaction
    commits successfully.
    """
    org_config = REGISTRY.org_type(org_type_name)
    if not org_config or not org_config.allow_public_signup:
        raise ValidationError(f"Org type '{org_type_name}' does not support self-signup.")

    organization = create_organization_with_presets(
        name=organization_name,
        preset_names=[org_type_name],
        owner=user,
        owner_roles=(org_config.member_template, ORG_ADMIN),
    )

    return user, organization
