"""Org-scoped role manager — mechanical add/remove/clear/replace operations.

Mirroring role-backed memberships to ``Grant`` rows is NOT done here: it is
enforced at the ``User.groups`` m2m edge (``accounts.signals``) so every
writer — this manager, the Django admin, scripts — keeps the invariant.

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


def scoped_role_for_group(permission_group: PermissionGroup) -> Role | None:
    """The scoped ``Role`` backing *permission_group*, if it is role-backed.

    A convenience for callers holding a single group (the admin's delete view);
    batch work should use :func:`scoped_roles_for_groups`.
    """
    return scoped_roles_for_groups([permission_group]).get(permission_group.pk)


def mirror_membership_grants(
    user: User, permission_groups: Iterable[PermissionGroup], *, organization: Organization | None = None
) -> None:
    """Dual-write role-backed memberships as ``Grant`` rows (ADR 0001 §4 phase 2).

    Scoped by each group's own organization; a caller that already holds it
    (``OrgRoleManager``) passes *organization* to skip an FK fetch per group.
    Idempotent — ``get_or_create``.
    """
    groups = list(permission_groups)
    roles = scoped_roles_for_groups(groups)
    for group in groups:
        role = roles.get(group.pk)
        if role is not None:
            Grant.objects.get_or_create(
                principal_user=user,
                role=role,
                scope_org=group.organization if organization is None else organization,
            )


def unmirror_membership_grants(
    user: User, permission_groups: Iterable[PermissionGroup], *, organization: Organization | None = None
) -> None:
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
            Grant.objects.filter(
                principal_user=user,
                role=role,
                scope_org=group.organization if organization is None else organization,
            ).delete()


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
        objects such as :data:`~notes.groups.CASEWORKER`.  Role-backed
        memberships are mirrored to ``Grant`` rows at the m2m edge
        (``accounts.signals``), not here — one mechanism no writer can bypass.

        Raises :class:`~django.core.exceptions.ObjectDoesNotExist` if no
        ``PermissionGroup`` exists for a given template on this organization.
        """
        for template_config in templates:
            permission_group = PermissionGroup.objects.get(
                organization=self.organization,
                template__name=template_config.name,
            )
            user.groups.add(permission_group)

    @transaction.atomic
    def remove_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Remove specific permission groups from *user*.

        Mirror revocation rides the same m2m edge as ``add_roles``.

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
        """Remove **all** org-scoped permission groups from *user*.

        The m2m edge unmirrors the memberships; the org-wide ``Grant`` delete
        additionally relinquishes direct grants that no group edge mirrors —
        removing a member drops every scoped authority they held here.
        """
        groups = PermissionGroup.objects.filter(organization=self.organization)
        user.groups.remove(*groups)
        Grant.objects.filter(principal_user=user, scope_org=self.organization).delete()

    @transaction.atomic
    def replace_roles(self, user: User, *templates: TemplateConfig) -> None:
        """Replace all org-scoped groups.  Convenience: clear + add."""
        self.clear_roles(user)
        self.add_roles(user, *templates)
