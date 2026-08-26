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

from accounts.models import Organization
from common.permissions.utils import permissioned_queryset, user_holds_org_bypass_perms
from strawberry.types import Info
from strawberry_django.permissions import (
    DjangoNoPermission,
    HasPerm,
)
from strawberry_django.utils.typing import UserType


class HasOrgPerm(HasPerm):
    """Validates permissions on the request's active organization.

    Reads ``info.context.request.organization_id`` (set by
    ``OrganizationMiddleware`` from the ``X-Organization-ID`` header)
    and checks that the authenticated user holds the requested
    permission(s) within that organization via a single query.

    Delegates to ``permissioned_queryset`` so the permission-checking
    SQL is shared with ``get_queryset`` hooks and selectors.

    Defaults ``fail_silently=False`` so that permission denials raise
    rather than silently returning empty results.

    Honors the parent ``any_perm`` flag:
    - ``any_perm=True`` (default): user must hold at least one of the given perms.
    - ``any_perm=False``: user must hold **all** of the given perms.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (  # type: ignore[misc]
        "Requires the user to have the specified permission(s) in the organization set via X-Organization-ID header."
    )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("fail_silently", False)
        kwargs.setdefault(
            "message",
            "You do not have permission to perform this action in this organization.",
        )
        super().__init__(*args, **kwargs)

    def resolve_for_user(
        self,
        resolver: Callable,
        user: UserType | None,
        *,
        info: Info,
        source: Any,
    ) -> Any:
        if not user or not user.is_authenticated:
            raise DjangoNoPermission("Authentication required.")

        if not self.perms:
            raise DjangoNoPermission("No permissions specified for this operation.")

        perm_strs = [f"{p.app}.{p.permission}" if p.app else str(p.permission) for p in self.perms]

        # Redundant with permissioned_queryset's own bypass below (an org-bypassing
        # user would make that call's Organization.objects.all() return non-empty
        # regardless of organization_id) -- kept as an explicit short-circuit so the
        # bypass is visible here without requiring a reader to trace into
        # permissioned_queryset, and so we skip a pointless always-true query.
        if user_holds_org_bypass_perms(user, perm_strs, self.any_perm):
            return resolver()

        org_id_raw = info.context.request.organization_id

        if org_id_raw is None:
            raise DjangoNoPermission("Organization ID (X-Organization-ID header) is required.")
        org_id = str(org_id_raw)

        has_perm = permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=org_id,
            perms=perm_strs,
            any_perm=self.any_perm,
            organization_field="pk",
        ).exists()

        if not has_perm:
            raise DjangoNoPermission("You do not have permission to perform this action in this organization.")

        return resolver()
