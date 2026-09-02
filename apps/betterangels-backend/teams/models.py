"""Teams — per-organization team management."""

from common.models import BaseModel, OrgScoped
from django.db import models
from django.db.models.functions import Lower

from .validators import validate_has_alphanumeric


class Team(OrgScoped, BaseModel):
    """Team, scoped per organization.

    Teams are managed by org admins through the admin app and referenced by
    ``id`` (FK) on notes and tasks.  *name* is the only identifier: it is what
    users see and type, and it is unique per organization case-insensitively
    (see ``unique_team_name_per_org``).

    ``OrgScoped`` with the default ``org_via = ()`` (ADR 0001 §5.3): the model
    owns its ``organization`` FK, so a scoped Role's ``teams.*`` perms are
    org-reachable — this is what lets a role-backed ``ORG_ADMIN`` Grant holder
    act at one org without inheriting another's teams (permissions.E005).
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
            ),
        ]

    def __str__(self) -> str:
        return self.name
