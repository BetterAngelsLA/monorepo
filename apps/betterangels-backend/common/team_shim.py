"""TEMPORARY SHIM — REMOVE WITH THE ``old_team`` COLUMNS.

The deprecated ``team`` enum inputs are gone from the API, so this no longer
resolves slugs; it only unwraps Strawberry's ``Maybe[ID]`` for ``team_id``.
``resolve_team_id`` keeps its slug argument for the database-level migration
that still reads ``old_team``.  Delete the module once that lands.
"""

from typing import Any, Protocol

import strawberry
from strawberry import ID, Maybe

from teams.models import Team


class HasTeamFields(Protocol):
    """Structural protocol matching any Strawberry mutation input carrying
    the ``team_id`` FK field."""

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
    """TEMPORARY: Resolve the team FK from a Strawberry mutation input.

    Unwraps ``Maybe[ID]`` for ``team_id``.

    Usage in mutations::

        team_id = resolve_team_id_from_input(data, organization_id=org_id)
    """
    team_id: int | None = None

    if (raw_team_id := maybe_value(data.team_id)) is not None:
        team_id = int(raw_team_id.value) if raw_team_id.value is not None else None  # type: ignore[union-attr]

    return resolve_team_id(team_id=team_id, organization_id=organization_id)


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
