"""Teams — per-organization team management."""

from common.models import BaseModel
from django.db import models
from django.db.models.functions import Lower


class Team(BaseModel):
    """Team, scoped per organization.

    Teams are managed by org admins through the admin app and referenced by
    ``id`` (FK) on notes and tasks.  *name* is the only identifier: it is what
    users see and type, and it is unique per organization case-insensitively
    (see ``unique_team_name_per_org``).
    """

    name = models.CharField(max_length=255)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="teams",
    )

    class Meta(BaseModel.Meta):
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                "organization",
                name="unique_team_name_per_org",
            ),
            # Redundant on its own (``id`` is already unique) but required as
            # the target of the composite foreign keys on Note.team and
            # Task.team, which are what make a cross-org team reference
            # impossible to store.  See notes/tasks migration 0004.
            models.UniqueConstraint(
                "id",
                "organization",
                name="unique_team_id_per_org",
            ),
        ]

    def __str__(self) -> str:
        return self.name
