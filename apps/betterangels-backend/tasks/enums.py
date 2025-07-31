import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


@strawberry.enum
class TaskStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    IN_PROGRESS = "in_progress", _("In Progress")
    TO_DO = "to_do", _("To Do")
