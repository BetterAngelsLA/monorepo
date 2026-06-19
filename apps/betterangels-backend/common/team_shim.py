"""TEMPORARY SHIM — REMOVE AFTER ``SelahTeamEnum`` DEPRECATION WINDOW.

Resolves deprecated ``SelahTeamEnum`` references to ``teams.Team`` FKs
for note/task mutations.  Once all clients have migrated to ``teamId`` /
``currentTeam``, delete this entire module and the deprecated ``team``
fields on ``NoteType`` / ``TaskType``.
"""

from typing import Any

import strawberry
from teams.models import Team


def maybe_value(maybe: Any) -> Any:
    """Extract the value from a Strawberry ``Maybe[T]``, or ``None`` if UNSET/null."""
    if maybe is strawberry.UNSET or maybe is None:
        return None
    return maybe


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
