"""Tests for ``accounts.headless_views.AutoCreateRequestLoginCodeView``.

Login-by-code self-signup: when ``ACCOUNT_PREVENT_ENUMERATION=True`` the
headless form only resolves *active* users, so an existing-but-deactivated
account (e.g. disabled by a bulk script) leaves ``self.input._user = None``.
Brand-new emails are auto-provisioned; existing-but-inactive accounts are left
untouched (no 500, no duplicate, no email) so anonymous requests can't undo an
admin's deactivation.
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
def test_request_login_code_leaves_inactive_user_untouched() -> None:
    """An anonymous code request must not reactivate an existing-but-inactive
    account: no 500, no duplicate, no email, no state change."""
    user = User.objects.create_user(
        email="sleeper@example.com",
        username="sleeper",
        is_active=False,
    )

    with patch.object(AccountAdapter, "send_mail") as mock_send_mail:
        response = _request_login_code("sleeper@example.com")

    _assert_login_code_request_succeeded(response)

    # Exactly one user row, still inactive.
    assert User.objects.filter(email="sleeper@example.com").count() == 1
    user.refresh_from_db()
    assert not user.is_active

    # Enumeration-safe: no login code and no unknown-account mail is sent.
    mock_send_mail.assert_not_called()


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
