import pghistory
from accounts.models import User
from common.constraints import CompositeForeignKey
from common.models import BaseModel
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.db import models
from django_choices_field import IntegerChoicesField
from organizations.models import Organization
from teams.models import Team
from teams.validators import validate_team_in_org

from .managers import TaskManager


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.UpdateEvent("task.update"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):
    class Status(models.IntegerChoices):
        TO_DO = 0, "To Do"
        IN_PROGRESS = 1, "In Progress"
        COMPLETED = 2, "Completed"

    client_profile = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
    )
    hmis_client_profile = models.ForeignKey(
        "hmis.HmisClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="tasks",
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    description = models.TextField(blank=True, null=True)
    note = models.ForeignKey("notes.Note", on_delete=models.CASCADE, blank=True, null=True, related_name="tasks")
    hmis_note = models.ForeignKey(
        "hmis.HmisNote", null=True, blank=True, on_delete=models.CASCADE, related_name="tasks"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    status = IntegerChoicesField(Status, default=Status.TO_DO, db_index=True)
    summary = models.CharField(max_length=100, db_index=True)
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.RESTRICT, db_index=True)

    def __str__(self) -> str:
        return self.summary

    def clean(self) -> None:
        """Reject a team from another organization."""
        super().clean()

        try:
            validate_team_in_org(team_id=self.team_id, organization_id=self.organization_id)
        except ValidationError as exc:
            raise ValidationError({"team": exc.messages}) from exc

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            GinIndex(
                name="task_description_trgm",
                fields=["description"],
                opclasses=["gin_trgm_ops"],
            ),
            GinIndex(
                name="task_summary_trgm",
                fields=["summary"],
                opclasses=["gin_trgm_ops"],
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(note__isnull=True) | models.Q(hmis_note__isnull=True),
                name="task_single_parent_check",
                violation_error_message="A task belongs to one note, not both a note and an HMIS note.",
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(client_profile__isnull=False, hmis_client_profile__isnull=True)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=False)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=True)
                ),
                name="task_only_one_client_link",
                violation_error_message="A task belongs to one client, not both a client profile and an HMIS client profile.",
            ),
            CompositeForeignKey(
                name="tasks_task_team_same_org_fk",
                fields=["team", "organization"],
                to_model="teams.Team",
                to_fields=["id", "organization"],
                deferrable=models.Deferrable.DEFERRED,
            ),
        ]

    objects = TaskManager()
