from functools import reduce
from operator import or_
from typing import Any, Callable, Optional, Sequence, Type, Union

from common.permissions.utils import require_organization_id
from django.db.models import Model, Q, QuerySet
from django.db.models.constants import LOOKUP_SEP
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import (
    DjangoNoPermission,
    HasRetvalPerm,
    PermDefinition,
    PermTarget,
    UserType,
)
from strawberry_django.utils.query import filter_for_user


class PermissionedQuerySet(HasRetvalPerm):
    """Injects an org-scoped, permission-filtered QuerySet into ``info.context.qs``.

    Object permissions and the active organization are both applied; see
    "Org-owned vs platform-shared" in ``docs/permissions.md`` for why one
    without the other does not confine a write.

    Because ``resolve_for_user_with_perms`` never calls ``super()``, the
    parent's ``target`` dispatch never runs; the argument is accepted only to
    keep the signature compatible with the base class.

    Parameters
    ----------
    organization_field : str | Sequence[str] | None
        Field path(s) from *model* to the owning organization —
        ``"organization_id"`` for a direct FK, ``"note__organization_id"``
        for an indirect one.  Several paths are OR'd together.  ``None``
        opts out, and means the records are shared across organizations.
    """

    def __init__(
        self,
        perms: Union[list[str], str],
        *,
        model: Type[Model],
        organization_field: Union[str, Sequence[str], None],
        message: Optional[str] = None,
        use_directives: bool = True,
        target: Optional[PermTarget] = None,
        any_perm: bool = True,
        perm_checker: Optional[Callable[[Info, UserType], Callable[[PermDefinition], bool]]] = None,
        obj_perm_checker: Optional[Callable[[Info, UserType], Callable[[PermDefinition, Any], bool]]] = None,
        with_anonymous: bool = True,
        with_superuser: bool = False,
    ) -> None:
        super().__init__(
            perms=perms,
            # Strawberry's default ("You don't have permission to access this
            # app.") names neither the record nor the organization.  Match
            # HasOrgPerm so a client gets the same denial either way.
            message=message or "You do not have permission to perform this action in this organization.",
            use_directives=use_directives,
            fail_silently=False,
            target=target,
            any_perm=any_perm,
            perm_checker=perm_checker,
            obj_perm_checker=obj_perm_checker,
            with_anonymous=with_anonymous,
            with_superuser=with_superuser,
        )
        self.model = model

        if organization_field is None:
            self.organization_fields: Optional[list[str]] = None
        elif isinstance(organization_field, str):
            self.organization_fields = [organization_field]
        else:
            self.organization_fields = list(organization_field)
            if not self.organization_fields:
                raise ValueError("organization_field must name at least one path, or be None to opt out.")

    def _prepare_qs(self, info: Info) -> QuerySet[Model]:
        user = get_current_user(info)
        qs: QuerySet[Model] = filter_for_user(self.model._default_manager.all(), user, self.permissions)

        if self.organization_fields is None:
            return qs

        org_id = require_organization_id(info)

        org_q = reduce(or_, (Q(**{f: org_id}) for f in self.organization_fields))

        if any(LOOKUP_SEP in f for f in self.organization_fields):
            # A traversal may be multi-valued, so join duplicates have to stay
            # inside the subquery or a later .get() raises MultipleObjectsReturned.
            qs = qs.filter(pk__in=self.model._default_manager.filter(org_q).values("pk"))
        else:
            qs = qs.filter(org_q)

        return qs

    def resolve_for_user_with_perms(
        self,
        resolver: Callable,
        user: UserType | None,
        *,
        info: Info,
        source: Any,
    ) -> Any:
        """Prepare the queryset, then skip the return-value permission check.

        The queryset is built here rather than in a ``resolve`` override so a
        denial raises inside the frame strawberry-django catches it in.
        """
        if user is None:
            # DjangoNoPermission is the strawberry-django internal signal;
            # PermissionDenied would bypass the framework's error handling.
            raise DjangoNoPermission

        info.context.qs = self._prepare_qs(info)

        return resolver()
