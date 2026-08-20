"""
Organization services — higher-level operations per the Django Styleguide.

Reference: https://github.com/HackSoftware/Django-Styleguide#services
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from common.org_types import REGISTRY
from common.permissions.config import TemplateConfig
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from organizations.models import Organization, OrganizationOwner, OrganizationUser

from .groups import ORG_ADMIN
from .seed import sync_group_permissions
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


# ── User provisioning ────────────────────────────────────────────────


def get_or_create_user_by_email(
    email: str,
    *,
    defaults: dict[str, Any] | None = None,
) -> tuple[UserModel, bool]:
    """Find or create a user by normalized email.

    A single unit of work with **no side effects on existing users**: an
    existing-but-deactivated account is returned unchanged.  Callers that are
    authorized to change account state (e.g. org-admin-initiated flows such as
    ``member_add``) call :func:`reactivate_user` explicitly — anonymous flows
    such as login-code self-signup do not.  Callers own transaction
    boundaries: wrap this in ``transaction.atomic()`` when combining it with
    other writes.

    Emails are stored lowercased by ``User.save()``, so the input is
    normalized (stripped + lowercased) before lookup — otherwise mixed-case
    input would miss the existing row and raise a unique-constraint
    violation.

    ``defaults`` (like :meth:`~django.db.models.QuerySet.get_or_create`)
    seeds field values only when a new user is created.  Brand-new users are
    created active with an unusable password and a random username (the
    codebase convention for programmatically created accounts, cf.
    ``UserManager.create_client``).  Any ``username``/``is_active`` supplied
    via ``defaults`` is ignored — the service always enforces these.

    Returns ``(user, created)``.
    """
    email = email.strip().lower()
    user, created = UserModel.objects.get_or_create(
        email=email,
        defaults={
            **(defaults or {}),
            "username": str(uuid.uuid4()),
            "is_active": True,
        },
    )
    if created:
        user.set_unusable_password()
        # All other fields were just written by the INSERT above; only the
        # password changed.
        user.save(update_fields=["password"])
    return user, created


def reactivate_user(user: UserModel) -> None:
    """Reactivate a deactivated account (no-op if already active).

    Call only from authorized flows (e.g. an org admin re-invites a member via
    ``member_add``); never from anonymous requests such as login-code
    self-signup, or a for-cause deactivation would be silently undone.
    """
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=["is_active"])


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
    Existing-but-deactivated users are reactivated via
    :func:`reactivate_user`.
    """
    user, _ = get_or_create_user_by_email(
        email,
        defaults={
            "first_name": first_name,
            "last_name": last_name,
            "middle_name": middle_name,
        },
    )
    # Authorized action: re-adding a member reactivates a deactivated account.
    reactivate_user(user)

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
    org_types: list[str] = []
    for preset_name in preset_names:
        org_config = REGISTRY.org_type(preset_name)
        if org_config is None:
            raise ValidationError(f"Unknown org-type preset: {preset_name}")
        if org_config.name not in org_types:
            org_types.append(org_config.name)

    org, _ = Organization.objects.get_or_create(name=name)

    # Profile with org types — update_or_create to fill in on existing orgs too.
    OrganizationProfile.objects.update_or_create(
        organization=org,
        defaults={"org_types": [OrgTypeChoices(org_type) for org_type in org_types]},
    )

    # Create PermissionGroup per template for this org.
    reconcile_org_groups(org)

    # Link the owner (django-organizations auto-creates OrganizationOwner).
    # Guarded so the function is safe to call repeatedly (idempotent).
    if not org.users.filter(pk=owner.pk).exists():
        org.add_user(owner)

    if owner_roles:
        OrgRoleManager(org).add_roles(owner, *owner_roles)

    return org


# ── Group reconciliation ──────────────────────────────────────────────


@transaction.atomic
def reconcile_org_groups(org: Organization) -> None:
    """Create missing and delete stale ``PermissionGroup`` records for *org*.

    Expected templates are derived from the org's ``profile.org_types`` via
    :data:`common.org_types.REGISTRY`.

    Only *derived* groups are reconciled — those whose template belongs to an
    org type.  Hand-managed groups are left untouched: templates outside any org
    type (``REGISTRY.unscoped``, e.g. Global Shelter Operator) and rows with no
    template at all, both of which are granted through the Django admin and
    would otherwise be destroyed on the next reconcile.

    An organization with no profile has no derived groups to reconcile, so none
    are created or deleted — unconfigured is not the same as having no roles.  Its
    permissions are still applied, so this function always leaves *org*
    consistent with config and is the only pass any caller needs to make.

    Each removed row's ``auth.Group`` is torn down by
    :func:`accounts.signals.delete_orphaned_group`, and the surviving groups have
    their permissions applied from config — without this a newly created group
    would grant nothing until the next ``migrate``.

    Safe to call repeatedly — all operations are idempotent.
    """
    org_types = OrganizationProfile.objects.values_list("org_types", flat=True).filter(organization=org).first()

    if org_types is not None:
        expected: set[str] = set()
        for org_type_value in org_types:
            org_config = REGISTRY.org_type(org_type_value.value)
            if org_config is None:
                continue
            for template_config in org_config.templates:
                expected.add(template_config.name)

        for template_name in expected:
            permission_group_template, _ = PermissionGroupTemplate.objects.get_or_create(
                name=template_name,
            )
            PermissionGroup.objects.get_or_create(
                organization=org,
                template=permission_group_template,
            )

        unscoped = {template_config.name for template_config in REGISTRY.unscoped}
        derived = {name for name in REGISTRY.template_names() if name not in unscoped}

        PermissionGroup.objects.filter(
            organization=org,
            template__name__in=derived - expected,
        ).delete()

    sync_group_permissions(organization=org)


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
