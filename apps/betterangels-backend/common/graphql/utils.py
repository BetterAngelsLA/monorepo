from typing import Any, Callable, TypeVar

import strawberry
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)


def maybe_value(maybe: Any) -> Any:
    """Extract the value from a Strawberry ``Maybe[T]``, or ``None`` if UNSET/null."""
    if maybe is strawberry.UNSET or maybe is None:
        return None
    return maybe


def maybe_int_value(maybe: Any) -> int | None:
    """Extract an int from a Strawberry ``Maybe[ID]``, or ``None`` if UNSET/null."""
    raw = maybe_value(maybe)
    value = raw.value if raw is not None else None
    return int(value) if value is not None else None


def apply_maybe(
    data: dict[str, Any],
    field: str,
    maybe: Any,
    convert: Callable[[Any], Any] = maybe_value,
) -> None:
    """Apply a Strawberry ``Maybe`` field to an update dict, in place.

    ``Maybe`` inputs are tri-state and the three states mean different things
    to an update: UNSET is "leave it alone", an explicit value sets it, and
    (once the input allows it) null clears it.  Resolvers have to strip the
    Maybe wrapper out of ``asdict`` output before it reaches ``setattr``, then
    put a real value back only when one was sent — easy to get subtly wrong,
    and the mistake looks like "updates silently clear the field".

    Keeps *field* out of *data* entirely when UNSET so ``"field" in data``
    stays a reliable "was this sent?" test for the services.
    """
    data.pop(field, None)

    if maybe is strawberry.UNSET:
        return

    data[field] = convert(maybe)


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
