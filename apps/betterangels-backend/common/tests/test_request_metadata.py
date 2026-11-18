"""The client build id must reach the request logs.

A web deploy only reaches an open tab when that tab reloads, so at any given
moment some clients are weeks behind. Without this field a support report
("the browser version shows a blank screen") cannot be tied to a build — the
user agent is identical across every revision.
"""

from typing import Any

import pytest
import structlog
from django.conf import settings
from django.test import Client, RequestFactory
from django_structlog import signals

from common.constants import CLIENT_VERSION_HEADER
from common.request_metadata import MAX_CLIENT_VERSION_LENGTH, bind_client_version


@pytest.fixture(autouse=True)
def clear_structlog_context() -> None:
    structlog.contextvars.clear_contextvars()
    yield
    structlog.contextvars.clear_contextvars()


def _bind(header: str | None) -> dict[str, Any]:
    request = RequestFactory().get(
        "/graphql",
        **({"HTTP_X_CLIENT_VERSION": header} if header is not None else {}),
    )

    bind_client_version(request=request, logger=None, log_kwargs={})

    return structlog.contextvars.get_contextvars()


def test_binds_the_header_onto_the_context() -> None:
    # A contextvar rather than one event's kwargs, so `request_finished` and any
    # log emitted mid-request carry it too.
    assert _bind("abc123").get("client_version") == "abc123"


@pytest.mark.parametrize("header", [None, "", "   "])
def test_binds_nothing_when_the_header_is_absent(header: str | None) -> None:
    assert "client_version" not in _bind(header)


def test_strips_control_characters() -> None:
    # A header is attacker-controlled and lands in a line-oriented log sink.
    assert _bind("abc\n123\t")["client_version"] == "abc123"


def test_truncates_to_the_documented_limit() -> None:
    assert len(_bind("a" * 500)["client_version"]) == MAX_CLIENT_VERSION_LENGTH


def test_receiver_is_connected_to_the_request_signals() -> None:
    """A unit test of the callable would pass even if nothing ever called it.

    The failure mode this guards is an unwired receiver: `CommonConfig.ready()`
    losing the import, which silently returns every log line to having no build
    id.
    """
    live = signals.bind_extra_request_metadata._live_receivers(None)  # noqa: SLF001
    # Django returns `(receivers, senders)`; the first half is what matters here.
    receivers = live[0] if isinstance(live, tuple) else live

    assert bind_client_version in receivers


def test_request_logging_middleware_is_installed() -> None:
    """The other half of the wiring: without it no request lifecycle is logged."""

    assert "django_structlog.middlewares.RequestMiddleware" in settings.MIDDLEWARE


def test_the_middleware_binds_it_during_a_real_request() -> None:
    """End of the chain, exercised through the actual middleware.

    The tests above call the receiver directly, which proves what it does but not
    that a request ever reaches it. This drives a request through
    `RequestMiddleware` and reads the structlog context at `request_finished` —
    exactly the point where the log line is rendered — so an unwired receiver or
    a missing middleware fails here.

    At `bind_extra_request_finished_metadata`, not the log call: the signal is
    emitted regardless of the logger's level, while the log line is filtered by
    it — and in tests the level is not the production one.
    """
    seen: dict[str, Any] = {}

    def probe(sender: Any = None, **kwargs: Any) -> None:
        seen.update(structlog.contextvars.get_contextvars())

    signals.bind_extra_request_finished_metadata.connect(probe)
    try:
        Client().get("/graphql", headers={CLIENT_VERSION_HEADER: "abc123"})
    finally:
        signals.bind_extra_request_finished_metadata.disconnect(probe)

    assert seen.get("client_version") == "abc123"
