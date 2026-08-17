"""Tests for the GraphQL resolver helpers."""

from typing import Any

import strawberry
from common.graphql.utils import apply_maybe
from django.test import SimpleTestCase


class ApplyMaybeTestCase(SimpleTestCase):
    """UNSET means "leave it alone"; a value sets it; null clears it."""

    def test_unset_removes_the_key_entirely(self) -> None:
        data: dict[str, Any] = {"team_id": "wrapped", "summary": "unchanged"}

        apply_maybe(data, "team_id", strawberry.UNSET)

        # Absence is what the services test with `"team_id" in data`.
        self.assertNotIn("team_id", data)
        self.assertEqual(data["summary"], "unchanged")

    def test_unset_leaves_an_absent_key_absent(self) -> None:
        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", strawberry.UNSET)

        self.assertEqual(data, {})

    def test_null_sets_the_key_to_none(self) -> None:
        data: dict[str, Any] = {"team_id": "wrapped"}

        apply_maybe(data, "team_id", None)

        # Present-and-None is "clear it", distinct from absent.
        self.assertIn("team_id", data)
        self.assertIsNone(data["team_id"])

    def test_value_is_passed_through_the_converter(self) -> None:
        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", "7", convert=int)

        self.assertEqual(data["team_id"], 7)

    def test_default_converter_unwraps_a_plain_value(self) -> None:
        data: dict[str, Any] = {}

        apply_maybe(data, "summary", "hello")

        self.assertEqual(data["summary"], "hello")
