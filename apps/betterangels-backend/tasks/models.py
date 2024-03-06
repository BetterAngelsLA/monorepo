from accounts.models import User
from common.models import BaseModel, Location
from django.db import models
from django_choices_field import TextChoicesField
from tasks.enums import TaskStatusEnum


class Task(BaseModel):
    title = models.CharField(max_length=100, blank=False)
    status = TextChoicesField(choices_enum=TaskStatusEnum)
    due_by = models.DateTimeField(blank=True, null=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, null=True, blank=True, related_name="tasks"
    )
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="client_tasks",
    )
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, null=False, related_name="tasks"
    )
