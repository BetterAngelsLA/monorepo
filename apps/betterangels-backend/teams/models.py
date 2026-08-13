"""Teams — per-organization team management."""

from common.models import BaseModel
from django.db import models


class Team(BaseModel):
    """Team, scoped per organization.

    Teams are managed by org admins through the admin app.  *slug* is
    the machine-readable identifier, unique per organization (see
    ``unique_team_slug_per_org``).  Teams are referenced by ``id`` (FK)
    on notes and tasks.
    """

    slug = models.CharField(max_length=100)
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
                "slug",
                "organization",
                name="unique_team_slug_per_org",
            ),
        ]

    def __str__(self) -> str:
        return self.name
