"""Org-scoped role manager — mechanical add/remove/clear/replace operations.

Placed in its own module to avoid circular imports between
:mod:`accounts.services` and :mod:`accounts.utils`.
"""

from typing import TYPE_CHECKING

from django.contrib.auth.models import Group
from django.db import transaction
from organizations.models import Organization

from .models import PermissionGroup, User

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
            user.groups.add(permission_group.group)

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
            user.groups.remove(permission_group.group)

    @transaction.atomic
    def clear_roles(self, user: User) -> None:
        """Remove **all** org-scoped permission groups from *user*."""
        groups = Group.objects.filter(permissiongroup__organization=self.organization)
        user.groups.remove(*groups)

    @transaction.atomic
    def replace_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped groups.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)
