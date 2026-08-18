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

    Two filters are applied, and **both** are load-bearing:

    1. **Object permissions**, via guardian's ``filter_for_user``.  On its
       own this does *not* confine a record to one organization: guardian
       falls back to *global* model-level permissions, so a user whose group
       holds e.g. ``notes.change_note`` globally matches every note in the
       database.  See ``docs/teams_org_scoping.md``.
    2. **The active organization**, from the ``X-Organization-ID`` header.
       This is what actually confines the write, and it is why
       *organization_field* is a required argument rather than a defaulted
       one — a silent default would either be wrong for models that reach
       their org indirectly, or would quietly reproduce the cross-org hole
       for models that opt out.

    Making the argument required means every call site answers, visibly in
    the decorator, the question the permission model turns on: is this
    endpoint **org-owned** (a field path) or deliberately **platform-shared**
    (``None``)?  Previously that was answered by whether someone remembered
    to write ``.filter(organization_id=...)`` in the resolver body, which
    four of eleven call sites did not.

    The parent ``HasRetvalPerm`` return-value check is skipped because some
    mutations return a different type than the queryset model (e.g.
    ``create_note_service_request`` checks Note CHANGE but returns a
    ``ServiceRequestType``).  Resolvers enforce access by reading through
    ``info.context.qs`` and converting a miss into ``PermissionDenied`` —
    see ``get_object_or_permission_error``.

    Parameters
    ----------
    organization_field : str | Sequence[str] | None
        Field path(s) from *model* to the owning organization —
        ``"organization_id"`` for a direct FK, ``"note__organization_id"``
        for an indirect one.  Several paths are OR'd together, for models
        reachable through more than one relation.  ``None`` opts out of org
        scoping entirely and must be justified in a comment at the call
        site: it means the records are shared across organizations.
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
        qs: QuerySet[Model] = filter_for_user(self.model.objects.all(), user, self.permissions)  # type: ignore

        if self.organization_fields is None:
            return qs

        # Raises DjangoNoPermission when the header is missing.  Safe here
        # because _prepare_qs is only called from resolve_for_user_with_perms,
        # inside the frame where the framework catches that signal.
        org_id = require_organization_id(info)

        qs = qs.filter(reduce(or_, (Q(**{f: org_id}) for f in self.organization_fields)))

        if any(LOOKUP_SEP in f for f in self.organization_fields):
            # A relation traversal may be multi-valued (ServiceRequest reaches
            # its org through two reverse m2m paths), and a row matching on
            # both sides would otherwise duplicate — which turns a later
            # .get() into MultipleObjectsReturned.
            qs = qs.distinct()

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

        Some mutations return a different type than ``self.model`` (e.g.
        ``ServiceRequestType`` while checking ``NotePermissions.CHANGE``).
        The standard ``HasRetvalPerm`` check would always fail on the
        mismatched type.  Instead, mutations enforce access control via
        ``qs.get()`` with an explicit ``DoesNotExist → PermissionDenied``.

        The queryset is built *here* rather than in a ``resolve`` override
        so that a missing org header raises where strawberry-django catches
        it.  ``resolve`` runs before the framework's try/except, so a denial
        raised there escapes as an untyped error.
        """
        if user is None:
            # DjangoNoPermission is the strawberry-django internal signal;
            # PermissionDenied would bypass the framework's error handling.
            raise DjangoNoPermission

        info.context.qs = self._prepare_qs(info)

        return resolver()
