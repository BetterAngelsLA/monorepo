from typing import Any, Dict, List, Optional

from accounts.models import PermissionGroup, User
from clients.models import ClientProfile
from common.permissions.utils import assign_object_permissions
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from hmis.models import HmisClientProfile, HmisNote
from notes.models import Note
from tasks.models import Task
from tasks.permissions import TaskPermissions

# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------


def task_create(
    *,
    user: User,
    permission_group: PermissionGroup,
    data: List[Dict[str, Any]],
    note: Optional[Note] = None,
    hmis_note: Optional[HmisNote] = None,
    client_profile: Optional[ClientProfile] = None,
    hmis_client_profile: Optional[HmisClientProfile] = None,
) -> List[Task]:
    """Create one or more Tasks and assign object-level permissions."""
    created: List[Task] = []

    for item in data:
        try:
            task = Task.objects.create(
                summary=item.get("summary", ""),
                description=item.get("description", ""),
                status=item.get("status", Task.Status.TO_DO),
                team=item.get("team"),
                note=note,
                hmis_note=hmis_note,
                client_profile=client_profile,
                hmis_client_profile=hmis_client_profile,
                created_by=user,
                organization=permission_group.organization,
            )
        except IntegrityError as e:
            raise ValidationError(str(e)) from e

        assign_object_permissions(
            permission_group.group,
            task,
            [
                TaskPermissions.CHANGE,
                TaskPermissions.DELETE,
            ],
        )

        created.append(task)

    return created


def task_update(
    *,
    task: Task,
    data: Dict[str, Any],
) -> Task:
    """Update a Task. Caller is responsible for permission checks."""
    for field, value in data.items():
        if field != "id":
            setattr(task, field, value)
    task.save()
    return task


def task_delete(*, task: Task) -> int:
    """Delete a Task. Caller is responsible for permission checks."""
    deleted_id = task.id
    task.delete()
    return deleted_id
