"""Helper to resolve deprecated SelahTeamEnum → Team FK for note/task mutations."""

from common.enums import SelahTeamEnum
from teams.models import Team


def _normalize_slug(team: str | SelahTeamEnum) -> str:
    """Convert a ``SelahTeamEnum`` or string to a Team slug (the enum ``.value``).

    Strings are first tried as enum member names (e.g. ``"WDI_ON_SITE"``),
    then as enum values (e.g. ``"wdi_on_site"``).  If neither matches the
    string is returned unchanged (allowing custom slugs).
    """
    if isinstance(team, SelahTeamEnum):
        return team.value
    for converter in (lambda s: SelahTeamEnum[s], lambda s: SelahTeamEnum(s)):
        try:
            return converter(team).value
        except (KeyError, ValueError):
            pass
    return team


def resolve_team_id(
    team: str | SelahTeamEnum | None = None,
    team_id: int | None = None,
    *,
    organization_id: int,
) -> int | None:
    """Resolve a team reference to a Team FK, preferring *team_id*.

    Returns ``None`` when neither is provided or no matching team is found.
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
