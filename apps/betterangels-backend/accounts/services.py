"""
Organization services — higher-level operations per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#services
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.db import transaction
from organizations.models import Organization, OrganizationUser

from .models import OrgTypeChoices, PermissionGroup, PermissionGroupTemplate
from .models import User as UserModel

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
) -> User:
    """Add a new member to an organization.

    Returns the :class:`~accounts.models.User` that was created or
    retrieved.  Raises :class:`~django.core.exceptions.ValidationError`
    if the user is already a member of *organization*.
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

    try:
        OrganizationUser.objects.create(user=user, organization=organization)
    except Exception:
        raise ValidationError(f"{first_name} {last_name} is already a member of {organization.name}.")

    return user


# ── Organization creation ─────────────────────────────────────────────


@transaction.atomic
def create_organization_with_presets(
    name: str,
    preset_names: list[str],
) -> Organization:
    """Create an organization preloaded with permission groups.

    ``preset_names`` are org-type names from
    :data:`~accounts.template_registry.REGISTRY` (e.g. ``["shelter"]``,
    ``["outreach", "shelter"]``).

    Returns the new :class:`~organizations.models.Organization`.

    Raises :class:`~django.core.exceptions.ValidationError` if any
    ``preset_name`` is not found in the registry.
    """
    from accounts.models import OrganizationProfile  # noqa: F811  (lazy to avoid circular)
    from accounts.template_registry import REGISTRY

    # Validate preset names.
    valid_names = {oc.name for oc in (REGISTRY.outreach, REGISTRY.shelter)}
    for pn in preset_names:
        if pn not in valid_names:
            raise ValidationError(f"Unknown org-type preset: {pn}")

    org = Organization.objects.create(name=name)

    # Collect unique templates from all requested presets (deduplicate by name).
    pgt_by_name: dict[str, PermissionGroupTemplate] = {}
    org_types: list[str] = []

    for pn in preset_names:
        oc = REGISTRY.org_type(pn)
        assert oc is not None  # already validated above
        org_types.append(oc.name)
        for tc in oc.templates:
            if tc.name not in pgt_by_name:
                pgt, _created = PermissionGroupTemplate.objects.get_or_create(name=tc.name)
                pgt_by_name[tc.name] = pgt

    # Create PermissionGroup per template for this org.
    for pgt in pgt_by_name.values():
        PermissionGroup.objects.get_or_create(organization=org, template=pgt)

    # Profile with org types.
    OrganizationProfile.objects.create(
        organization=org,
        org_types=[OrgTypeChoices(t) for t in org_types],
    )

    return org


# ── Permission resolution ─────────────────────────────────────────────


def get_member_permission_group(org: Organization) -> PermissionGroup:
    """Return the default member-level ``PermissionGroup`` for *org*.

    The member-level group is the **first** template of the **first**
    org type declared on the organization's profile.

    Raises :class:`~django.core.exceptions.ValidationError` if the
    organization has no ``org_types``, the type is not in the registry,
    or no ``PermissionGroup`` exists yet.
    """
    from accounts.template_registry import REGISTRY

    if not hasattr(org, "profile") or not org.profile.org_types:
        raise ValidationError(f"Organization '{org.name}' has no org_types.")

    primary_type = org.profile.org_types[0].value  # e.g. "shelter"
    oc = REGISTRY.org_type(primary_type)
    if oc is None:
        raise ValidationError(f"Unknown org type '{primary_type}' for organization '{org.name}'.")

    member_template = oc.templates[0]
    try:
        return PermissionGroup.objects.get(organization=org, template__name=member_template.name)
    except PermissionGroup.DoesNotExist:
        raise ValidationError(
            f"Member permission group '{member_template.name}' not found "
            f"for org '{org.name}'. Has create_organization_with_presets been called?"
        )


def get_user_permission_group_for_org(user: User, org_id: str) -> PermissionGroup:
    """Return the member-level ``PermissionGroup`` for *user* within *org_id*.

    Wraps :func:`get_member_permission_group` and validates that *user*
    belongs to the organization.
    """
    try:
        org = Organization.objects.get(pk=org_id)
    except Organization.DoesNotExist:
        raise ValidationError(f"Organization with id '{org_id}' not found.")

    if not org.users.filter(pk=user.pk).exists():
        raise ValidationError(f"User '{user}' is not a member of organization '{org.name}'.")

    return get_member_permission_group(org)
