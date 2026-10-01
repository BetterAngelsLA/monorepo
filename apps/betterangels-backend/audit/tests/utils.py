"""Shared helpers for audit tests."""

from contextlib import contextmanager
from typing import Any, Iterator

import pghistory
from accounts.models import User
from django.db import connection


@contextmanager
def audit_context(user: User | None = None, label: str | None = None, **extra: Any) -> Iterator[None]:
    """Run writes under an explicit pghistory context (the middleware's analogue)."""
    metadata: dict[str, Any] = {}
    if user is not None:
        metadata.update(user=user.pk, user_name=user.full_name, user_email=user.email or "")
    if label is not None:
        metadata["label"] = label
    metadata.update(extra)
    with pghistory.context(**metadata):
        yield


def clear_history_context() -> None:
    """Drop the transaction-local pghistory context a prior ``context()`` left set.

    ``_inject_history_context`` uses ``set_config(..., is_local=true)``, so within
    Django's per-test transaction the setting survives the ``with`` block unless
    explicitly cleared — leaving context-less writes indistinguishable from the
    previous context's.
    """
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('pghistory.context_id', '', true)")
