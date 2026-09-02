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

from accounts.models import User
from strawberry.types import Info
from strawberry_django.permissions import (
    DjangoNoPermission,
    HasPerm,
    PermDefinition,
)
from strawberry_django.utils.typing import UserType


class HasOrgPerm(HasPerm):
    """Transitional org-scoped permission (ADR 0001 §5.3): legacy OR grant.

    Reads ``info.context.request.organization_id`` (set by
    ``OrganizationMiddleware`` from the ``X-Organization-ID`` header) and checks
    the user holds the permission(s) in that organization through the single
    transition seam, :func:`common.permissions.selectors.has_authority` — the
    legacy org-scoped check while the authority template is still legacy, then
    the grant predicate (``can()``) once the template is role-backed and
    backfilled.

    ``fail_silently=False``: permission denials raise rather than silently
    returning empty results.  Honors the parent ``any_perm`` flag:
    - ``any_perm=True`` (default): user must hold at least one of the given perms.
    - ``any_perm=False``: user must hold **all** of the given perms.
    """

    SCHEMA_DIRECTIVE_DESCRIPTION: str = (  # type: ignore[misc]
        "Requires the user to hold the specified permission(s) in the organization set via X-Organization-ID header."
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

        from common.permissions.selectors import permitted_org

        perm_strings = [f"{p.app}.{p.permission}" if p.app else str(p.permission) for p in self.perms]
        user_model = cast(User, user)

        if self.any_perm:
            ok = any(permitted_org(user_model, perm, org_id=org_id) is not None for perm in perm_strings)
        else:
            ok = all(permitted_org(user_model, perm, org_id=org_id) is not None for perm in perm_strings)

        if not ok:
            raise DjangoNoPermission("You do not have permission to perform this action in this organization.")

        return resolver()


def legacy_or_grant_perm_checker(info: Info, user: UserType) -> Callable[[PermDefinition], bool]:
    """Global ``has_perm`` OR grant-anywhere — the member-query anywhere tier.

    Mirrors strawberry_django's default checker but accepts the grant arm via
    :func:`common.permissions.selectors.has_authority_anywhere`: Grants do not
    feed ``has_perm``, and ``view_org_members`` rides the still-legacy
    ``ORG_ADMIN`` / ``ORG_SUPERUSER`` templates, so a grant-only holder must be
    authorized through ``can_anywhere()``.  Deleted at phase 5.

    Passed to the stock ``HasPerm`` (``perm_checker=...``) rather than a
    subclass, so no new schema directive is minted for the transitional seam.
    """
    user_model = cast(User, user)

    def perm_checker(perm: PermDefinition) -> bool:
        if not perm.permission:
            return user_model.has_module_perms(str(perm.app))
        from common.permissions.selectors import has_authority_anywhere

        return has_authority_anywhere(user_model, perm.perm)

    return perm_checker
