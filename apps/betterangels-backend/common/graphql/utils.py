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


def maybe_int_value(maybe: Any) -> int | None:
    """Unwrap a Strawberry ``Maybe[ID]`` to an int, or ``None`` if absent/null.

    For the plain read, prefer the idiom over a helper — it is correct for both
    absence spellings, since ``Some.__bool__`` is always ``True`` while ``None``
    and ``UNSET`` are both falsy::

        name = data.name.value if data.name else None

    This exists for the ``ID``-to-``int`` narrowing, which that idiom cannot do
    safely on its own: ``int(None)`` raises. A bare ``Maybe[ID]`` cannot carry an
    explicit null today — Strawberry rejects one at validation — but making
    ``teamId`` clearable (#2316) means annotating it ``Maybe[ID | None]``, at
    which point ``Some(None)`` becomes reachable. Keeping the narrowing in one
    place is what makes that a one-line change.

    Callers building an update dict should not use this at all: ``asdict``
    already omits absent fields, and overriding it turns "not mentioned" into
    "set to null".
    """
    if maybe is None or maybe is strawberry.UNSET:
        return None

    value = maybe.value if isinstance(maybe, Some) else maybe

    return int(value) if value is not None else None
