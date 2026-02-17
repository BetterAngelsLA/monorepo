from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.core.exceptions import PermissionDenied
from django.db.models import QuerySet
from hmis.models import HmisClientProfile, HmisNote
from notes.models import Note
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user
from tasks.models import Task
from tasks.permissions import TaskPermissions
from tasks.services import task_create, task_delete, task_update

from .types import CreateTaskInput, TaskOrder, TaskType, UpdateTaskInput


@strawberry.type
class Query:
    task: TaskType = strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )

    @strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated], extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )
    def tasks(self, info: Info, ordering: Optional[list[TaskOrder]] = None) -> OffsetPaginated[TaskType]:
        request = info.context["request"]
        session = request.session
        is_hmis_user = bool(session.get(HMIS_SESSION_KEY_NAME, False))

        return Task.objects.tasks_for_user(is_hmis_user)  # type: ignore


@strawberry.type
class Mutation:
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(TaskPermissions.ADD)])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        current_user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(current_user)

        # Filter out UNSET values to avoid passing them to Django ORM
        task_data = {k: v for k, v in asdict(data).items() if v is not strawberry.UNSET}

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
            permission_group=permission_group,
            data=[task_data],
            note=note,
            hmis_note=hmis_note,
            client_profile=client_profile,
            hmis_client_profile=hmis_client_profile,
        )

        return cast(TaskType, tasks[0])

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Task, perms=[TaskPermissions.CHANGE])],
    )
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        qs: QuerySet[Task] = info.context.qs
        clean = {k: v for k, v in asdict(data).items() if v is not strawberry.UNSET}

        task = qs.get(pk=data.id)
        task = task_update(task=task, data=clean)

        return cast(TaskType, task)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_task(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        current_user = get_current_user(info)

        try:
            task = filter_for_user(
                Task.objects.all(),
                current_user,
                [TaskPermissions.DELETE],
            ).get(id=data.id)
        except Task.DoesNotExist:
            raise PermissionDenied("You do not have permission to delete this task.")

        deleted_id = task_delete(task=task)

        return DeletedObjectType(id=deleted_id)
