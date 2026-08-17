"""Tests for the GraphQL resolver helpers.

The ``Some`` / absent values here are what Strawberry actually hands a
resolver: a ``Maybe[T]`` field is ``None`` when omitted and ``Some(value)``
when sent, and a field declared ``= strawberry.UNSET`` is ``UNSET`` when
omitted instead.  ``Maybe[T | None]`` adds ``Some(None)`` for explicit null.
"""

from typing import Any

import strawberry
from common.graphql.utils import apply_maybe
from django.test import SimpleTestCase
from strawberry.types.maybe import Some


class ApplyMaybeTestCase(SimpleTestCase):
    def test_absent_none_removes_the_key(self) -> None:
        """An idiomatic ``Maybe[T]`` field is None when omitted."""
        data: dict[str, Any] = {"team_id": "wrapped", "summary": "unchanged"}

        apply_maybe(data, "team_id", None)

        # Absence is what the services test with `"team_id" in data`.
        self.assertNotIn("team_id", data)
        self.assertEqual(data["summary"], "unchanged")

    def test_absent_none_does_not_clear_the_field(self) -> None:
        """Regression: reading absent as null makes updates wipe fields.

        Before the ``Maybe[ID] = strawberry.UNSET`` defaults were dropped, only
        UNSET counted as absent — so an omitted team on an idiomatic field
        would have been written as ``None`` and silently cleared the team.
        """
        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", None, int)

        self.assertEqual(data, {})

    def test_absent_unset_removes_the_key(self) -> None:
        """A field declared ``= strawberry.UNSET`` is UNSET when omitted."""
        data: dict[str, Any] = {"team_id": "wrapped"}

        apply_maybe(data, "team_id", strawberry.UNSET)

        self.assertNotIn("team_id", data)

    def test_some_value_is_unwrapped_and_converted(self) -> None:
        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", Some("7"), int)

        self.assertEqual(data["team_id"], 7)

    def test_some_none_clears_the_field(self) -> None:
        """``Some(None)`` is an explicit null on a ``Maybe[T | None]`` field."""
        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", Some(None), int)

        # Present-and-None means "clear it", distinct from absent.
        self.assertIn("team_id", data)
        self.assertIsNone(data["team_id"])

    def test_convert_is_not_called_for_an_explicit_null(self) -> None:
        def explode(value: Any) -> Any:
            raise AssertionError("convert must not run for Some(None)")

        data: dict[str, Any] = {}

        apply_maybe(data, "team_id", Some(None), explode)

        self.assertIsNone(data["team_id"])

    def test_default_convert_passes_the_value_through(self) -> None:
        data: dict[str, Any] = {}

        apply_maybe(data, "summary", Some("hello"))

        self.assertEqual(data["summary"], "hello")
