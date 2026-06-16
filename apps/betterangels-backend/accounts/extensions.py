"""Strawberry permission extension that validates org-scoped permissions.

Replaces the ``@HasPerm(global)`` + ``get_user_permitted_org()`` pattern
with a single ``@HasOrgPerm`` decorator that reads the active
organization from ``request.organization_id`` (set by
``OrganizationMiddleware``) and validates the user's permission in that org.

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

from typing import Any

from accounts.permissions import get_user_permitted_org
from django.core.exceptions import PermissionDenied
from strawberry.types import Info
from strawberry_django.permissions import (
    HasPerm,
    PermTarget,
)


class HasOrgPerm(HasPerm):
    """Validates a permission on the request's active organization.

    Reads ``info.context.request.organization_id`` (set by
    ``OrganizationMiddleware``) and checks that the authenticated
    user holds *permission* in that organization via
    :func:`~accounts.permissions.get_user_permitted_org`.

    Extends ``HasPerm`` so the schema directive includes the same
    permission metadata (e.g. ``@hasOrgPerm(permissions: [{app: "shelters",
    permission: "view_shelter"}])``).
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (
        "Requires the user to have the specified permission in the "
        "organization set via X-Organization-ID header."
    )

    def resolve_for_user(self, user: Any, info: Info) -> None:
        request = info.context.request
        org_id: str | None = getattr(request, "organization_id", None)

        if not org_id:
            raise PermissionDenied(
                "Organization ID is required for this operation. "
                "Set the X-Organization-ID header."
            )

        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        # Resolve the first perm's codename for org-scoped check
        perm_def = self.perms[0]
        app_label = perm_def.app or ""
        codename = perm_def.permission

        org = get_user_permitted_org(
            user,
            org_id=org_id,
            permission=f"{app_label}.{codename}",
        )

        if org is None:
            raise PermissionDenied(
                f"You do not have permission to perform this action in this organization."
            )