"""
Organization services.

Higher-level operations that span models, the org-type registry, and
permission groups.  Defined here (not in :mod:`accounts.utils`) so the
registry can be used at runtime without creating circular imports.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from accounts.org_type_registry import OrgTypeRegistry
from common.permissions.config import TemplateConfig
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.db import transaction
from django.db.models import QuerySet

if TYPE_CHECKING:
    from accounts.models import PermissionGroup, PermissionGroupTemplate
    from organizations.models import Organization


# ---------------------------------------------------------------------------
# Organization creation
# ---------------------------------------------------------------------------


@transaction.atomic
def create_organization_with_presets(
    *,
    name: str,
    preset_names: list[str],
) -> "Organization":
    """Create an :class:`~organizations.models.Organization`, its profile, and
    all permission groups defined by the given *preset_names*.

    Raises :class:`~accounts.org_type_registry.OrgTypeNotFoundError` if any
    *preset_name* is not registered.
    """
    from accounts.models import (
        OrganizationProfile,
        OrgTypeChoices,
        PermissionGroup,
        PermissionGroupTemplate,
    )
    from organizations.models import Organization

    registry = OrgTypeRegistry.get()

    org = Organization.objects.create(name=name)

    org_types: list[OrgTypeChoices] = []
    for preset_name in preset_names:
        preset = registry.lookup(preset_name)
        org_types.append(OrgTypeChoices(preset_name))
        _create_permission_groups_from_templates(
            org=org,
            templates=preset.permission_templates,
            PermissionGroupTemplate=PermissionGroupTemplate,
            PermissionGroup=PermissionGroup,
        )

    OrganizationProfile.objects.create(organization=org, org_types=org_types)

    return org


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _create_permission_groups_from_templates(
    *,
    org: "Organization",
    templates: tuple[TemplateConfig, ...],
    PermissionGroupTemplate: type["PermissionGroupTemplate"],
    PermissionGroup: type["PermissionGroup"],
) -> None:
    """Given a sequence of :class:`TemplateConfig` objects, ensure each has a
    corresponding :class:`PermissionGroupTemplate` row and a
    :class:`PermissionGroup` row for *org*.

    ``PermissionGroup.save()`` creates the underlying Django ``Group`` and
    assigns permissions automatically, so callers only need to iterate
    templates.
    """
    for template_config in templates:
        pgt, _ = PermissionGroupTemplate.objects.get_or_create(
            name=template_config.name,
        )
        PermissionGroup.objects.create(organization=org, template=pgt)


# ---------------------------------------------------------------------------
# Permission group resolution
# ---------------------------------------------------------------------------


def get_permission_groups_for_org(org: "Organization") -> QuerySet["PermissionGroup"]:
    """Return all :class:`~accounts.models.PermissionGroup` rows belonging to
    *org*."""
    from accounts.models import PermissionGroup

    return PermissionGroup.objects.filter(organization=org)


def get_member_permission_group(org: "Organization") -> "PermissionGroup":
    """Return the default member-level ``PermissionGroup`` for *org*.

    The member group is defined by the *first* template in the *first*
    registered preset for the org's primary type.  This is the group that
    non-admin/non-superuser members are placed in by default.
    """
    from accounts.models import PermissionGroup

    profile = org.profile
    org_types = profile.org_types

    if not org_types:
        raise ValueError(f"Organization '{org.name}' has no org_types set on its profile.")

    registry = OrgTypeRegistry.get()
    primary_preset = registry.lookup(org_types[0].value)
    first_template = primary_preset.permission_templates[0]

    return PermissionGroup.objects.get(
        organization=org,
        template__name=first_template.name,
    )


def get_user_permission_group_for_org(
    user: "AbstractBaseUser | AnonymousUser",
    org_id: str,
) -> "PermissionGroup":
    """Return the highest-priority ``PermissionGroup`` the *user* belongs to in
    *org_id*.  Raises :exc:`PermissionError` when the user has no group in
    that organization.
    """
    from accounts.models import PermissionGroup

    # Prefer non-member groups first; if none, fall back to member group.
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group", "template")
        .filter(
            organization_id=org_id,
            group__user=user,
        )
        .order_by("-group__permissions")  # crude priority by permission count
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group
