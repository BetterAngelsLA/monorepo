from common.permissions.utils import perms_to_text_choices

from .models import Task

# ── Model-backed permission enum ──────────────────────────────────────────────
# This TextChoices class exists solely to register with Strawberry's GraphQL
# type system (schema introspection, make_granted_permissions, etc.).
#
# For IDE autocomplete, use the model's .perms:
#     Task.perms.VIEW    → "tasks.view_task"
# ──────────────────────────────────────────────────────────────────────────────

TaskPermissions = perms_to_text_choices(Task)
