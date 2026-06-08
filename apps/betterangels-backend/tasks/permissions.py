from common.permissions.utils import perms_to_text_choices

from .models import Task

TaskPermissions = perms_to_text_choices(Task)