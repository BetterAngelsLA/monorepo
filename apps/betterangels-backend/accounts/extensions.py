"""Strawberry permission extension that validates org-scoped permissions.

Replaces the ``@HasPerm(global)`` + ``get_user_permitted_org()`` pattern
with a single ``@HasOrgPerm`` decorator that reads the active
organization from ``request.organization_id`` (set by
``OrganizationMiddleware`` from the ``X-Organization-ID`` header) and
validates the user's permission in that org via a single DB query.

Usage::

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE)],
    )
    def change_organization_member_role(self, info, data):
        ...

Or with django-codename strings::

    HasOrgPerm("shelters.view_shelter")
"""

from collections.abc import Callable
from typing import Any

from django.db.models import Q
from strawberry.types import Info
from strawberry_django.permissions import (
    DjangoNoPermission,
    HasPerm,
    PermTarget,
)
from strawberry_django.utils.typing import UserType


class HasOrgPerm(HasPerm):
    """Validates permissions on the request's active organization.

    Reads ``info.context.request.organization_id`` (set by
    ``OrganizationMiddleware`` from the ``X-Organization-ID`` header)
    and checks that the authenticated user holds the requested
    permission(s) within that organization via a single query.

    If no organization header is present, ``PermissionDenied`` is
    raised — there is no fallback to global permission checks.

    Extends ``HasPerm`` so the schema directive includes the same
    permission metadata (e.g. ``@hasOrgPerm(permissions: [{app: "shelters",
    permission: "view_shelter"}])``).

    Honors the parent ``any_perm`` flag:
    - ``any_perm=True`` (default): user must hold at least one of the given perms.
    - ``any_perm=False``: user must hold **all** of the given perms.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (
        "Requires the user to have the specified permission(s) in the "
        "organization set via X-Organization-ID header."
    )

    def resolve_for_user(
        self,
        resolver: Callable,
        user: UserType | None,
        *,
        info: Info,
        source: Any,
    ) -> Any:
        request = info.context.request
        org_id: str | None = getattr(request, "organization_id", None)

        if not org_id:
            raise DjangoNoPermission(
                "Organization ID is required for this operation. "
                "Set the X-Organization-ID header."
            )

        if not user or not user.is_authenticated:
            raise DjangoNoPermission("Authentication required.")

        if not self.perms:
            raise DjangoNoPermission("No permissions specified for this operation.")

        from accounts.models import Organization

        # Build a single query that checks all requested permissions.
        org_filter = Organization.objects.filter(
            pk=org_id,
            permission_groups__group__user=user,
        )

        if self.any_perm:
            q = Q()
            for perm_def in self.perms:
                q |= Q(
                    permission_groups__group__permissions__content_type__app_label=perm_def.app or "",
                    permission_groups__group__permissions__codename=perm_def.permission,
                )
            org = org_filter.filter(q).first()
        else:
            for perm_def in self.perms:
                org_filter = org_filter.filter(
                    permission_groups__group__permissions__content_type__app_label=perm_def.app or "",
                    permission_groups__group__permissions__codename=perm_def.permission,
                )
            org = org_filter.first()

        if org is None:
            raise DjangoNoPermission(
                "You do not have permission to perform this action "
                "in this organization."
            )

        return resolver()
