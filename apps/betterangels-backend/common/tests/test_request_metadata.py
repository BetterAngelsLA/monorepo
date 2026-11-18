"""The client build id must reach the request logs.

A web deploy only reaches an open tab when that tab reloads, so at any given
moment some clients are weeks behind. Without this field a support report
("the browser version shows a blank screen") cannot be tied to a build — the
user agent is identical across every revision.
"""

from typing import Any

import pytest
import structlog
from django.test import RequestFactory

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
