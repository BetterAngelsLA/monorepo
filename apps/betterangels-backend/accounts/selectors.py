"""Read-only queries for organization permissions — per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#selectors
"""

import logging
from typing import Optional, Union

from common.org_types import REGISTRY
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from organizations.models import Organization

from .models import PermissionGroup, User

logger = logging.getLogger(__name__)


# ── Single-entity lookups ─────────────────────────────────────────────


def permission_group_for_user(user: User, org_id: str, template_name: str) -> PermissionGroup:
    """Return the ``PermissionGroup`` matching *template_name* for *user* in org *org_id*.

    Validates that the organization exists, the user is a member, and a
    ``PermissionGroup`` with the given template name is present.

    Raises :class:`~django.core.exceptions.ValidationError` on any of
    these conditions.
    """
    # Single query to find the PermissionGroup with org + user membership + template
    # all validated at once. Falls back to disambiguation queries only on failure.
    try:
        return PermissionGroup.objects.select_related("organization").get(
            organization_id=org_id,
            organization__users=user,
            template__name=template_name,
        )
    except PermissionGroup.DoesNotExist:
        # Disambiguate which condition failed.
        if not Organization.objects.filter(pk=org_id).exists():
            raise ValidationError(f"Organization with id '{org_id}' not found.")
        if not Organization.objects.filter(pk=org_id, users=user).exists():
            raise ValidationError(f"User '{user}' is not a member of organization with id '{org_id}'.")
        raise ValidationError(
            f"Permission group for template '{template_name}' not found in organization with id '{org_id}'."
        )


def get_permission_groups_for_org(org: Organization) -> QuerySet[PermissionGroup]:
    """Return all :class:`~accounts.models.PermissionGroup` rows belonging to
    *org*."""
    return PermissionGroup.objects.filter(organization=org)


def get_member_permission_group(org: Organization) -> PermissionGroup:
    """Return the default member-level ``PermissionGroup`` for *org*.

    The member group is defined by the *first* template of the *first*
    org type on the org's profile.  This is the group that
    non-admin/non-superuser members are placed in by default.
    """
    profile = org.profile
    org_types = profile.org_types

    if not org_types:
        raise ValueError(f"Organization '{org.name}' has no org_types set on its profile.")

    primary_config = REGISTRY.org_type(org_types[0].value)
    if primary_config is None:
        raise LookupError(f"Org type '{org_types[0].value}' is not registered.")

    first_template = primary_config.templates[0]

    return PermissionGroup.objects.get(
        organization=org,
        template__name=first_template.name,
    )


def get_user_permission_group_for_org(
    user: AbstractBaseUser | AnonymousUser,
    org_id: str,
) -> PermissionGroup:
    """Return the highest-priority ``PermissionGroup`` the *user* belongs to in
    *org_id*.  Raises :exc:`PermissionError` when the user has no group in
    that organization.
    """
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


# ── Multi-step resolvers ──────────────────────────────────────────────


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    """DEPRECATED — use :func:`get_permission_group_for_org` with an explicit org.

    Legacy fallback that selects the first organization where the user has a
    member (non-admin, non-superuser) permission group.  Excludes Org Admin
    and Org Superuser templates so the returned group is always a member role.
    """
    logger.warning(
        "get_user_permission_group() is deprecated. Pass organization_id explicitly.",
        stacklevel=2,
    )
    from accounts.groups import ORG_ADMIN, ORG_SUPERUSER

    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(organization__users=user.pk)
        .exclude(template__name__in=[ORG_ADMIN.name, ORG_SUPERUSER.name])
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group


def get_permission_group_for_org(
    user: Union[AbstractBaseUser, AnonymousUser], organization: Organization
) -> PermissionGroup:
    """Return the user's member permission group for *organization*.

    Validates that the organization has a member role and that *user*
    belongs to that group.
    """
    invitable = REGISTRY.invitable_templates_for(organization)
    if not invitable:
        raise PermissionError("Organization has no member role defined.")

    member_role = invitable[0]
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(organization=organization, template__name=member_role.name)
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("Organization does not have the expected permission group")

    if not hasattr(user, "groups") or not user.groups.filter(id=permission_group.group_id).exists():  # type: ignore[union-attr]
        raise PermissionError("User is not a member of this organization's permission group")

    return permission_group


def resolve_permission_group(
    user: Union[AbstractBaseUser, AnonymousUser],
    organization_id: Optional[str] = None,
) -> PermissionGroup:
    """Resolve the correct PermissionGroup for a mutation.

    If *organization_id* is provided, validates membership against that org.
    Otherwise falls back to the deprecated first-org heuristic.

    TODO(SDB-178): Remove fallback once mobile can pass organization_id.
    """
    if organization_id:
        organization = Organization.objects.get(id=organization_id)
        return get_permission_group_for_org(user, organization)
    return get_user_permission_group(user)
