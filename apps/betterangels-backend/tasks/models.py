import pghistory
from accounts.models import User
from common.enums import SelahTeamEnum
from common.models import BaseModel
from django.db import models
from django_choices_field import TextChoicesField
from organizations.models import Organization
from tasks.enums import TaskStatusEnum


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.UpdateEvent("task.update"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):  # type: ignore[django-manager-missing]
    client_profile = models.ForeignKey(
        "clients.ClientProfile", on_delete=models.SET_NULL, blank=True, null=True, related_name="tasks"
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="tasks")
    description = models.TextField(blank=True, null=True)
    note = models.ForeignKey("notes.Note", on_delete=models.SET_NULL, blank=True, null=True, related_name="tasks")
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, related_name="tasks")
    status = TextChoicesField(choices_enum=TaskStatusEnum)
    summary = models.CharField(max_length=100)
    team = TextChoicesField(SelahTeamEnum, null=True, blank=True)

    def __str__(self) -> str:
        return self.summary

    class Meta:
        ordering = ["-updated_at"]

    objects = models.Manager()
