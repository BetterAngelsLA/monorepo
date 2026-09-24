"""Object-grant whitelist (ADR 0001 §2.5).

Only models listed here may be the target of an object grant
(``Grant.scope_object_type`` / ``scope_object_id``).  ``permissions.E003`` flags
any object grant on a model outside this list.

Rules from the ADR:

* ``Organization`` and org-bearing models are excluded by default — an object
  grant on a row that already has an org would create a second path to the same
  authority (findings F5, F16).
* An org-bearing model may still be added here when it is the *explicit sharing
  consumer*: a row whose edit/delete authority is deliberately per-record
  rather than org-scoped.  ``Note`` is that case (ADR §5 — shared/foreign notes
  get per-record edit control via the object arm, not guardian rows).
* ``ClientProfile`` is platform-shared (``org_via = None``) — per-record object
  grants are how cross-org client edit/delete becomes expressible (ADR §5.1,
  option 2: "no new column; ownership lives in the grant").
"""

import waffle

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db.models import Model

OBJECT_GRANTS_SWITCH = "object_grants_enabled"
"""Waffle switch gating the whole object-grant feature (ADR 0001 §2.5).

The switch is the single control for the object arm: ``object_grant_whitelist``
returns nothing while it is off, which makes every consumer fail closed at once
— reads via ``_object_grant_q``, writes via ``grant_obj``, the orphan-cleanup
signal, and ``permissions.E003``.  It is off by default until a domain cutover
deliberately enables it.  A switch-gated whitelist (not a code constant) is the
right shape for an authorization feature because it keeps the read and write
sides consistent: the arm can never be half-on (grants mintable but not
honored), and a mis-flip fails closed instead of reviving grants written while
the feature was off.
"""


def object_grants_enabled() -> bool:
    """Runtime check: object grants may be written and honored only when the switch is active."""
    return waffle.switch_is_active(OBJECT_GRANTS_SWITCH)


def object_grantable_models() -> tuple[type["Model"], ...]:
    """Models that MAY carry an object grant once enabled (ADR 0001 §2.5).

    Static and switch-independent: signal wiring in ``AppConfig.ready`` uses
    this so the orphan-cleanup handler stays connected even when the switch is
    flipped on after startup (the handler itself is runtime-gated).  The list
    is deliberate, not automatic — a model joins only at its own cutover
    (``Note`` at the notes cutover; ``ClientProfile`` at the clients cutover).
    """
    from clients.models import ClientProfile

    return (ClientProfile,)


def object_grant_whitelist() -> tuple[type["Model"], ...]:
    """The currently object-grantable models — empty while the feature is off.

    The single choke point every object-grant consumer consults.  While it is
    empty: reads fail closed, ``grant_obj`` refuses to mint grants, the orphan
    cleanup handler returns before issuing SQL, and ``permissions.E003`` flags
    any leftover object-grant row.  Turning the switch on is therefore the only
    way the arm becomes live — and it cannot revive stale authority, because no
    grant can be written while the feature is off.
    """
    if not object_grants_enabled():
        return ()
    return object_grantable_models()
