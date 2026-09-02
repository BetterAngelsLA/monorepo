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

    Post-teardown (ADR 0001 §4 phase 5): a **role-backed** template — one with
    a scoped ``Role`` row, i.e. a migrated domain like shelters — is written
    ONLY as a ``Grant`` (authoritative).  Every other template (CASEWORKER,
    ORG_ADMIN, ...) still uses the legacy ``PermissionGroup`` until its domain
    cutover.
    """

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    # ── Public API ──────────────────────────────────────────────────────

    def _role_for_template(self, template_config: "TemplateConfig") -> Role | None:
        """The scoped ``Role`` row backing *template_config*, if role-backed."""
        return Role.objects.filter(name=template_config.name, is_global=False).first()

    @transaction.atomic
    def add_roles(self, user: User, *templates: "TemplateConfig") -> None:
        """Grant one or more roles to *user*.

        ``templates`` are :class:`~common.permissions.config.TemplateConfig`
        objects such as :data:`~notes.groups.CASEWORKER`.  Role-backed
        templates write a ``Grant`` only; the rest write the legacy
        ``PermissionGroup`` membership.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if a
        non-role-backed template has no ``PermissionGroup`` on this org.
        """
        for template_config in templates:
            role = self._role_for_template(template_config)
            if role is not None:
                Grant.objects.get_or_create(principal_user=user, role=role, scope_org=self.organization)
            else:
                permission_group = PermissionGroup.objects.get(
                    organization=self.organization,
                    template__name=template_config.name,
                )
                user.groups.add(permission_group)

    @transaction.atomic
    def remove_roles(self, user: User, *templates: "TemplateConfig") -> None:
        """Revoke specific roles from *user*.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if a
        non-role-backed template has no ``PermissionGroup`` on this org.
        """
        for template_config in templates:
            role = self._role_for_template(template_config)
            if role is not None:
                Grant.objects.filter(principal_user=user, role=role, scope_org=self.organization).delete()
            else:
                permission_group = PermissionGroup.objects.get(
                    organization=self.organization,
                    template__name=template_config.name,
                )
                user.groups.remove(permission_group)

    @transaction.atomic
    def clear_roles(self, user: User) -> None:
        """Remove **all** org-scoped roles from *user* (Grants + legacy groups)."""
        groups = PermissionGroup.objects.filter(organization=self.organization)
        user.groups.remove(*groups)
        Grant.objects.filter(principal_user=user, scope_org=self.organization).delete()

    @transaction.atomic
    def replace_roles(self, user: User, *templates: "TemplateConfig") -> None:
        """Replace all org-scoped roles.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)
