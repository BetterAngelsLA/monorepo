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
from typing import Any, cast

from accounts.models import Organization, User
from common.permissions.utils import permissioned_queryset
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

    ``also_grant`` (transitional, ADR 0001 §5.3): when true, the check passes
    if the user holds the permission via the legacy org-scoped path OR the
    grant predicate (``common.permissions.selectors.can``).  Consumers set it
    while their authority template (``ORG_ADMIN`` / ``ORG_SUPERUSER``) is still
    legacy: the legacy arm preserves today's behavior, and the grant arm is
    dormant until the §5.3 provisioning PR role-backs the template and
    backfills Grants.  The directive is unchanged (still ``@hasOrgPerm``), so
    the schema — and the frontend types — do not churn per slice; the flag is
    dropped when the seam goes grant-only.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (  # type: ignore[misc]
        "Requires the user to have the specified permission(s) in the organization set via X-Organization-ID header."
    )

    def __init__(self, *args: Any, also_grant: bool = False, **kwargs: Any) -> None:
        self.also_grant = also_grant
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

        org_id_raw = info.context.request.organization_id

        if org_id_raw is None:
            raise DjangoNoPermission("Organization ID (X-Organization-ID header) is required.")
        org_id = str(org_id_raw)

        if not self.perms:
            raise DjangoNoPermission("No permissions specified for this operation.")

        perm_strings = [f"{p.app}.{p.permission}" if p.app else str(p.permission) for p in self.perms]

        has_perm = permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=org_id,
            perms=perm_strings,
            any_perm=self.any_perm,
            organization_field="pk",
        ).exists()

        if not has_perm and self.also_grant:
            # The grant arm runs only when the legacy arm fails: it is the
            # end-state authority and stays dormant until the §5.3 provisioning
            # PR role-backs the template and backfills Grants, so the common
            # path's query count is unchanged.
            from common.permissions.selectors import can

            org_int = int(org_id)
            user_model = cast(User, user)
            if self.any_perm:
                has_perm = any(can(user_model, perm, org=org_int) for perm in perm_strings)
            else:
                has_perm = all(can(user_model, perm, org=org_int) for perm in perm_strings)

        if not has_perm:
            raise DjangoNoPermission("You do not have permission to perform this action in this organization.")

        return resolver()
