"""Freezes the acting user's identity into the pghistory context.

``pghistory`` records the request ``user`` as a live FK, so renaming or deleting
a user would rewrite or null out their history. Snapshotting the acting user's
name/email into the context metadata at write time keeps the audit trail stable
(ADR 0004 §8).
"""

from typing import Any

import pghistory.middleware
from django.http import HttpRequest


class HistoryMiddleware(pghistory.middleware.HistoryMiddleware):
    """Adds the acting user's frozen name/email to the pghistory context."""

    def get_context(self, request: HttpRequest) -> dict[str, Any]:
        ctx = super().get_context(request)
        user = getattr(request, "user", None)
        if getattr(user, "is_authenticated", False):
            # ``User`` extends ``AbstractBaseUser``, so there is no
            # ``get_full_name()``; ``full_name`` is a model property.
            ctx["user_name"] = user.full_name
            ctx["user_email"] = user.email or ""
        return ctx
