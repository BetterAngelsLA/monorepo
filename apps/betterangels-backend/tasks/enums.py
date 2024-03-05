from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")
