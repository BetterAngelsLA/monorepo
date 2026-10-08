"""Permission gates — the refusal edge of the authorization system.

Selectors *answer* (``common.permissions.selectors``); these helpers *refuse*:
the strawberry auth class, the canonical ``PermissionDenied`` messages, the
mutation fetch-through gate, and org-id resolution for payload/filter orgs.
One message per refusal shape, so every surface denies identically.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, TypeVar

import strawberry
from django.core.exceptions import PermissionDenied
from django.db.models import Model
from strawberry_django.auth.utils import get_current_user

from common.errors import UnauthenticatedGQLError
from common.utils import get_or_none

if TYPE_CHECKING:
    from django.db.models import QuerySet
    from organizations.models import Organization


class IsAuthenticated(strawberry.BasePermission):
    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            raise UnauthenticatedGQLError()

        return True


#: The standard refusal for org-scoped authority checks — one string, so every
#: refusal reads the same.
PERMISSION_DENIED_MESSAGE = "You do not have permission to perform this action in this organization."


def org_or_none(org_id: object) -> "Organization | None":
    """Resolve an org id from client input, failing closed to ``None``.

    *org_id* is client input (payload field or filter), so it is validated the
    way selectors validate pks: a missing one (``None``/``UNSET``) and an id the
    column cannot hold (``""``, a UUID string) resolve to ``None`` instead of
    reaching the DB as an unhandled ``ValueError`` — ``get_or_none`` is the
    house guard (``common.utils``).  The boolean companion of
    :func:`org_or_deny`, for callers that refuse in their own vocabulary (DRF).
    """
    from organizations.models import Organization

    if org_id is strawberry.UNSET:
        org_id = None
    return get_or_none(Organization.objects.all(), org_id)


def org_or_deny(org_id: object) -> "Organization":
    """Resolve an org id, denying anything unresolvable (ADR 0001 §5).

    The one guard for payload/filter orgs — resolvers and services alike; one
    message, one failure mode, no alias between them.
    """
    org = org_or_none(org_id)
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


def require_can(user: Any, perm: str, *, org: Any) -> None:
    """PermissionDenied unless *user* can exercise *perm* at *org* (ADR 0001 §2.6).

    The create gate: creates carry an explicit target organization and are
    authorized by ``can`` — never by the read rule.  ``can`` never implies the
    organization exists (finding F7), so callers that take an org from client
    input must resolve it first (:func:`org_or_deny`).
    """
    from common.permissions.selectors import can

    if not can(user, perm, org=org):
        raise PermissionDenied(PERMISSION_DENIED_MESSAGE)


T = TypeVar("T", bound=Model)


def get_writable_or_deny(
    qs: "QuerySet[T]",
    pk: Any,
    user: Any,
    perm: str,
    *,
    message: str = PERMISSION_DENIED_MESSAGE,
) -> "T":
    """Fetch a write target through the write-scoped filter, or deny.

    The canonical mutation gate (RFC 0002 §Precondition): the fetch *is* the
    authorization check — a forbidden row is unfetchable, and the missing-row
    and forbidden-row refusals share one message (no existence oracle).
    Fetch through this, never from the raw manager and never fetch-then-check
    (which invites forgetting the check); ``writable``/``can_obj`` stay the
    primitives for non-pk shapes (related-row exists, object-in-hand checks).
    """
    from common.permissions.selectors import writable

    obj = get_or_none(writable(qs, user, perm), pk)
    if obj is None:
        raise PermissionDenied(message)
    return obj
