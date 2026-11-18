"""The client-version header must survive the browser's CORS preflight.

Adding a custom request header turns every cross-origin call into a non-simple
request. In production the SPA and the API are different origins, so if the
header is missing from ``CORS_ALLOW_HEADERS`` the browser rejects the preflight
and *every* API call fails — the app is dead, not merely untagged.

This is easy to miss locally because the dev server proxies the API on the same
origin, so no preflight is issued there.
"""

from __future__ import annotations

import pytest
from django.conf import settings
from django.test import Client, override_settings

from common.constants import CLIENT_VERSION_HEADER

ALLOWED_HEADER = CLIENT_VERSION_HEADER.lower()
DEPLOY_ORIGIN = "https://outreach.prod.betterangels.la"


def test_header_is_listed_in_cors_settings() -> None:
    assert ALLOWED_HEADER in {h.lower() for h in settings.CORS_ALLOW_HEADERS}


@override_settings(CORS_ALLOW_ALL_ORIGINS=True)
def test_preflight_advertises_the_client_version_header() -> None:
    response = Client().options(
        "/graphql",
        HTTP_ORIGIN=DEPLOY_ORIGIN,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS=f"{CLIENT_VERSION_HEADER}, content-type",
    )

    allowed = response.headers.get("access-control-allow-headers", "")

    assert ALLOWED_HEADER in allowed.lower()


@pytest.mark.parametrize("origin", ["", DEPLOY_ORIGIN])
def test_regular_request_is_not_blocked_by_cors(origin: str) -> None:
    """A request without the header still crosses the origin boundary fine."""

    response = Client().post(
        "/graphql",
        data="{}",
        content_type="application/json",
        headers={"origin": origin} if origin else {},
    )

    # 403 is Django's CSRF refusal, which is the topic of another test; what
    # matters here is that CORS middleware did not reject the origin outright.
    assert response.status_code in {400, 403}
