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
    """Names of the roles *user_id* holds in *organization_id*, sorted."""
    return sorted(
        PermissionGroup.objects.filter(organization_id=organization_id, user=user_id).values_list("label", flat=True)
    )


def role_names_by_organization(*, user_id: int) -> dict[str, list[str]]:
    """Roles *user_id* holds, grouped by organization name and sorted within each."""
    by_organization: dict[str, list[str]] = {}
    for organization_name, role_name in (
        PermissionGroup.objects.filter(user=user_id)
        .select_related("organization")
        .values_list("organization__name", "label")
    ):
        by_organization.setdefault(organization_name, []).append(role_name)
    return {name: sorted(roles) for name, roles in sorted(by_organization.items())}


# ── Per-org permission reporting (ADR 0001 §2.4, finding F24) ──────────


def organization_permissions(user: User, *, org_ids: Optional[set[int]] = None) -> dict[int, list[str]]:
    """Per-org permission lists, ``scopes()``-equivalent (ADR 0001 §2.4).

    For each organization *user* can act in, the permission strings they can
    actually exercise — computed from the same sets the enforcement predicate
    uses, so the report never over-claims what ``scopes``/``can`` would deny:

        perms(O) = legacy(O)                       # non-inert apps only
                 ∪ perms(user's direct grants at O)
                 ∪ ⋃_{B→O delegation} perms(role_d) ∩ perms(user's grants at B)

    The delegated arm intersects the delegated role's permissions with what
    the user actually holds at the acting org B — the permission-matched rule
    (audit C-1) — mirroring ``scopes``.  Legacy permissions are reported only
    for domains whose authority is still legacy
    (``common.permissions.domain.LEGACY_INERT_APPS``); grant-only domains
    (shelters) never report inert legacy rows.

    ORG-SCOPED ONLY by design: per-permission "acts anywhere" authority
    (superuser, global Role, ``user_permissions``) is NOT included here — it is
    reported once in ``currentUser.permissions`` and the frontend unions both
    channels, so ``hasPermission`` still mirrors ``can()`` at every org.

    Batched: five queries regardless of the org count, run once per request.
    """
    from collections import defaultdict

    from common.permissions.domain import LEGACY_INERT_APPS
    from common.permissions.selectors import reachable_orgs

    from .models import Grant, PermissionGroup

    if org_ids is None:
        org_ids = set(reachable_orgs(user).values_list("pk", flat=True))

    # Direct grants at each org — one joined query (scope_org, app, codename).
    held_by_org: dict[int, set[str]] = defaultdict(set)
    for org_id, app, codename in Grant.objects.filter(principal_user=user).values_list(
        "scope_org",
        "role__permissions__content_type__app_label",
        "role__permissions__codename",
    ):
        if org_id is not None:
            held_by_org[org_id].add(f"{app}.{codename}")

    member_org_ids = set(Organization.objects.filter(users=user).values_list("pk", flat=True))

    # Delegated perms, permission-matched: a delegation B→O contributes a permission
    # only when *user* is a member of B AND holds that permission at B (the
    # audit C-1 rule).  One joined query over delegations into requested orgs.
    inherited_by_org: dict[int, set[str]] = defaultdict(set)
    for principal_org_id, org_id, app, codename in Grant.objects.filter(
        scope_org_id__in=org_ids, principal_org__isnull=False
    ).values_list(
        "principal_org_id",
        "scope_org_id",
        "role__permissions__content_type__app_label",
        "role__permissions__codename",
    ):
        perm = f"{app}.{codename}"
        if principal_org_id in member_org_ids and perm in held_by_org.get(principal_org_id, set()):
            inherited_by_org[org_id].add(perm)

    # Legacy PermissionGroup perms, non-inert apps only — one joined query.
    legacy_by_org: dict[int, set[str]] = defaultdict(set)
    for org_id, app, codename in PermissionGroup.objects.filter(user=user, organization_id__in=org_ids).values_list(
        "organization_id",
        "permissions__content_type__app_label",
        "permissions__codename",
    ):
        if app not in LEGACY_INERT_APPS:
            legacy_by_org[org_id].add(f"{app}.{codename}")

    return {
        org_id: sorted(
            held_by_org.get(org_id, set()) | inherited_by_org.get(org_id, set()) | legacy_by_org.get(org_id, set())
        )
        for org_id in org_ids
    }
