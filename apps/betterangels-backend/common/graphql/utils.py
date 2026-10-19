from typing import TYPE_CHECKING, Any, TypeVar

from django.core.exceptions import PermissionDenied
from django.db.models import Model, QuerySet

from common.utils import get_or_none

if TYPE_CHECKING:
    from organizations.models import Organization

T = TypeVar("T", bound=Model)

#: The refusal every org-scoped surface uses, so an unknown org and an unauthorized one
#: read identically to the caller.
ORG_PERMISSION_DENIED_MESSAGE = "You do not have access to this organization."


def org_or_deny(org_id: object) -> "Organization":
    """Resolve a client-supplied organization id, failing closed.

    A missing, unknown, or malformed id (``""``, a UUID string, ``None``) is a permission
    problem — ``PermissionDenied`` — never a ``DoesNotExist`` crash or a ``ValueError``.
    ``get_or_none`` is the house guard for exactly that (``common.utils``).

    **Existence only.** It deliberately does not check authority: callers pair it with
    ``require_can``/``can`` at the resolved org (ADR 0001 §2.6, finding F7 — ``can`` never
    implies the organization exists, so the two checks are separate and both required).

    Lives here so the four org-scoped schema modules (``accounts``, ``reports``,
    ``regions``, ``teams``) share one refusal instead of four that can drift apart.
    Module-level rather than a method: strawberry-django resolvers are invoked unbound.
    """
    from organizations.models import Organization

    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied(ORG_PERMISSION_DENIED_MESSAGE)
    return org


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
    obj = get_or_none(qs, pk)

    if obj is None:
        raise PermissionDenied(error_message)

    return obj
