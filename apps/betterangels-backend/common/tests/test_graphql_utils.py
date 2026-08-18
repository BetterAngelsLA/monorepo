"""Tests for the GraphQL resolver helpers and for Strawberry's ``Maybe`` handling.

The ``Some`` / absent values here are what Strawberry actually hands a resolver:
a ``Maybe[T]`` field is ``None`` when omitted and ``Some(value)`` when sent, and
a field declared ``= strawberry.UNSET`` is ``UNSET`` when omitted instead.
``Maybe[T | None]`` adds ``Some(None)`` for explicit null.
"""

from typing import Any, Optional

import strawberry
from common.graphql.utils import maybe_int_value
from django.test import SimpleTestCase
from strawberry import ID, Maybe
from strawberry.types.maybe import Some


@strawberry.input
class TeamRefInput:
    """Mirrors the shape of the note/task update inputs."""

    id: ID
    summary: Optional[str] = strawberry.UNSET
    team_id: Maybe[ID]
    # A clearable FK has to say ``| None``; a bare ``Maybe[ID]`` rejects an
    # explicit null at validation. That is why ``teamId`` cannot currently be
    # cleared through the API (#2316) — the annotation is the only place that
    # decision is recorded, since both spellings emit identical SDL.
    clearable_id: Maybe[ID | None]


class AsdictMaybeTestCase(SimpleTestCase):
    """``strawberry.asdict`` resolves the tri-state, and the update mutations rely on it.

    ``update_note`` and ``update_task`` pass ``asdict(data)`` straight to their
    services, which ``setattr`` whatever keys they find.  That is only correct
    because absent fields do not appear in the dict at all.  An earlier version
    unwrapped ``team_id`` by hand and assigned the result unconditionally, which
    turned "not mentioned" into "set to null" and silently cleared the team on
    any unrelated update.
    """

    def test_absent_maybe_is_omitted_entirely(self) -> None:
        self.assertNotIn("team_id", strawberry.asdict(TeamRefInput(id=ID("1"), team_id=None, clearable_id=None)))

    def test_absent_unset_is_omitted_entirely(self) -> None:
        self.assertNotIn("summary", strawberry.asdict(TeamRefInput(id=ID("1"), team_id=None, clearable_id=None)))

    def test_provided_value_is_unwrapped(self) -> None:
        data: dict[str, Any] = strawberry.asdict(TeamRefInput(id=ID("1"), team_id=Some(ID("7")), clearable_id=None))

        self.assertEqual(data["team_id"], "7")

    def test_explicit_null_is_kept_as_none(self) -> None:
        """Only reachable on a ``Maybe[T | None]`` field — see ``clearable_id``."""
        data: dict[str, Any] = strawberry.asdict(TeamRefInput(id=ID("1"), team_id=None, clearable_id=Some(None)))

        self.assertIn("clearable_id", data)
        self.assertIsNone(data["clearable_id"])


class MaybeIntValueTestCase(SimpleTestCase):
    """Regression: this must unwrap ``Some``, not hand it back.

    Returning the wrapper is silent at the call site and explodes downstream —
    ``updateTeam`` once passed an unwrapped result into ``team_update``, which
    called ``.strip()`` on it, so renaming a team failed with
    ``'Some' object has no attribute 'strip'``.

    It collapses absent and explicit null into ``None``, which suits its two
    callers: both pass the result on as a keyword argument and treat the two the
    same. Callers building an update dict should let ``asdict`` do it instead —
    see :class:`AsdictMaybeTestCase`.
    """

    def test_unwraps_and_casts_some(self) -> None:
        self.assertEqual(maybe_int_value(Some("7")), 7)

    def test_absent_none_is_none(self) -> None:
        """A bare ``Maybe[T]`` field is ``None`` when omitted."""
        self.assertIsNone(maybe_int_value(None))

    def test_absent_unset_is_none(self) -> None:
        """A field declared ``= strawberry.UNSET`` is ``UNSET`` when omitted."""
        self.assertIsNone(maybe_int_value(strawberry.UNSET))

    def test_explicit_null_is_none(self) -> None:
        """Reachable once a field is annotated ``Maybe[T | None]`` — see #2316."""
        self.assertIsNone(maybe_int_value(Some(None)))
