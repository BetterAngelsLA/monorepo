from typing import Any, TypeVar

from django.db.models import Model, QuerySet
import strawberry


T = TypeVar("T", bound=Model)


def get_object_or_permission_error(
    qs: QuerySet[T],
    pk: Any,
    error_message: str = "You do not have permission to perform this action.",
) -> T:
    """
    Get an object from a permission-filtered QuerySet or raise PermissionError.

    This helper standardizes the pattern required by PermissionedQuerySet:
    since the queryset is already filtered by row-level permissions,
    a DoesNotExist exception usually implies a permission denial (even if
    technically it could be a 404). Cross-org protection relies on this explicit error.
    """
    try:
        return qs.get(pk=pk)
    except qs.model.DoesNotExist:
        raise PermissionError(error_message)


def strip_unset(obj: Any) -> Any:
    """Recursively remove strawberry.UNSET values from nested dicts/lists.

    Use after ``strawberry.asdict()`` to ensure UNSET sentinels in optional
    nested inputs don't leak into service/model layers that expect plain
    Python types.

    >>> strip_unset({"a": 1, "b": strawberry.UNSET, "c": {"d": strawberry.UNSET, "e": 2}})
    {'a': 1, 'c': {'e': 2}}
    """
    if isinstance(obj, dict):
        return {k: strip_unset(v) for k, v in obj.items() if v is not strawberry.UNSET}
    if isinstance(obj, list):
        return [strip_unset(item) for item in obj]
    return obj
