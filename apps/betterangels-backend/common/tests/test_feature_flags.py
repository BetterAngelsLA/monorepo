"""Tests for the waffle-backed :func:`flag_is_active` helper."""

from types import SimpleNamespace
from typing import Any
from unittest.mock import patch

from accounts.models import User
from django.test import RequestFactory, TestCase
from model_bakery import baker
from waffle import get_waffle_flag_model

from common.services.feature_flags import flag_is_active


def _info_for(request: Any) -> Any:
    """Build a minimal stand-in for Strawberry ``Info`` with a request context."""
    return SimpleNamespace(context={"request": request})


class FlagIsActiveTestCase(TestCase):
    """``flag_is_active`` delegates to waffle and memoizes per request."""

    def setUp(self) -> None:
        self.factory = RequestFactory()

    def test_missing_flag_is_inactive(self) -> None:
        request = self.factory.get("/graphql")

        self.assertFalse(flag_is_active(_info_for(request), "ff_missing"))

    def test_active_flag_is_true(self) -> None:
        flag = get_waffle_flag_model().objects.create(name="ff_active", everyone=True)
        flag.flush()
        request = self.factory.get("/graphql")

        self.assertTrue(flag_is_active(_info_for(request), "ff_active"))

    def test_inactive_flag_is_false(self) -> None:
        flag = get_waffle_flag_model().objects.create(name="ff_inactive", everyone=False)
        flag.flush()
        request = self.factory.get("/graphql")

        self.assertFalse(flag_is_active(_info_for(request), "ff_inactive"))

    def test_memoizes_result_per_request(self) -> None:
        request = self.factory.get("/graphql")
        info = _info_for(request)

        with patch("common.services.feature_flags.waffle_flag_is_active", return_value=True) as mock_flag:
            self.assertTrue(flag_is_active(info, "ff_memo"))
            self.assertTrue(flag_is_active(info, "ff_memo"))

        mock_flag.assert_called_once()

    def test_does_not_memoize_across_requests(self) -> None:
        info_a = _info_for(self.factory.get("/graphql"))
        info_b = _info_for(self.factory.get("/graphql"))

        with patch("common.services.feature_flags.waffle_flag_is_active", return_value=False) as mock_flag:
            self.assertFalse(flag_is_active(info_a, "ff_memo"))
            self.assertFalse(flag_is_active(info_b, "ff_memo"))

        self.assertEqual(mock_flag.call_count, 2)

    def test_per_user_flag_active_for_member(self) -> None:
        user = baker.make(User)
        flag = get_waffle_flag_model().objects.create(name="ff_user_member", everyone=None)
        flag.users.add(user)  # type: ignore[attr-defined]
        flag.flush()

        request = self.factory.get("/graphql")
        request.user = user
        self.assertTrue(flag_is_active(_info_for(request), "ff_user_member"))

    def test_per_user_flag_inactive_for_non_member(self) -> None:
        member = baker.make(User)
        non_member = baker.make(User)
        flag = get_waffle_flag_model().objects.create(name="ff_user_non_member", everyone=None)
        flag.users.add(member)  # type: ignore[attr-defined]
        flag.flush()

        request = self.factory.get("/graphql")
        request.user = non_member
        self.assertFalse(flag_is_active(_info_for(request), "ff_user_non_member"))
