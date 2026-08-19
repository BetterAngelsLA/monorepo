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
    """
    try:
        return qs.get(pk=pk)
    except ObjectDoesNotExist:
        raise PermissionDenied(error_message)


def maybe_int_value(maybe: Maybe[ID | None]) -> int | None:
    """Narrow a ``Maybe[ID | None]`` to the FK's int, collapsing absent and null.

    Callers assigning the result into a dict of fields to update need a presence
    check on the input field first, or an absent field becomes an explicit null.
    """
    if maybe is None or maybe.value is None:
        return None

    return int(maybe.value)
