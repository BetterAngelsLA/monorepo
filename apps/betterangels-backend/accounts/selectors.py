"""Read-only queries for organization permissions — per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#selectors
"""

import logging
from typing import Optional, Union

from common.permissions.config import TemplateConfig
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser
from django.core.exceptions import ValidationError
from django.db.models import QuerySet
from organizations.models import Organization

from .models import PermissionGroup, User

logger = logging.getLogger(__name__)


# ── Single-entity lookups ─────────────────────────────────────────────


def organization_get_for_member(
    *,
    user: Union[AbstractBaseUser, AnonymousUser],
    organization_id: str | int | None,
) -> Optional[Organization]:
    """Return the organization *organization_id* names, if *user* belongs to it."""
    try:
        return Organization.objects.filter(pk=str(organization_id), users=user).first()
    except ValueError, TypeError:
        return None


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


def get_permission_group_for_org(
    user: Union[AbstractBaseUser, AnonymousUser],
    organization: Organization,
    *,
    template: TemplateConfig,
) -> PermissionGroup:
    """Return the PermissionGroup for *template* in *organization*
    that *user* belongs to.

    Validates that the organization has the requested template and that
    *user* is a member of that group.
    """
    template_name = template.name
    permission_group = (
        PermissionGroup.objects.select_related("organization")
        .filter(organization=organization, template__name=template_name)
        .first()
    )

    if not permission_group:
        raise PermissionError(f"Organization does not have a '{template_name}' permission group")

    if not hasattr(user, "groups") or not user.groups.filter(id=permission_group.pk).exists():  # type: ignore[union-attr]
        raise PermissionError("User is not a member of this organization's permission group")

    return permission_group


def resolve_permission_group(
    user: Union[AbstractBaseUser, AnonymousUser],
    *,
    template: TemplateConfig,
    organization_id: Optional[str] = None,
) -> PermissionGroup:
    """Resolve the correct PermissionGroup for a mutation.

    If *organization_id* is provided, validates membership against that org.
    Otherwise finds the first organization where the user holds a
    *template* group.

    Callers should always specify *template* explicitly (e.g.
    ``CASEWORKER`` for outreach operations).
    """
    template_name = template.name
    if organization_id:
        organization = Organization.objects.get(id=organization_id)
        return get_permission_group_for_org(user, organization, template=template)

    # No organization_id — find the first org where the user holds this template.
    permission_group = (
        PermissionGroup.objects.select_related("organization")
        .filter(template__name=template_name, user=user.pk)  # type: ignore[union-attr]
        .first()
    )

    if not permission_group:
        raise PermissionError(f"User does not hold a '{template_name}' permission group in any organization")

    return permission_group


# ── Role reporting ────────────────────────────────────────────────────


def member_role_names(*, user_id: int, organization_id: int) -> list[str]:
    """Names of the roles *user_id* holds in *organization_id*, sorted.

    Unions the legacy ``PermissionGroup`` memberships and user-principal
    ``Grant`` rows (role-backed templates, ADR 0001 §4 phase 5) — a grant-held
    Shelter Operator must still appear after teardown (audit C-8).
    """
    from .models import Grant

    legacy = PermissionGroup.objects.filter(organization_id=organization_id, user=user_id).values_list(
        "label", flat=True
    )
    grant_roles = Grant.objects.filter(scope_org_id=organization_id, principal_user_id=user_id).values_list(
        "role__name", flat=True
    )
    return sorted(set(legacy) | set(grant_roles))


def role_names_by_organization(*, user_id: int) -> dict[str, list[str]]:
    """Roles *user_id* holds, grouped by organization name and sorted within each.

    Unions legacy ``PermissionGroup`` memberships and user-principal ``Grant``
    rows (audit C-8) so a grant-only holder still appears after teardown.
    """
    from .models import Grant

    by_organization: dict[str, list[str]] = {}
    rows: list[tuple[str, str]] = list(
        PermissionGroup.objects.filter(user=user_id)
        .select_related("organization")
        .values_list("organization__name", "label")
    )
    rows += list(
        Grant.objects.filter(principal_user_id=user_id, scope_org__isnull=False)
        .select_related("scope_org")
        .values_list("scope_org__name", "role__name")
    )
    for organization_name, role_name in rows:
        by_organization.setdefault(organization_name, []).append(role_name)
    return {name: sorted(roles) for name, roles in sorted(by_organization.items())}
