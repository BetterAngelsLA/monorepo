import pghistory
from accounts.models import User
from common.enums import SelahTeamEnum
from common.models import BaseModel
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from organizations.models import Organization


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
        "clients.ClientProfile", on_delete=models.SET_NULL, blank=True, null=True, related_name="tasks", db_index=True
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="tasks", db_index=True)
    description = models.TextField(blank=True, null=True, db_index=True)
    note = models.ForeignKey(
        "notes.Note", on_delete=models.CASCADE, blank=True, null=True, related_name="tasks", db_index=True
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, related_name="tasks", db_index=True
    )
    status = IntegerChoicesField(Status, default=Status.TO_DO, db_index=True)
    summary = models.CharField(max_length=100, db_index=True)
    team = TextChoicesField(SelahTeamEnum, null=True, blank=True, db_index=True)

    def __str__(self) -> str:
        return self.summary

    class Meta:
        ordering = ["-updated_at"]

    objects = models.Manager()
