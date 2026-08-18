"""Strawberry ``Maybe`` unwrapping for team references.

Named a shim because it began as one: it translated the deprecated
``SelahTeamEnum`` ``team`` input into a ``teams.Team`` FK.  That input is gone
from the API, so nothing here resolves slugs any more — what remains unwraps
``Maybe[ID]`` into the ``int | None`` the note/task services expect.

Both remaining helpers are superseded by ``common.graphql.utils`` and this
module is deleted once its callers migrate.
"""

from typing import Any, Protocol

import strawberry
from strawberry import ID, Maybe


class HasTeamFields(Protocol):
    """Structural protocol matching any Strawberry mutation input carrying
    the ``team_id`` FK field."""

    team_id: Maybe[ID]


def maybe_value(maybe: Any) -> Any:
    """Extract the value from a Strawberry ``Maybe[T]``, or ``None`` if UNSET/null."""
    if maybe is strawberry.UNSET or maybe is None:
        return None
    return maybe


def resolve_team_id_from_input(data: HasTeamFields) -> int | None:
    """Unwrap ``team_id`` from a Strawberry mutation input.

    Returns ``None`` when the field was omitted *and* when it was explicitly
    set to null — callers that need to tell those apart should read
    ``data.team_id`` directly.

    Usage in mutations::

        team_id = resolve_team_id_from_input(data)
    """
    if (raw_team_id := maybe_value(data.team_id)) is None:
        return None

    return int(raw_team_id.value) if raw_team_id.value is not None else None  # type: ignore[union-attr]
