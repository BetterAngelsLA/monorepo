from typing import Optional

import strawberry_django
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from django.db.models import Case, IntegerField, Q, QuerySet, Value, When
from strawberry import ID, Info, auto
from tasks.enums import TaskStatusEnum

from . import models


@strawberry_django.filter_type(models.Task)
class TaskFilter:
    client_profile: Optional[ID]
    created_by: Optional[ID]

    @strawberry_django.filter_field
    def authors(
        self, queryset: QuerySet, info: Info, value: Optional[list[ID]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(created_by__in=value), Q()

    @strawberry_django.filter_field
    def organizations(
        self, queryset: QuerySet, info: Info, value: Optional[list[ID]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(organization__in=value), Q()

    @strawberry_django.filter_field
    def search(
        self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(
                Q(client_profile__first_name__icontains=term)
                | Q(client_profile__last_name__icontains=term)
                | Q(summary__icontains=term)
                | Q(description__icontains=term)
            )

            query &= q_search

        return (
            queryset.filter(query),
            Q(),
        )

    @strawberry_django.filter_field
    def status(
        self, queryset: QuerySet, info: Info, value: Optional[list[TaskStatusEnum]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(status__in=value), Q()

    @strawberry_django.filter_field
    def teams(
        self, queryset: QuerySet, value: Optional[list[SelahTeamEnum]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(team__in=value), Q()


@strawberry_django.order_type(models.Task, one_of=False)
class TaskOrder:
    id: auto
    updated_at: auto

    @strawberry_django.order_field
    def status(self, value: strawberry_django.Ordering, prefix: str) -> list:
        ordering_map = {
            TaskStatusEnum.TO_DO.value: 0,
            TaskStatusEnum.IN_PROGRESS.value: 1,
            TaskStatusEnum.COMPLETED.value: 2,
        }

        if value in [
            strawberry_django.Ordering.DESC,
            strawberry_django.Ordering.DESC_NULLS_FIRST,
            strawberry_django.Ordering.DESC_NULLS_LAST,
        ]:
            ordering_map = {k: 2 - v for k, v in ordering_map.items()}

        return [
            Case(
                *[When(**{"status": status}, then=Value(order)) for status, order in ordering_map.items()],
                default=Value(99),
                output_field=IntegerField(),
            )
        ]


@strawberry_django.type(models.Task)
class TaskBaseType:
    description: auto
    summary: auto
    team: Optional[SelahTeamEnum]


@strawberry_django.type(models.Task, pagination=True, filters=TaskFilter, order=TaskOrder)  # type: ignore[literal-required]
class TaskType(TaskBaseType):
    id: ID
    client_profile: Optional[ClientProfileType]
    created_at: auto
    created_by: UserType
    organization: Optional[OrganizationType]
    status: Optional[TaskStatusEnum]
    updated_at: auto


@strawberry_django.input(models.Task, partial=True)
class TaskInput(TaskBaseType):
    id: Optional[ID]
    client_profile: Optional[ID]
    organization: Optional[OrganizationType]
    status: Optional[TaskStatusEnum] = TaskStatusEnum.TO_DO
