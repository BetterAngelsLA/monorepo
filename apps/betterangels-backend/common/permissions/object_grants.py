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

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from django.db.models import Model


def object_grant_whitelist() -> tuple[type["Model"], ...]:
    """Resolve the whitelist lazily (avoids app-registry cycles at import).

    First consumer: per-record client sharing (ADR §5.1, option 2).  ``Note``
    joins once the notes cutover ships its OrgScoped declaration + guardian
    teardown (ADR §5) — the whitelist is deliberate, not automatic.
    """
    from clients.models import ClientProfile

    return (ClientProfile,)
