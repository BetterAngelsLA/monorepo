"""Teams — per-organization team management."""

from common.models import BaseModel
from django.db import models
from django.db.models.functions import Lower

from .validators import validate_has_alphanumeric


class Team(BaseModel):
    """Team, scoped per organization.

    Teams are managed by org admins through the admin app and referenced by
    ``id`` (FK) on notes and tasks.  *name* is the only identifier: it is what
    users see and type, and it is unique per organization case-insensitively
    (see ``unique_team_name_per_org``).
    """

    name = models.CharField(max_length=255, validators=[validate_has_alphanumeric])
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="teams",
    )
    is_active = models.BooleanField(default=True)

    class Meta(BaseModel.Meta):
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                Lower("name"),
                "organization",
                name="unique_team_name_per_org",
                violation_error_message="A team with this name already exists in this organization.",
            ),
            # Redundant on its own -- ``id`` is already unique. It exists because a
            # composite foreign key must reference a unique constraint on exactly
            # the columns it names, and ``Note.team`` / ``Task.team`` reference
            # ``(team_id, organization_id)``.
            models.UniqueConstraint(
                fields=["id", "organization"],
                name="unique_team_id_per_org",
            ),
        ]

    def __str__(self) -> str:
        return self.name
