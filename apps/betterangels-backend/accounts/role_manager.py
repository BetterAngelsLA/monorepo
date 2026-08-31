"""Org-scoped role manager — mechanical add/remove/clear/replace operations.

Placed in its own module to avoid circular imports between
:mod:`accounts.services` and :mod:`accounts.utils`.
"""

from typing import TYPE_CHECKING

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

    One invariant is enforced here rather than in a caller: org-bypassing
    roles (``bypasses_org_scoping=True``) are admin-only — see :meth:`add_roles`.
    """

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    # ── Public API ──────────────────────────────────────────────────────

    @transaction.atomic
    def add_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Add one or more permission groups to *user*.

        ``templates`` are :class:`~common.permissions.config.TemplateConfig`
        objects such as :data:`~notes.groups.CASEWORKER`.

        Org-bypassing roles (``bypasses_org_scoping=True``) are **admin-only**.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a given template on this organization.
        """
        bypass_roles = [template.name for template in templates if template.bypasses_org_scoping]
        if bypass_roles:
            raise ValueError(f"Cannot add roles for: {', '.join(bypass_roles)}.")

        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.add(permission_group)

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

    @transaction.atomic
    def clear_roles(self, user: User) -> None:
        """Remove **all** org-scoped permission groups from *user*."""
        groups = PermissionGroup.objects.filter(organization=self.organization)
        user.groups.remove(*groups)

    @transaction.atomic
    def replace_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped groups.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)
