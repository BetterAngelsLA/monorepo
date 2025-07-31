from typing import Optional

import strawberry_django
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from strawberry import ID, auto
from tasks.enums import TaskStatusEnum

from . import models


@strawberry_django.order_type(models.Task)
class TaskOrder:
    updated_at: auto
    id: auto


@strawberry_django.type(models.Task)
class TaskBaseType:
    description: auto
    status: Optional[TaskStatusEnum]
    summary: auto
    team: Optional[SelahTeamEnum]


@strawberry_django.type(models.Task, pagination=True, order=TaskOrder)  # type: ignore[literal-required]
class TaskType(TaskBaseType):
    id: ID
    client_profile: Optional[ClientProfileType]
    created_at: auto
    created_by: UserType
    organization: Optional[OrganizationType]
    updated_at: auto


@strawberry_django.input(models.Task, partial=True)
class TaskInput(TaskBaseType):
    id: Optional[ID]
    client_profile: ID
