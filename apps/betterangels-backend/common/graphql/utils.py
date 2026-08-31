from typing import Any, TypeVar

from common.utils import can_match
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

    ``pk`` comes from a GraphQL ``ID`` and may be any string. One the primary key
    cannot hold names no row, so it is refused the same way a missing row is,
    rather than being allowed to raise from inside the query.
    """
    if not can_match(field=qs.model._meta.pk, value=pk):
        raise PermissionDenied(error_message)

    try:
        return qs.get(pk=pk)
    except ObjectDoesNotExist as exc:
        raise PermissionDenied(error_message) from exc
