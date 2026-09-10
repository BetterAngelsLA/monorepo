from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from clients.models import ClientProfile
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.org import resolve_org_or_deny
from common.graphql.permission_checkers import can_anywhere_checker
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.selectors import can_obj
from common.permissions.utils import IsAuthenticated, PERMISSION_DENIED_MESSAGE, require_can
from common.utils import get_or_none
from django.core.exceptions import PermissionDenied
from hmis.models import HmisClientProfile, HmisNote
from notes.models import Note
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm
from tasks.models import Task
from tasks.services import task_create, task_delete, task_update

from .types import CreateTaskInput, TaskOrder, TaskType, UpdateTaskInput


@strawberry.type
class Query:
    task: TaskType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(Task.perms.VIEW, perm_checker=can_anywhere_checker)],
    )

    @strawberry_django.offset_paginated(permission_classes=[IsAuthenticated])
    def tasks(self, info: Info, ordering: Optional[list[TaskOrder]] = None) -> OffsetPaginated[TaskType]:
        request = info.context["request"]
        session = request.session
        is_hmis_user = bool(session.get(HMIS_SESSION_KEY_NAME, False))

        return Task.objects.tasks_for_user(is_hmis_user)  # type: ignore


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        current_user = cast(User, get_current_user(info))
        org = resolve_org_or_deny(data.organization_id)
        require_can(current_user, Task.perms.ADD, org=org)

        task_data = asdict(data)
        task_data.pop("organization_id", None)

        # Resolve FK references
        note = None
        if note_id := task_data.pop("note", None):
            note = Note.objects.get(pk=str(note_id))

        hmis_note = None
        if hmis_note_id := task_data.pop("hmis_note", None):
            hmis_note = HmisNote.objects.get(pk=str(hmis_note_id))

        client_profile = None
        if client_profile_id := task_data.pop("client_profile", None):
            client_profile = ClientProfile.objects.get(pk=str(client_profile_id))

        hmis_client_profile = None
        if hmis_client_profile_id := task_data.pop("hmis_client_profile", None):
            hmis_client_profile = HmisClientProfile.objects.get(pk=str(hmis_client_profile_id))

        tasks = task_create(
            user=current_user,
            organization=org,
            data=[task_data],
            note=note,
            hmis_note=hmis_note,
            client_profile=client_profile,
            hmis_client_profile=hmis_client_profile,
        )

        return cast(TaskType, tasks[0])

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        user = cast(User, get_current_user(info))

        task = get_or_none(Task.objects.all(), data.id)
        # One refusal for missing and forbidden rows — no existence oracle.
        if task is None or not can_obj(user, Task.perms.CHANGE, task):
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)

        clean = asdict(data)

        task = task_update(task=task, data=clean)

        return cast(TaskType, task)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_task(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        user = cast(User, get_current_user(info))

        task = get_or_none(Task.objects.all(), data.id)
        # One refusal for missing and forbidden rows — no existence oracle.
        if task is None or not can_obj(user, Task.perms.DELETE, task):
            raise PermissionDenied(PERMISSION_DENIED_MESSAGE)

        deleted_id = task_delete(task=task)

        return DeletedObjectType(id=deleted_id)
