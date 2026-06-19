"""TEMPORARY SHIM — REMOVE AFTER ``SelahTeamEnum`` DEPRECATION WINDOW.

Resolves deprecated ``SelahTeamEnum`` references to ``teams.Team`` FKs
for note/task mutations.  Once all clients have migrated to ``teamId`` /
``currentTeam``, delete this entire module and the deprecated ``team``
fields on ``NoteType`` / ``TaskType``.
"""

from typing import Any

import strawberry
from common.enums import SelahTeamEnum
from teams.models import Team


def maybe_value(maybe: Any) -> Any:
    """Extract the value from a Strawberry ``Maybe[T]``, or ``None`` if UNSET/null."""
    if maybe is strawberry.UNSET or maybe is None:
        return None
    return maybe


def _normalize_slug(team: str | SelahTeamEnum) -> str:
    """TEMPORARY: Convert a ``SelahTeamEnum`` or string to a Team slug.

    Remove once the deprecated ``team`` field is dropped from the schema.

    Strings are first tried as enum member names (e.g. ``"WDI_ON_SITE"``),
    then as enum values (e.g. ``"wdi_on_site"``).  If neither matches the
    string is returned unchanged (allowing custom slugs).
    """
    if isinstance(team, SelahTeamEnum):
        return team.value
    # Try as enum member name, then as enum value
    try:
        return SelahTeamEnum[team].value
    except KeyError:
        pass
    try:
        return SelahTeamEnum(team).value
    except ValueError:
        pass
    return team


def resolve_team_id(
    team: str | SelahTeamEnum | None = None,
    team_id: int | None = None,
    *,
    organization_id: int,
) -> int | None:
    """TEMPORARY: Resolve a team reference to a Team FK, preferring *team_id*.

    Remove when the deprecated ``team`` field is dropped.
    """
    if team_id is not None:
        return team_id
    if team is None:
        return None

    slug = _normalize_slug(team)
    try:
        return Team.objects.get(slug=slug, organization_id=organization_id).pk
    except Team.DoesNotExist:
        return None
