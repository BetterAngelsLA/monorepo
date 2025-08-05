import pghistory
from accounts.models import User
from common.enums import SelahTeamEnum
from common.models import BaseModel
from django.db import models
from django_choices_field import TextChoicesField
from organizations.models import Organization


@pghistory.track(
    pghistory.InsertEvent("task.add"),
    pghistory.UpdateEvent("task.update"),
    pghistory.DeleteEvent("task.remove"),
)
class Task(BaseModel):
    client_profile = models.ForeignKey(
        "clients.ClientProfile", on_delete=models.SET_NULL, blank=True, null=True, related_name="tasks", db_index=True
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="tasks", db_index=True)
    description = models.TextField(blank=True, null=True)
    note = models.ForeignKey(
        "notes.Note", on_delete=models.SET_NULL, blank=True, null=True, related_name="tasks", db_index=True
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, related_name="tasks", db_index=True
    )
    status = models.IntegerField(choices=Status.choices, default=Status.TO_DO, db_index=True)
    summary = models.CharField(max_length=100)
    team = TextChoicesField(SelahTeamEnum, null=True, blank=True, db_index=True)

    def __str__(self) -> str:
        return self.summary

    class Meta:
        ordering = ["-updated_at"]

    objects = models.Manager()
