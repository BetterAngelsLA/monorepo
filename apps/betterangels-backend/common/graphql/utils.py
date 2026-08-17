from typing import Any, Callable, TypeVar

import strawberry
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Model, QuerySet
from strawberry.types.maybe import Some

T = TypeVar("T", bound=Model)


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


def apply_maybe(
    data: dict[str, Any],
    field: str,
    maybe: Any,
    convert: Callable[[Any], Any] = lambda value: value,
) -> None:
    """Apply a Strawberry ``Maybe`` field to an update dict, in place.

    ``Maybe`` is tri-state, and each state means something different to an
    update: absent is "leave it alone", ``Some(value)`` sets it, and
    ``Some(None)`` — only reachable on a ``Maybe[T | None]`` field — clears it.

    Absent is ``None`` on an idiomatic ``Maybe[T]`` field and ``UNSET`` on one
    declared ``= strawberry.UNSET``; both are treated as absent so the helper
    is correct either way.  Getting this wrong is not a loud failure: reading
    absent as "set to null" makes an update silently clear a field the caller
    never mentioned.

    Keeps *field* out of *data* entirely when absent, so ``"field" in data``
    stays a reliable "was this sent?" test for the services.  *convert*
    receives the unwrapped value and is not called for ``Some(None)``.
    """
    data.pop(field, None)

    if maybe is None or maybe is strawberry.UNSET:
        return

    value = maybe.value if isinstance(maybe, Some) else maybe
    data[field] = convert(value) if value is not None else None


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
