from enum import Enum
from typing import Any, List, Optional, Tuple, Type, TypeVar

import strawberry_django
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from django.db.models import Model, Q, QuerySet
from strawberry import ID, Info, auto
from strawberry.types.field import StrawberryField
from tasks.enums import TaskStatusEnum

from . import models

T = TypeVar("T", bound=Model)


def make_in_filter(
    field_name: str,
    value_type: Any,
    enum: Optional[Type[Enum]] = None,
) -> StrawberryField:
    @strawberry_django.filter_field
    def _filter(
        queryset: QuerySet[T], info: Info, value: Optional[List[value_type]], prefix: str
    ) -> Tuple[QuerySet[T], Q]:
        if not value:
            return queryset, Q()

        normalized_value = [enum[v] if enum and isinstance(v, str) else v for v in value]

        return queryset.filter(**{f"{prefix}{field_name}__in": normalized_value}), Q()

    return _filter


@strawberry_django.filter_type(models.Task, lookups=True)
class TaskFilter:
    client_profile: Optional[ID]
    created_by: Optional[ID]
    authors = make_in_filter("created_by", ID)
    organizations = make_in_filter("organization", ID)
    status = make_in_filter("status", TaskStatusEnum, enum=TaskStatusEnum)
    teams = make_in_filter("team", SelahTeamEnum, enum=SelahTeamEnum)

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
                | Q(client_profile__middle_name__icontains=term)
                | Q(client_profile__last_name__icontains=term)
                | Q(client_profile__nickname__icontains=term)
                | Q(summary__icontains=term)
                | Q(description__icontains=term)
            )

            query &= q_search

        return (
            queryset.filter(query),
            Q(),
        )


@strawberry_django.order_type(models.Task, one_of=False)
class TaskOrder:
    id: auto
    created_at: auto
    updated_at: auto
    status: auto


@strawberry_django.type(models.Task, pagination=True, filters=TaskFilter, order=TaskOrder)  # type: ignore[literal-required]
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
    summary: str
    team: Optional[SelahTeamEnum]
    status: Optional[TaskStatusEnum]
