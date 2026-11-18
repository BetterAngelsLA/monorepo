"""Bind the client's build identity onto every log line for a request.

A web deploy reaches an open tab only when that tab reloads, so at any moment
some clients are running a bundle from weeks ago. Request logs carried
``user_agent`` and ``user_id`` — both identical across every revision — which
left reports like "the browser version shows a blank screen" impossible to
attribute to a build after the fact (BACS-128).

The value arrives as ``X-Client-Version``, set by the app's fetch client from
its build id. It is bound as a structlog contextvar rather than added to one
event's kwargs so that it appears on ``request_started``, ``request_finished``
and every other line emitted while the request is in flight.
"""

from __future__ import annotations

import structlog
from django.dispatch import receiver
from django_structlog import signals

from common.constants import CLIENT_VERSION_HEADER, CLIENT_VERSION_LOG_KEY

#: Long enough for ``<sha>+ota:<id>`` with room to spare, short enough that a
#: hand-crafted header cannot bloat a log line.
MAX_CLIENT_VERSION_LENGTH = 64


def _clean(value: str) -> str:
    """Strip control characters so a header cannot forge log structure."""

    return "".join(ch for ch in value if ch.isprintable()).strip()


@receiver(signals.bind_extra_request_metadata)
def bind_client_version(request, logger, log_kwargs, **kwargs) -> None:
    raw = request.headers.get(CLIENT_VERSION_HEADER)

    if not raw:
        return

    version = _clean(raw)[:MAX_CLIENT_VERSION_LENGTH]

    if version:
        structlog.contextvars.bind_contextvars(**{CLIENT_VERSION_LOG_KEY: version})
