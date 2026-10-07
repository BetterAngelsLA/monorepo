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
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Callable

if TYPE_CHECKING:
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
