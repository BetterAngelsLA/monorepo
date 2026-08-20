from typing import Any, TypeVar

from strawberry import ID, Maybe

from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)


def get_object_or_permission_error(
    qs: QuerySet[T],
    pk: Any,
    error_message: str = "You do not have permission to perform this action.",
) -> T:
    """
    Get an object from a permission-filtered QuerySet or raise PermissionDenied.

    This helper standardizes the pattern required by PermissionedQuerySet:
    since the queryset is already filtered by row-level permissions,
    a DoesNotExist exception usually implies a permission denial (even if
    technically it could be a 404). Cross-org protection relies on this explicit error.

    ``pk`` comes from a GraphQL ``ID`` and may be any string, so a value the
    column cannot hold raises instead of missing. It names no row either.
    """
    try:
        return qs.get(pk=pk)
    except ObjectDoesNotExist, ValueError, TypeError:
        raise PermissionDenied(error_message)


def maybe_value(maybe: Maybe[ID | None]) -> ID | None:
    """Narrow a ``Maybe[ID | None]``, collapsing absent and null.

    Callers assigning the result into a dict of fields to update need a presence
    check on the input field first, or an absent field becomes an explicit null.

    The value stays the string GraphQL parsed. Django coerces it for whichever
    column it is bound for, so nothing here assumes an integer primary key.
    """
    return maybe.value if maybe is not None else None
