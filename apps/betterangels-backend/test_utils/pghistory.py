"""Test-only helpers for pghistory event tables."""

from typing import Any

import pgtrigger
from django.db.models import QuerySet


def backdate_event_rows(queryset: QuerySet, **fields: Any) -> int:
    """``UPDATE`` pghistory event rows, bypassing the ``append_only`` guard.

    Event rows are append-only in production (ADR 0004 §10), so a test that pins
    a historical ``pgh_created_at`` cannot update them directly -- the
    ``Protect`` trigger raises. This is the one sanctioned way to backdate.

    Test-only. ``pgtrigger.ignore`` flushes with ``set_config(..., false)``
    (session-scoped), which must never appear on a request path -- see the
    "RDS Proxy interaction" note in ADR 0004 §10.

    The ``append_only`` trigger is ignored *by name*, never with a bare
    ``pgtrigger.ignore()``: ignoring every trigger would also suppress the
    event-*creation* triggers, letting a fixture write no events while still
    looking like it did.
    """
    model = queryset.model
    trigger_names = {trigger.name for trigger in getattr(model._meta, "triggers", [])}
    assert "append_only" in trigger_names, (
        f"{model._meta.label} has no append_only trigger; backdate_event_rows would "
        "silently mutate an unprotected table"
    )

    with pgtrigger.ignore(f"{model._meta.label}:append_only"):
        return queryset.update(**fields)
