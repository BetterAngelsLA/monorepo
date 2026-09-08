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

    def _scoped_role(self, permission_group: PermissionGroup) -> Role | None:
        """The scoped ``Role`` row for a group's template, if it is role-backed."""
        if permission_group.template is None:
            return None
        return Role.objects.filter(name=permission_group.template.name, is_global=False).first()

    def _mirror_grant(self, user: User, permission_group: PermissionGroup) -> None:
        """Dual-write: mirror a scoped-role membership as a ``Grant``."""
        role = self._scoped_role(permission_group)
        if role is not None:
            Grant.objects.get_or_create(principal_user=user, role=role, scope_org=self.organization)

    def _unmirror_grant(self, user: User, permission_group: PermissionGroup) -> None:
        """Dual-write: drop the ``Grant`` when a scoped-role membership is removed."""
        role = self._scoped_role(permission_group)
        if role is not None:
            Grant.objects.filter(principal_user=user, role=role, scope_org=self.organization).delete()
