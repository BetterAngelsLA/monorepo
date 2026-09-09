"""Org-scoped role manager — mechanical add/remove/clear/replace operations.

Placed in its own module to avoid circular imports between
:mod:`accounts.services` and :mod:`accounts.utils`.
"""

from typing import TYPE_CHECKING

from django.db import transaction
from organizations.models import Organization

from .models import Grant, PermissionGroup, Role, User

if TYPE_CHECKING:
    from common.permissions.config import TemplateConfig


def scoped_role_for_group(permission_group: PermissionGroup) -> Role | None:
    """The scoped ``Role`` row backing *permission_group*, if it is role-backed.

    A ``PermissionGroup`` is role-backed when it was created from a role
    template — the template names the scoped ``Role`` whose ``Grant`` mirrors
    the membership.  Label-only (hand-made) groups have no template and so no
    mirror.
    """
    if permission_group.template is None:
        return None
    return Role.objects.filter(name=permission_group.template.name, is_global=False).first()


def mirror_membership_grant(
    user: User, permission_group: PermissionGroup, *, organization: Organization | None = None
) -> None:
    """Dual-write a role-backed membership as a ``Grant`` (ADR 0001 §4 phase 2).

    Scoped by the group's own organization; callers already holding it may
    pass it explicitly to avoid re-fetching the FK.
    """
    role = scoped_role_for_group(permission_group)
    if role is not None:
        scope_org = permission_group.organization if organization is None else organization
        Grant.objects.get_or_create(principal_user=user, role=role, scope_org=scope_org)


def unmirror_membership_grant(
    user: User, permission_group: PermissionGroup, *, organization: Organization | None = None
) -> None:
    """Drop the ``Grant`` mirroring *permission_group*'s membership."""
    role = scoped_role_for_group(permission_group)
    if role is not None:
        scope_org = permission_group.organization if organization is None else organization
        Grant.objects.filter(principal_user=user, role=role, scope_org=scope_org).delete()


class OrgRoleManager:
    """Manage org-scoped permission groups for a user.

    Provides mechanical operations — adding, removing, and replacing
    permission groups.  Business rules (e.g. "cannot remove the org
    owner") belong in the calling layer, not here.
    """

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    # ── Public API ──────────────────────────────────────────────────────

    @transaction.atomic
    def add_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Add one or more permission groups to *user*.

        ``templates`` are :class:`~common.permissions.config.TemplateConfig`
        objects such as :data:`~notes.groups.CASEWORKER`.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a given template on this organization.
        """
        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.add(permission_group)
            self._mirror_grant(user, permission_group)

    @transaction.atomic
    def remove_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Remove specific permission groups from *user*.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a given template on this organization.
        """
        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.remove(permission_group)
            self._unmirror_grant(user, permission_group)

    @transaction.atomic
    def clear_roles(self, user: User) -> None:
        """Remove **all** org-scoped permission groups from *user*."""
        groups = PermissionGroup.objects.filter(organization=self.organization)
        user.groups.remove(*groups)
        # Transition dual-write: mirror the cleared memberships in Grants.
        Grant.objects.filter(principal_user=user, scope_org=self.organization).delete()

    @transaction.atomic
    def replace_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped groups.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)

    # ── Transition dual-write (ADR 0001 §4 phase 2) ────────────────────────

    def _mirror_grant(self, user: User, permission_group: PermissionGroup) -> None:
        """Dual-write: mirror a scoped-role membership as a ``Grant``."""
        mirror_membership_grant(user, permission_group, organization=self.organization)

    def _unmirror_grant(self, user: User, permission_group: PermissionGroup) -> None:
        """Dual-write: drop the ``Grant`` when a scoped-role membership is removed."""
        unmirror_membership_grant(user, permission_group, organization=self.organization)
