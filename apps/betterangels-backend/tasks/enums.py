from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskStatusEnum(models.TextChoices):
    CANCELED = "canceled", _("Canceled")
    COMPLETED = "completed", _("Completed")
    DRAFT_CANCELED = "draft_canceled", _("Draft Canceled")
    DRAFT_COMPLETED = "draft_completed", _("Draft Completed")
    IN_PROGRESS = "in_progress", _("In Progress")
    TO_DO = "to_do", _("To Do")
