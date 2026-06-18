"""Helper to resolve deprecated SelahTeamEnum → Team FK for note/task mutations."""

from common.enums import SelahTeamEnum
from teams.models import Team


def resolve_team_id(
    team: str | SelahTeamEnum | None = None,
    team_id: int | None = None,
    *,
    organization_id: int,
) -> int | None:
    """Resolve a team reference to a Team FK, preferring *team_id*.

    If *team_id* is provided it is returned directly.  Otherwise the
    deprecated *team* value (enum member or string) is resolved:
    - ``SelahTeamEnum`` instance → looks up by ``.value`` (the enum's db value).
    - string → tries as-is first, then tries as ``SelahTeamEnum[value].value``
      (i.e. treat the string as the enum member name), then tries as
      ``SelahTeamEnum(value).value`` (i.e. treat the string as the enum db value).

    Returns ``None`` when neither is provided or no matching team is found.
    """
    if team_id is not None:
        return team_id
    if team is not None:
        candidates: list[str] = []
        if isinstance(team, SelahTeamEnum):
            candidates.append(team.value)
        else:
            # Try the string as-is, as enum member name, and as enum value.
            candidates.append(team)
            try:
                candidates.append(SelahTeamEnum[team].value)
            except KeyError:
                pass
            try:
                candidates.append(SelahTeamEnum(team).value)
            except ValueError:
                pass

        for candidate in candidates:
            try:
                return Team.objects.get(slug=candidate, organization_id=organization_id).pk
            except Team.DoesNotExist:
                continue
    return None
