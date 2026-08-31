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
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationOwner, OrganizationUser

from .emails import base_url_for
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
            user=user,
            template__name__in=[t.name for t in permission_templates],
        ).values_list("template__name", flat=True)
    )

    new_templates = tuple(t for t in permission_templates if t.name not in existing_template_names)

    if new_templates:
        OrgRoleManager(organization).add_roles(user, *new_templates)

    return user


def invitation_role(permission_templates: tuple[TemplateConfig, ...]) -> TemplateConfig:
    """Pick which role's invitation email to send.

    One email goes out however many roles are granted, so prefer a role whose
    invite template is *not* the generic organization invitation — that body says
    nothing role-specific, while e.g. the Shelter Operator one carries the link to
    the shelter app.  Note Caseworker names the generic template explicitly, so
    "has an ``invite_html``" does not distinguish them; it has to be compared
    against the backend's default.  Ties fall to the given order.
    """
    generic_body = invitation_backend().invitation_body_html
    role_specific = [
        template for template in permission_templates if template.invite_html and template.invite_html != generic_body
    ]
    return (role_specific or list(permission_templates))[0]


def member_invite(
    *,
    organization: Organization,
    email: str,
    permission_templates: tuple[TemplateConfig, ...],
    invited_by: UserModel,
) -> UserModel:
    """Add someone to *organization* with the given roles and email them an invitation.

    The invitation is sent on commit, so a rolled-back membership never produces
    an email promising access the person does not have.  Which role's email is
    used is decided by :func:`invitation_role`.

    Returns the invited :class:`~accounts.models.User`.
    """
    permission_template = invitation_role(permission_templates)
    user = member_add(
        email=email,
        first_name="",
        last_name="",
        middle_name=None,
        organization=organization,
        permission_templates=permission_templates,
    )

    def send_invitation() -> None:
        invitation_backend().create_organization_invite(
            organization=organization,
            invited_by_user=invited_by,
            invitee_user=user,
        )
        invitation_backend().send_invitation(
            user=user,
            sender=invited_by,
            organization=organization,
            base_url=base_url_for(permission_template),
            role_template=permission_template,
        )

    transaction.on_commit(send_invitation)

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

    Returns the new :class:`~organizations.models.Organization` — always a new
    row, never an existing one matched on *name*.  Organization names are not
    unique, and resolving one by name let any caller of the public
    ``createOrganization`` mutation land on an organization someone else runs.
    Joining an existing organization goes through an invitation.
    """
    org_types: list[str] = []
    for preset_name in preset_names:
        org_config = REGISTRY.org_type(preset_name)
        if org_config is None:
            raise ValidationError(f"Unknown org-type preset: {preset_name}")
        if org_config.name not in org_types:
            org_types.append(org_config.name)

    org = Organization.objects.create(name=name)

    OrganizationProfile.objects.create(
        organization=org,
        org_types=[OrgTypeChoices(org_type) for org_type in org_types],
    )

    # Create PermissionGroup per template for this org.
    reconcile_org_groups(org)

    # Link the owner (django-organizations auto-creates OrganizationOwner).
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

    Group names are refreshed from the organization's current name, and each
    removed row's ``auth.Group`` is torn down by
    :func:`accounts.signals.delete_orphaned_group`, and the surviving groups have
    their permissions applied by :func:`accounts.seed.sync_group_permissions` —
    without this a newly created group would grant nothing until the next
    ``migrate``.

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

    _refresh_group_names(org)
    sync_group_permissions(organization=org)


def _refresh_group_names(org: Organization) -> None:
    """Re-label *org*'s groups, so a renamed organization is not left stale.

    ``PermissionGroup.group_name`` carries the organization's name, which is a
    copy — this is what keeps it current.  Runs for hand-managed groups too: the
    label is wrong for them in exactly the same way.
    """
    for permission_group in PermissionGroup.objects.filter(organization=org).select_related("template", "organization"):
        wanted = permission_group.group_name()
        if permission_group.name != wanted:
            permission_group.name = wanted
            permission_group.save(update_fields=["name"])


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
        raise ValidationError("You cannot remove the organization owner. Transfer ownership to another member first.")

    if user_id == removed_by.pk:
        raise ValidationError("You cannot remove yourself from the organization.")

    OrgRoleManager(organization).clear_roles(org_user.user)
    org_user.delete()

    return user_id


@transaction.atomic
def organization_transfer_ownership(
    *,
    organization: Organization,
    new_owner_user_id: int,
) -> UserModel:
    """Make *new_owner_user_id* the owner of *organization*.

    ``Organization.add_user`` makes the first member the owner and
    :func:`organization_remove_member` refuses to remove an owner, so without a
    way to move ownership the first person invited to a new organization could
    never be removed from it.  This is that way.

    Ownership is a single row, so the previous owner simply stops being one; they
    keep their membership and their roles.  Delegates the move to
    ``Organization.change_owner`` so django-organizations' ``owner_changed``
    signal still fires.  An organization that never had an owner has no move to
    make and no old owner to report, so it gets the row outright and no signal —
    the shelter importer's ``get_or_create`` left most of them in that state.

    Raises :class:`~django.core.exceptions.ValidationError` if the new owner is
    not a member of *organization*.
    """
    try:
        new_owner = OrganizationUser.objects.select_related("user").get(
            organization=organization,
            user_id=new_owner_user_id,
        )
    except OrganizationUser.DoesNotExist:
        raise ValidationError("Only a member of this organization can own it.")

    if OrganizationOwner.objects.filter(organization=organization).exists():
        organization.change_owner(new_owner)
    else:
        # An organization built without add_user has no owner row to move.
        OrganizationOwner.objects.create(organization=organization, organization_user=new_owner)

    member: UserModel = new_owner.user
    return member


@transaction.atomic
def member_roles_replace(
    *,
    organization: Organization,
    user_id: int,
    permission_templates: tuple[TemplateConfig, ...],
) -> UserModel:
    """Set which of *organization*'s invitable roles a member holds.

    An invitable role not listed is revoked, which makes this a single edit of
    "what this person can do here" rather than an additive grant.

    Every other org-scoped group is left alone: ``Organization Admin`` and
    ``Organization Superuser``, the ``REGISTRY.unscoped`` templates, and rows
    created by hand in the admin with a name and no template.  None of those are
    offered by the surfaces that call this, so clearing every group and re-adding
    the listed ones would revoke them invisibly — and a template-less row could
    not be re-added at all, since
    :meth:`accounts.role_manager.OrgRoleManager.add_roles` resolves a
    ``PermissionGroup`` by template name.  They are granted and revoked from the
    user page's group picker.

    Raises :class:`~django.core.exceptions.ValidationError` if the user is not a
    member of *organization*.
    """
    try:
        org_user = OrganizationUser.objects.select_related("user").get(
            organization=organization,
            user_id=user_id,
        )
    except OrganizationUser.DoesNotExist:
        raise ValidationError("User is not a member of this organization.")

    member: UserModel = org_user.user
    granted = {template.name for template in permission_templates}
    # reconcile_org_groups creates a PermissionGroup for every template the org's
    # org types name, so remove_roles' lookup of each of these resolves.
    revoked = tuple(
        template
        for name in REGISTRY.invitable_template_names_for(organization)
        if name not in granted and (template := REGISTRY.template(name)) is not None
    )

    role_manager = OrgRoleManager(organization)
    role_manager.add_roles(member, *permission_templates)
    role_manager.remove_roles(member, *revoked)

    return member


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
