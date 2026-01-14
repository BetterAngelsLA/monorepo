import pghistory
from accounts.models import User
from common.enums import SelahTeamEnum
from common.models import BaseModel
from django.contrib.postgres.indexes import GinIndex
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from organizations.models import Organization

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
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="tasks")
    description = models.TextField(blank=True, null=True)
    note = models.ForeignKey("notes.Note", on_delete=models.CASCADE, blank=True, null=True, related_name="tasks")
    hmis_note = models.ForeignKey(
        "hmis.HmisNote", null=True, blank=True, on_delete=models.CASCADE, related_name="tasks"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        related_name="tasks",
    )
    status = IntegerChoicesField(Status, default=Status.TO_DO, db_index=True)
    summary = models.CharField(max_length=100, db_index=True)
    team = TextChoicesField(SelahTeamEnum, null=True, blank=True, db_index=True)

    def __str__(self) -> str:
        return self.summary

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
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(client_profile__isnull=False, hmis_client_profile__isnull=True)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=False)
                    | models.Q(client_profile__isnull=True, hmis_client_profile__isnull=True)
                ),
                name="task_only_one_client_link",
            ),
        ]

    objects = TaskManager()
