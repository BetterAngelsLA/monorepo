from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from accounts.models import User
from common.graphql.types import DeleteDjangoObjectInput
from django.db import transaction
from notes.models import Task
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from tasks.types import CreateTaskInput, TaskType, UpdateTaskInput


@strawberry.type
class Query:
    task: TaskType = strawberry_django.field()

    tasks: List[TaskType] = strawberry_django.field()


@strawberry.type
class Mutation:
    @strawberry_django.mutation()
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            client = User(id=data.client.id) if data.client else None
            task_data = asdict(data)
            task = resolvers.create(
                info,
                Task,
                {
                    **task_data,
                    "created_by": user,
                    "client": client,
                },
            )

            return cast(TaskType, task)

    update_task: TaskType = mutations.update(UpdateTaskInput)
    delete_task: TaskType = mutations.delete(DeleteDjangoObjectInput)
