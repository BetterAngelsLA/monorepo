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

    This exists for the ``ID``-to-``int`` narrowing, which the plain
    ``data.field.value if data.field else None`` read cannot do safely on its
    own: ``int(None)`` raises. The ``teamId`` inputs are annotated
    ``Maybe[ID | None]``, so an explicit null arrives here as ``Some(None)`` and
    collapses to ``None``, which clears the FK. A bare ``Maybe[ID]`` would reject
    the null during argument conversion instead of clearing anything.

    Assigning the result into a dict of fields to update needs a presence check
    on the input field first (``if data.team_id:``).  Absent and explicitly-null
    both come back as ``None``, so an unconditional assignment turns "not
    mentioned" into "set to null".
    """
    if maybe is None or maybe is strawberry.UNSET:
        return None

    value = maybe.value if isinstance(maybe, Some) else maybe

    return int(value) if value is not None else None
