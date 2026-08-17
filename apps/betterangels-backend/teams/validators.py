"""Team validators — the team/organization invariant lives here.

Kept out of ``teams.services`` so that ``notes.models`` and ``tasks.models``
can call it from ``clean()`` without a models-depend-on-services inversion.
"""

from django.core.exceptions import ValidationError

from .models import Team


def validate_team_in_org(*, team_id: int | None, organization_id: int | None) -> None:
    """Raise unless *team_id* names a team belonging to *organization_id*.

    Single source of truth for the rule, called from two places for two
    audiences: the note/task services call it so GraphQL writes get a
    friendly top-level message, and ``Note.clean()`` / ``Task.clean()`` call
    it so writers that never touch the services — the Django admin, whose
    ``team`` field is an unfiltered dropdown — cannot bypass it.

    A ``None`` *team_id* is always allowed (the team is optional).
    """
    if team_id is None:
        return

    if organization_id is None:
        raise ValidationError(f"Team with id {team_id} cannot be set: the record has no organization.")

    if not Team.objects.filter(pk=team_id, organization_id=organization_id).exists():
        raise ValidationError(f"Team with id {team_id} does not exist in organization {organization_id}.")
