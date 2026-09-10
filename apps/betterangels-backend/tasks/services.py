from typing import Any, Dict, List, Optional

from accounts.models import User
from clients.models import ClientProfile
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from hmis.models import HmisClientProfile, HmisNote
from notes.models import Note
from organizations.models import Organization
from tasks.models import Task

# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------


def task_create(
    *,
    user: User,
    organization: Organization,
    data: List[Dict[str, Any]],
    note: Optional[Note] = None,
    hmis_note: Optional[HmisNote] = None,
    client_profile: Optional[ClientProfile] = None,
    hmis_client_profile: Optional[HmisClientProfile] = None,
) -> List[Task]:
    """Create one or more Tasks.

    Authority is the caller's to check (``require_can`` at *organization*,
    RFC 0003); CHANGE/DELETE ride the org role's ``can_obj`` arm instead of
    guardian rows — none are written here.
    """
    created: List[Task] = []

    for item in data:
        task = Task(
            summary=item.get("summary", ""),
            description=item.get("description") or "",
            status=item.get("status") or Task.Status.TO_DO,
            team_id=item.get("team_id"),
            note=note,
            hmis_note=hmis_note,
            client_profile=client_profile,
            hmis_client_profile=hmis_client_profile,
            created_by=user,
            organization=organization,
        )
        task.full_clean()

        try:
            task.save()
        except IntegrityError as e:
            # full_clean checks the constraints first, so reaching this means
            # a concurrent write landed between the check and the insert.
            raise ValidationError(str(e)) from e

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

    task.full_clean()
    task.save()
    return task


def task_delete(*, task: Task) -> int:
    """Delete a Task. Caller is responsible for permission checks."""
    deleted_id = task.id
    task.delete()
    return deleted_id
