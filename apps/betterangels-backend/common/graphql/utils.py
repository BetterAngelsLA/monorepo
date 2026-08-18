from typing import Any, TypeVar

import strawberry
from strawberry import Some

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


def maybe_value(maybe: Any) -> Any:
    """Unwrap a Strawberry ``Maybe[T]``, or return ``None`` if absent/null.

    A provided field arrives as ``Some(value)``, so it has to be unwrapped —
    returning the ``Some`` itself makes callers fail on whatever they do next
    (``'Some' object has no attribute 'strip'``).  Absent is ``None`` on a bare
    ``Maybe[T]`` field and ``UNSET`` on one declared ``= strawberry.UNSET``.

    Collapses absent and explicit null into ``None``, which suits callers where
    both mean "no value".  Use ``apply_maybe`` where the two must stay distinct.
    """
    if maybe is None or maybe is strawberry.UNSET:
        return None

    return maybe.value if isinstance(maybe, Some) else maybe


def maybe_int_value(maybe: Any) -> int | None:
    """Unwrap a Strawberry ``Maybe[ID]`` to an int, or ``None`` if absent/null."""
    value = maybe_value(maybe)

    return int(value) if value is not None else None
