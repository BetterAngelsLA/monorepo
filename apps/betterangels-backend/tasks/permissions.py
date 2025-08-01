from django.db import models
from django.utils.translation import gettext_lazy as _


class TaskPermissions(models.TextChoices):
    VIEW = "tasks.view_task", _("Can view task")
    CHANGE = "tasks.change_task", _("Can change task")
    DELETE = "tasks.delete_task", _("Can delete task")
    ADD = "tasks.add_task", _("Can add task")
