"""TEMPORARY SHIM — REMOVE AFTER ``SelahTeamEnum`` DEPRECATION WINDOW.

Resolves deprecated ``SelahTeamEnum`` references to ``teams.Team`` FKs
for note/task mutations.  Once all clients have migrated to ``teamId`` /
``currentTeam``, delete this entire module and the deprecated ``team``
fields on ``NoteType`` / ``TaskType``.
"""

from typing import Any, Optional, Protocol

import strawberry
from strawberry import ID, Maybe

from common.enums import SelahTeamEnum
from teams.models import Team


class HasTeamFields(Protocol):
    """Structural protocol matching any Strawberry mutation input that carries
    the deprecated ``team`` enum and/or the new ``team_id`` FK field."""

    team: Optional[SelahTeamEnum]
    team_id: Maybe[ID]


def maybe_value(maybe: Any) -> Any:
    """Extract the value from a Strawberry ``Maybe[T]``, or ``None`` if UNSET/null."""
    if maybe is strawberry.UNSET or maybe is None:
        return None
    return maybe


def resolve_team_id_from_input(
    data: HasTeamFields,
    *,
    organization_id: int,
) -> int | None:
    """TEMPORARY: Resolve team from a Strawberry mutation input.

    Unwraps ``Maybe[T]`` for both the deprecated ``team`` enum and the new
    ``team_id`` field, then delegates to ``resolve_team_id``.

    Usage in mutations::

        team_id = resolve_team_id_from_input(data, organization_id=org_id)
    """
    team_slug: str | None = None
    team_id: int | None = None

    if (raw_team := maybe_value(data.team)) is not None:
        team_slug = raw_team.value  # type: ignore[union-attr]

    if (raw_team_id := maybe_value(data.team_id)) is not None:
        team_id = int(raw_team_id.value) if raw_team_id.value is not None else None  # type: ignore[union-attr]

    return resolve_team_id(team_slug=team_slug, team_id=team_id, organization_id=organization_id)


def resolve_team_id(
    team_slug: str | None = None,
    team_id: int | None = None,
    *,
    organization_id: int,
) -> int | None:
    """TEMPORARY: Resolve a team reference to a Team FK, preferring *team_id*.

    Callers should pass the slug extracted from the deprecated ``team`` enum's
    ``.value`` (e.g. ``"wdi_on_site"``).  Remove when the deprecated ``team``
    field is dropped from the schema.
    """
    if team_id is not None:
        return team_id
    if team_slug is None:
        return None

    try:
        return Team.objects.get(slug=team_slug, organization_id=organization_id).pk
    except Team.DoesNotExist:
        return None
