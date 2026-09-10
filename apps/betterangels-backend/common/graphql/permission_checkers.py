"""Grant-model checkers for strawberry-django permission extensions.

The clients cutover (ADR 0001 §5.1, RFC 0002) keeps its declarative fields —
payload types, pagination args, and the permission directives all stay — and
swaps only the predicate behind them: from guardian/legacy ``has_perm`` to the
grant model.  Strawberry's permission extensions accept a ``perm_checker``
factory, called once per resolution with ``(info, user)``.

**Why ``HasPerm`` (global target) and not ``HasRetvalPerm`` (retval target):**
strawberry-django pre-filters the base queryset of every *retval-target*
extension through guardian's ``filter_for_user`` (``permissions.py``
``filter_with_perms``) before resolution — a second, hardcoded predicate no
checker can replace, which silently empties results for grant-only users (and
for superusers, since guardian excludes them by default).  The client family is
SHARED-tier (RFC 0002): its authority is row-*invariant* — read ``VIEW``,
write ``CHANGE``/``DELETE`` = "holds the permission anywhere" — so the check
belongs before resolution, where ``HasPerm`` runs it with no queryset filter.
A future org- or object-tier model needs per-row enforcement and cannot ride
this checker; it must scope its queryset explicitly (``visible()``) and check
the row (``can_obj``) in the resolver.

``visible_rows_for_holder`` is the list-resolver sibling: the same
``can_anywhere`` predicate, answering empty-not-error instead of refusing, for
type-level ``get_queryset`` hooks on SHARED-tier list fields.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Callable, cast

from strawberry_django.auth.utils import get_current_user

if TYPE_CHECKING:
    from accounts.models import User
    from django.db.models import QuerySet
    from strawberry.types import Info
    from strawberry_django.permissions import PermDefinition


def can_anywhere_checker(info: "Info", user: Any) -> "Callable[[PermDefinition], bool]":
    """``perm_checker`` — holds the permission anywhere (grant model).

    The SHARED-tier authority rule: creates, reads, and row-invariant writes
    all evaluate ``can_anywhere`` — the same predicate the grant checkers use
    on the row itself, hoisted to resolution time because the tier makes the
    row irrelevant.
    """
    from common.permissions.selectors import can_anywhere

    return lambda definition: can_anywhere(user, definition.perm)


def visible_rows_for_holder(queryset: QuerySet, info: Info, *, perm: str, cache_key: str) -> QuerySet:
    """List-read gate for SHARED-tier list resolvers (ADR 0001 §5, RFC 0002/0003).

    Empty-not-error shape: a holder sees every row, a non-holder sees none —
    the shape the legacy per-row guardian filter produced, kept for parity
    (single-row reads and mutations refuse instead).  The holder check is
    memoized per request on the user instance (the house pattern —
    ``invalidate_scope_cache`` drops it with the other authority memos), so
    nested lists of the same type cost one check, not one each.  Anonymous
    requests never reach here (``IsAuthenticated`` on the fields) but fail
    closed anyway.
    """
    from common.permissions.selectors import can_anywhere

    current = get_current_user(info)
    if current is None or not getattr(current, "is_authenticated", False):
        return queryset.none()

    user = cast("User", current)
    cache: dict[str, bool] = user.__dict__.setdefault(cache_key, {})
    if perm not in cache:
        cache[perm] = can_anywhere(user, perm)
    return queryset if cache[perm] else queryset.none()
