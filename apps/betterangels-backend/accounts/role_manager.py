"""Org-scoped role manager — mechanical add/remove/clear/replace operations.

Mirroring role-backed memberships to ``Grant`` rows rides the ``User.groups``
m2m edge (``accounts.signals``) so every writer — this manager, the Django
admin, scripts — keeps the invariant.  The exception is a grant-only
(``legacy_inert``) role: it has no group edge, so this manager mirrors its
scoped ``Role`` directly.

Placed in its own module to avoid circular imports between
:mod:`accounts.services` and :mod:`accounts.utils`.
"""

from typing import TYPE_CHECKING, Iterable

from django.db import transaction
from organizations.models import Organization

from .models import Grant, PermissionGroup, Role, User

if TYPE_CHECKING:
    from common.permissions.config import TemplateConfig


def scoped_roles_for_groups(permission_groups: Iterable[PermissionGroup]) -> dict[int, Role]:
    """Map group pk → the scoped ``Role`` row backing it, where one exists.

    A ``PermissionGroup`` is role-backed when it was created from a role
    template — the template names the scoped ``Role`` whose ``Grant`` mirrors
    the membership.  Label-only (hand-made) groups have no template and so no
    mirror; a template with no ``Role`` row (pre-``sync_roles``) mirrors
    nothing either.  One ``Role`` query for the whole batch, so a signal's
    ``pk_set`` or a multi-group membership edit resolves in one lookup.
    """
    names_by_group: dict[int, str] = {}
    for group in permission_groups:
        template = group.template
        if template is not None:
            names_by_group[group.pk] = template.name
    if not names_by_group:
        return {}
    roles = {role.name: role for role in Role.objects.filter(name__in=set(names_by_group.values()), is_global=False)}
    return {pk: roles[name] for pk, name in names_by_group.items() if name in roles}


def mirror_membership_grants(user: User, permission_groups: Iterable[PermissionGroup]) -> None:
    """Dual-write role-backed memberships as ``Grant`` rows (ADR 0001 §4 phase 2).

    Scoped by each group's own organization.  Idempotent — ``get_or_create``.
    """
    groups = list(permission_groups)
    roles = scoped_roles_for_groups(groups)
    for group in groups:
        role = roles.get(group.pk)
        if role is not None:
            Grant.objects.get_or_create(principal_user=user, role=role, scope_org=group.organization)


def unmirror_membership_grants(user: User, permission_groups: Iterable[PermissionGroup]) -> None:
    """Drop the ``Grant`` mirrors of role-backed memberships.

    Only the rows mirroring these memberships are deleted; a ``Grant`` for the
    same role and org needs no membership to exist (a direct grant), so it is
    indistinguishable here and is revoked with the membership.
    """
    groups = list(permission_groups)
    roles = scoped_roles_for_groups(groups)
    for group in groups:
        role = roles.get(group.pk)
        if role is not None:
            Grant.objects.filter(principal_user=user, role=role, scope_org=group.organization).delete()


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
        """Add one or more roles to *user* at this organization.

        ``templates`` are :class:`~common.permissions.config.TemplateConfig`
        objects such as :data:`~notes.groups.CASEWORKER`.  A dual-write
        template resolves its org ``PermissionGroup`` row and adds *user* to
        it; the m2m edge mirrors the ``Grant`` (``accounts.signals``) — one
        mechanism no writer can bypass.

        A ``legacy_inert`` template (the ORG_ADMIN/ORG_SUPERUSER org-portal
        roles) is grant-only (ADR 0001 teardown): no ``PermissionGroup`` row
        exists for it, so there is no m2m edge to ride — the manager mirrors
        the scoped ``Role`` Grant directly.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a dual-write template on this organization.
        """
        for template_config in templates:
            if not template_config.legacy_inert:
                permission_group = PermissionGroup.objects.get(
                    organization=self.organization,
                    template__name=template_config.name,
                )
                user.groups.add(permission_group)
            else:
                self._mirror_grant(user, template_config.name)

    @transaction.atomic
    def remove_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Remove specific roles from *user* at this organization.

        A dual-write template removes the org ``PermissionGroup`` membership;
        the m2m edge unmirrors the ``Grant``.  A ``legacy_inert`` template has
        no ``PermissionGroup`` row to remove — its mirrored ``Grant`` is
        dropped directly.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a dual-write template on this organization.
        """
        for template_config in templates:
            if not template_config.legacy_inert:
                permission_group = PermissionGroup.objects.get(
                    organization=self.organization,
                    template__name=template_config.name,
                )
                user.groups.remove(permission_group)
            else:
                self._unmirror_grant(user, template_config.name)

    @transaction.atomic
    def clear_roles(self, user: User) -> None:
        """Remove **all** org-scoped roles from *user*.

        Removes every remaining (dual-write) org ``PermissionGroup`` membership
        — the m2m edge unmirrors them — and drops every ``Grant`` at this
        organization, ``legacy_inert`` roles included (their authority is the
        ``Grant`` alone), so direct grants are relinquished too.
        """
        groups = PermissionGroup.objects.filter(organization=self.organization)
        user.groups.remove(*groups)
        Grant.objects.filter(principal_user=user, scope_org=self.organization).delete()

    @transaction.atomic
    def replace_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped roles.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)

    # ── Grant-only roles (no PermissionGroup edge to mirror through) ───────

    def _role_for(self, template_name: str) -> Role | None:
        """The scoped ``Role`` row backing *template_name*, if role-backed."""
        return Role.objects.filter(name=template_name, is_global=False).first()

    def _mirror_grant(self, user: User, template_name: str) -> None:
        """Mirror a grant-only role's scoped ``Role`` as a ``Grant``."""
        role = self._role_for(template_name)
        if role is not None:
            Grant.objects.get_or_create(principal_user=user, role=role, scope_org=self.organization)

    def _unmirror_grant(self, user: User, template_name: str) -> None:
        """Drop a grant-only role's mirrored ``Grant``."""
        role = self._role_for(template_name)
        if role is not None:
            Grant.objects.filter(principal_user=user, role=role, scope_org=self.organization).delete()
