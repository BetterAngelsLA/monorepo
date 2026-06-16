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

from typing import Any, Callable

from accounts.permissions import get_user_permitted_org
from django.core.exceptions import PermissionDenied
from django.db.models import TextChoices
from strawberry.types import Info
from strawberry_django.permissions import (
    DjangoPermissionExtension,
    PermDefinition,
    PermTarget,
    _default_perm_checker,
    _default_obj_perm_checker,
)


class HasOrgPerm(DjangoPermissionExtension):
    """Validates a permission on the request's active organization.

    Reads ``info.context.request.organization_id`` (set by
    ``OrganizationMiddleware``) and checks that the authenticated
    user holds *permission* in that organization via
    :func:`~accounts.permissions.get_user_permitted_org`.

    Falls back to the standard ``HasPerm`` behaviour when no
    organization header is present on the request.
    """

    DEFAULT_TARGET: PermTarget = PermTarget.GLOBAL

    def __init__(
        self,
        perms: list[str] | str | TextChoices,
        *,
        message: str | None = None,
        use_directives: bool = True,
        fail_silently: bool = True,
        target: PermTarget | None = None,
        any_perm: bool = True,
        perm_checker: Callable | None = None,
        obj_perm_checker: Callable | None = None,
        with_anonymous: bool = True,
        with_superuser: bool = False,
    ):
        # Normalize: TextChoices → string for HasPerm.__init__
        if isinstance(perms, TextChoices):
            perms = [f"{perms._meta.app_label}.{perms.name}"]
        elif isinstance(perms, str):
            perms = [perms]

        super().__init__(
            message=message,
            use_directives=use_directives,
            fail_silently=fail_silently,
        )

        self.perms: tuple[PermDefinition, ...] = tuple(
            PermDefinition.from_perm(p) if isinstance(p, str) else p for p in perms
        )
        self.target = target if target is not None else self.DEFAULT_TARGET
        self.any_perm = any_perm
        self.perm_checker = (
            perm_checker if perm_checker is not None else _default_perm_checker
        )
        self.obj_perm_checker = (
            obj_perm_checker if obj_perm_checker is not None else _default_obj_perm_checker
        )
        self.with_anonymous = with_anonymous
        self.with_superuser = with_superuser

    def resolve_for_user(self, user: Any, info: Info) -> None:
        request = info.context.request
        org_id: str | None = getattr(request, "organization_id", None)

        if not org_id:
            # Fall back to standard HasPerm behavior (no org header)
            return super().resolve_for_user(user, info)

        if not user or not user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        # Resolve the first perm's codename for org-scoped check
        perm_def = self.perms[0]
        app_label = perm_def.app_label or ""
        codename = perm_def.perm

        org = get_user_permitted_org(
            user,
            org_id=org_id,
            permission=f"{app_label}.{codename}",
        )

        if org is None:
            raise PermissionDenied(
                f"You do not have permission to perform this action in this organization."
            )