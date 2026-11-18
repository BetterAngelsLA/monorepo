"""The client-version header must survive the browser's CORS preflight.

Adding a custom request header turns every cross-origin call into a non-simple
request. In production the SPA and the API are different origins, so if the
header is missing from ``CORS_ALLOW_HEADERS`` the browser rejects the preflight
and *every* API call fails — the app is dead, not merely untagged.

This is easy to miss locally because the dev server proxies the API on the same
origin, so no preflight is issued there.
"""

from __future__ import annotations

from django.conf import settings
from django.test import Client, override_settings

from common.constants import CLIENT_VERSION_HEADER

ALLOWED_HEADER = CLIENT_VERSION_HEADER.lower()
DEPLOY_ORIGIN = "https://outreach.prod.betterangels.la"
OTHER_ORIGIN = "https://evil.example.com"


def test_header_is_listed_in_cors_settings() -> None:
    assert ALLOWED_HEADER in {h.lower() for h in settings.CORS_ALLOW_HEADERS}


@override_settings(CORS_ALLOW_ALL_ORIGINS=False, CORS_ALLOWED_ORIGINS=[DEPLOY_ORIGIN])
def test_preflight_advertises_the_client_version_header() -> None:
    response = Client().options(
        "/graphql",
        HTTP_ORIGIN=DEPLOY_ORIGIN,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS=f"{CLIENT_VERSION_HEADER}, content-type",
    )

    allowed = response.headers.get("access-control-allow-headers", "")

    assert ALLOWED_HEADER in allowed.lower()


@override_settings(CORS_ALLOW_ALL_ORIGINS=False, CORS_ALLOWED_ORIGINS=[DEPLOY_ORIGIN])
def test_allowed_origin_is_echoed() -> None:
    """The positive control: a plain call from the deploy origin carries CORS."""

    response = Client().get("/graphql", headers={"origin": DEPLOY_ORIGIN})

    assert response.headers.get("access-control-allow-origin") == DEPLOY_ORIGIN


@override_settings(CORS_ALLOW_ALL_ORIGINS=False, CORS_ALLOWED_ORIGINS=[DEPLOY_ORIGIN])
def test_unlisted_origin_gets_no_cors_grant() -> None:
    """And the negative control.

    Worth pinning explicitly: django-cors-headers never rejects the request
    itself, it only withholds the grant header, so an assertion on the status
    code would pass no matter how CORS were configured.
    """

    response = Client().get("/graphql", headers={"origin": OTHER_ORIGIN})

    assert "access-control-allow-origin" not in response.headers
