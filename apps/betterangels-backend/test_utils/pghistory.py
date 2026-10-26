"""Test-only helpers for pghistory event tables."""

from typing import Any

import pgtrigger
from django.db.models import QuerySet

# The trigger installed on every audit event model (see ``shelters/models``).
UPDATE_GUARD = "protect_updates"


def backdate_event_rows(queryset: QuerySet, **fields: Any) -> int:
    """``UPDATE`` pghistory event rows, bypassing the update guard.

    Event rows reject ``UPDATE`` in production so recorded history cannot be
    silently rewritten (ADR 0004 §9b). A test that pins a historical
    ``pgh_created_at`` therefore cannot update them directly -- the ``Protect``
    trigger raises. This is the one sanctioned way to backdate.

    ``DELETE`` is deliberately *not* guarded, so retention can be an ordinary
    batched delete (ADR 0004 §31).

    Test-only. ``pgtrigger.ignore`` flushes with ``set_config(..., false)``
    (session-scoped), which must never appear on a request path because it would
    leak GUC state into the next request on a persistent connection -- see the
    "Connection behavior" note in ADR 0004 §10.

    The guard is ignored *by name*, never with a bare ``pgtrigger.ignore()``:
    ignoring every trigger would also suppress the event-*creation* triggers,
    letting a fixture write no events while still looking like it did.
    """
    model = queryset.model
    trigger_names = {trigger.name for trigger in getattr(model._meta, "triggers", [])}
    assert UPDATE_GUARD in trigger_names, (
        f"{model._meta.label} has no {UPDATE_GUARD} trigger; backdate_event_rows would "
        "silently mutate an unguarded table"
    )

    with pgtrigger.ignore(f"{model._meta.label}:{UPDATE_GUARD}"):
        return queryset.update(**fields)
