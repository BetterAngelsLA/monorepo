from typing import Any, TypeVar

from strawberry import Maybe

from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)
V = TypeVar("V")


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


def maybe_value(maybe: Maybe[V]) -> V | None:
    """Unbox a ``Maybe``, collapsing absent and null to ``None``.

    For resolvers passing explicit keyword arguments to a service, where a field
    that was not sent and one sent as null mean the same thing. Anything building
    a dict of fields to update wants ``strawberry.asdict`` instead, which omits
    an absent field rather than collapsing it -- the distinction an update needs.

    Null is only reachable for ``Maybe[T | None]``; strawberry rejects an
    explicit null for ``Maybe[T]`` before the resolver runs.
    """
    return maybe.value if maybe is not None else None
