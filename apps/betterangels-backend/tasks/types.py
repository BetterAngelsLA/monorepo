from typing import Optional

import strawberry_django
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from common.graphql.types import make_in_filter
from django.db.models import Q
from strawberry import ID, Info, auto
from tasks.enums import TaskStatusEnum

from . import models


@strawberry_django.filter_type(models.Task, lookups=True)
class TaskFilter:
    client_profile: Optional[ID]
    created_by: Optional[ID]
    authors = make_in_filter("created_by", ID)
    organizations = make_in_filter("organization", ID)
    status = make_in_filter("status", TaskStatusEnum)
    teams = make_in_filter("team", SelahTeamEnum)

    @strawberry_django.filter_field
    def search(self, info: Info, value: Optional[str], prefix: str) -> Q:
        if value is None:
            return Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(
                Q(client_profile__first_name__icontains=term)
                | Q(client_profile__middle_name__icontains=term)
                | Q(client_profile__last_name__icontains=term)
                | Q(client_profile__nickname__icontains=term)
                | Q(summary__icontains=term)
                | Q(description__icontains=term)
            )

            query &= q_search

        return Q(query)


@strawberry_django.order_type(models.Task, one_of=False)
class TaskOrder:
    id: auto
    created_at: auto
    updated_at: auto
    status: auto


@strawberry_django.type(
    models.Task,
    filters=TaskFilter,
    ordering=Optional[TaskOrder],
    pagination=True,
)
class TaskType:
    id: ID
    client_profile: Optional[ClientProfileType]
    created_at: auto
    created_by: UserType
    description: auto
    note: auto
    organization: Optional[OrganizationType]
    status: Optional[TaskStatusEnum]
    summary: Optional[str]
    team: Optional[SelahTeamEnum]
    updated_at: auto


@strawberry_django.input(models.Task, partial=True)
class CreateTaskInput:
    client_profile: Optional[ID]
    description: auto
    note: Optional[ID]
    summary: str
    team: Optional[SelahTeamEnum]
    status: Optional[TaskStatusEnum]


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: ID
    description: auto
    summary: auto
    team: Optional[SelahTeamEnum]
    status: Optional[TaskStatusEnum]
