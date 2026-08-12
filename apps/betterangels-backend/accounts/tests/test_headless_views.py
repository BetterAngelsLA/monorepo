"""Tests for ``accounts.headless_views.AutoCreateRequestLoginCodeView``.

Login-by-code self-signup: when ``ACCOUNT_PREVENT_ENUMERATION=True`` the
headless form only resolves *active* users, so an existing-but-deactivated
account (e.g. disabled by a bulk script) leaves ``self.input._user = None``.
The view must reactivate that account (not attempt to create a duplicate,
which would 500 on the unique email constraint) and still send a real code.
"""

import json
from typing import Any
from unittest.mock import patch

import pytest
from allauth.account.models import EmailAddress
from django.test import Client

from accounts.adapters import AccountAdapter
from accounts.models import User

# App client endpoints are CSRF-exempt, so the Django test client can hit them
# directly with a JSON body.
LOGIN_CODE_REQUEST_URL = "/_allauth/app/v1/auth/code/request"


def _request_login_code(email: str) -> Any:
    return Client().post(
        LOGIN_CODE_REQUEST_URL,
        data=json.dumps({"email": email}),
        content_type="application/json",
    )


def _assert_login_code_request_succeeded(response: Any) -> None:
    """Headless returns 401 (unauthenticated) as the normal "code requested"
    signal; the point is that we don't 500 and no error payload is present."""
    assert response.status_code == 401
    payload = json.loads(response.content)
    assert "errors" not in payload
    assert payload["meta"]["is_authenticated"] is False


@pytest.mark.django_db
def test_request_login_code_reactivates_existing_inactive_user() -> None:
    """An existing-but-inactive account is reactivated and sent a real code,
    without creating a duplicate user row."""
    User.objects.create_user(
        email="sleeper@example.com",
        username="sleeper",
        is_active=False,
    )

    with patch.object(AccountAdapter, "send_mail") as mock_send_mail:
        response = _request_login_code("sleeper@example.com")

    _assert_login_code_request_succeeded(response)

    # Exactly one user row, and it is active afterward.
    assert User.objects.filter(email="sleeper@example.com").count() == 1
    user = User.objects.get(email="sleeper@example.com")
    assert user.is_active

    # A real login code was sent (not the enumeration-fake-success mail).
    mock_send_mail.assert_called_once()
    template_prefix, recipient, context = mock_send_mail.call_args.args
    assert template_prefix == "account/email/login_code"
    assert recipient == "sleeper@example.com"
    assert context["code"]


@pytest.mark.django_db
def test_request_login_code_creates_new_user() -> None:
    """A brand-new email still auto-provisions an active user with an unusable
    password and an unverified EmailAddress."""
    with patch.object(AccountAdapter, "send_mail") as mock_send_mail:
        response = _request_login_code("brandnew@example.com")

    _assert_login_code_request_succeeded(response)

    assert User.objects.filter(email="brandnew@example.com").count() == 1
    user = User.objects.get(email="brandnew@example.com")
    assert user.is_active
    assert not user.has_usable_password()

    email_address = EmailAddress.objects.get(user=user, email="brandnew@example.com")
    assert email_address.primary
    assert not email_address.verified

    mock_send_mail.assert_called_once()
    template_prefix, recipient, _ = mock_send_mail.call_args.args
    assert template_prefix == "account/email/login_code"
    assert recipient == "brandnew@example.com"
