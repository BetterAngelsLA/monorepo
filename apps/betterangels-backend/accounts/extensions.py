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
    PermDefinition,
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

        org_id_raw = info.context.request.organization_id

        if org_id_raw is None:
            raise DjangoNoPermission("Organization ID (X-Organization-ID header) is required.")
        org_id = str(org_id_raw)

        if not self.perms:
            raise DjangoNoPermission("No permissions specified for this operation.")

        has_perm = permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=org_id,
            perms=[f"{p.app}.{p.permission}" if p.app else str(p.permission) for p in self.perms],
            any_perm=self.any_perm,
            organization_field="pk",
        ).exists()

        if not has_perm:
            raise DjangoNoPermission("You do not have permission to perform this action in this organization.")

        return resolver()


class HasOrgPermOrGrant(HasPerm):
    """Transitional (ADR 0001 §5.3): legacy org-scoped perm OR the grant predicate.

    Used while an authority template — ``ORG_ADMIN`` / ``ORG_SUPERUSER`` — is still
    legacy.  The legacy arm (``permissioned_queryset``, exactly what ``HasOrgPerm``
    checks) preserves today's behavior; the grant arm (``can()``) is the end-state
    authority and stays dormant until the §5.3 provisioning PR role-backs the
    template and backfills Grants.

    The legacy arm runs first: it is today's authority and costs the same single
    query ``HasOrgPerm`` already made, so the common path's query count is
    unchanged.  Delete this extension in the provisioning PR — the predicate stays
    pure-grant; only consumers carry the transitional arm.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (  # type: ignore[misc]
        "Requires the user to hold the permission(s) in the organization (legacy group or grant) "
        "set via X-Organization-ID header."
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

        org_id_raw = info.context.request.organization_id

        if org_id_raw is None:
            raise DjangoNoPermission("Organization ID (X-Organization-ID header) is required.")
        org_id = str(org_id_raw)

        if not self.perms:
            raise DjangoNoPermission("No permissions specified for this operation.")

        perm_strings = [f"{p.app}.{p.permission}" if p.app else str(p.permission) for p in self.perms]

        legacy_ok = permissioned_queryset(
            Organization.objects.all(),
            user=user,
            organization_id=org_id,
            perms=perm_strings,
            any_perm=self.any_perm,
            organization_field="pk",
        ).exists()

        grant_ok = False
        if not legacy_ok:
            from common.permissions.selectors import can

            org_int = int(org_id)
            user_model = cast(User, user)
            if self.any_perm:
                grant_ok = any(can(user_model, perm, org=org_int) for perm in perm_strings)
            else:
                grant_ok = all(can(user_model, perm, org=org_int) for perm in perm_strings)

        if not (legacy_ok or grant_ok):
            raise DjangoNoPermission("You do not have permission to perform this action in this organization.")

        return resolver()


def _legacy_or_grant_perm_checker(info: Info, user: UserType) -> Callable[[PermDefinition], bool]:
    """Global ``has_perm`` OR grant-anywhere (ADR 0001 §5.3, transitional).

    Mirrors strawberry_django's default checker but also accepts the grant arm:
    Grants do not feed ``has_perm``, and the member-management permissions ride
    the still-legacy ``ORG_ADMIN`` / ``ORG_SUPERUSER`` templates, so a
    grant-only holder must be authorized through ``can_anywhere()``.
    """
    user_model = cast(User, user)

    def perm_checker(perm: PermDefinition) -> bool:
        if not perm.permission:
            return user_model.has_module_perms(str(perm.app))
        if user_model.has_perm(perm.perm):
            return True
        from common.permissions.selectors import can_anywhere

        return can_anywhere(user_model, perm.perm)

    return perm_checker


class HasPermOrGrant(HasPerm):
    """Transitional (ADR 0001 §5.3): global ``has_perm`` OR grant-anywhere.

    Used on the member-management read queries, whose authority template
    (``ORG_ADMIN`` / ``ORG_SUPERUSER``) is still legacy.  ``has_perm()`` is the
    legacy arm (today's ``HasPerm``); ``can_anywhere()`` is the grant arm and
    stays dormant until the §5.3 provisioning PR role-backs the template and
    backfills Grants.  Same message, ``fail_silently``, and caching semantics as
    ``HasPerm`` (the schema directive name changes to ``@hasPermOrGrant``).
    Delete this extension in the provisioning PR.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (  # type: ignore[misc]
        "Requires the user to hold the permission(s) globally (group or grant)."
    )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("perm_checker", _legacy_or_grant_perm_checker)
        super().__init__(*args, **kwargs)
