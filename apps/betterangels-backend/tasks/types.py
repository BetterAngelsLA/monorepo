import dataclasses

import strawberry_django
from accounts.types import UserInput, UserType
from strawberry import auto

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Task)
class TaskType:
    id: auto
    title: auto
    status: auto
    due_date: auto
    client: UserType
    created_at: auto
    created_by: UserType


@dataclasses.dataclass
@strawberry_django.input(models.Task)
class CreateTaskInput:
    id: auto
    title: auto
    status: auto
    due_date: auto
    client: UserInput
    created_at: auto


@dataclasses.dataclass
@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: auto
    title: auto
    status: auto
    due_date: auto
    created_at: auto
