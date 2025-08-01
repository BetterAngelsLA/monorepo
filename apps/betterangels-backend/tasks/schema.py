from typing import cast

import pghistory
import strawberry
import strawberry_django
from accounts.utils import get_user_permission_group
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone
from guardian.shortcuts import assign_perm
from strawberry import asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user
from tasks.models import Task
from tasks.permissions import TaskPermissions

from .types import TaskInput, TaskType


@strawberry.type
class Query:
    task: TaskType = strawberry_django.field(extensions=[HasRetvalPerm(TaskPermissions.VIEW)])

    tasks: OffsetPaginated[TaskType] = strawberry_django.offset_paginated(
        extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )


@strawberry.type
class Mutation:
    @strawberry_django.mutation(extensions=[HasPerm(TaskPermissions.ADD)])
    def create_task(self, info: Info, data: TaskInput) -> TaskType:
        with transaction.atomic():
            current_user = get_current_user(info)
            permission_group = get_user_permission_group(current_user)

            task_data = asdict(data)
            task = resolvers.create(
                info,
                Task,
                {
                    **task_data,
                    "created_by": current_user,
                    "organization": permission_group.organization,
                },
            )

            permissions = [
                TaskPermissions.CHANGE,
                TaskPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, task)

            return cast(TaskType, task)

    @strawberry_django.mutation(extensions=[PermissionedQuerySet(model=Task, perms=[TaskPermissions.CHANGE])])
    def update_task(self, info: Info, data: TaskInput) -> TaskType:
        qs: QuerySet[Task] = info.context.qs

        with transaction.atomic(), pghistory.context(note_id=data.id, timestamp=timezone.now(), label=info.field_name):
            assert data.id
            task = qs.get(pk=data.id)
            task = resolvers.update(info, task, asdict(data))

        return cast(TaskType, task)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_task(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        """
        NOTE: this function will need to change once Tasks are able to be associated with zero or more than one Note
        """
        user = get_current_user(info)

        try:
            task = filter_for_user(
                Task.objects.all(),
                user,
                [TaskPermissions.DELETE],
            ).get(id=data.id)

        except Task.DoesNotExist:
            raise PermissionError("You do not have permission to modify this task.")

        task_id = task.id
        task.delete()

        # note_id = task.get_note_id()
        # with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
        #     task.delete()

        return DeletedObjectType(id=task_id)
