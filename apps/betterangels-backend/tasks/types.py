from typing import Optional

import strawberry_django
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.enums import SelahTeamEnum
from django.db.models import Q, QuerySet
from strawberry import ID, Info, auto

from . import models


def _filter_in(queryset: QuerySet, field: str, value: Optional[list]) -> tuple[QuerySet, Q]:
    if not value:
        return queryset, Q()

    return queryset.filter(**{f"{field}__in": value}), Q()


@strawberry_django.filter_type(models.Task)
class TaskFilter:
    client_profile: Optional[ID]
    created_by: Optional[ID]
    # status:

    @strawberry_django.filter_field
    def authors(
        self, queryset: QuerySet, info: Info, value: Optional[list[ID]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        return _filter_in(queryset, "created_by", value)

    @strawberry_django.filter_field
    def organizations(
        self, queryset: QuerySet, info: Info, value: Optional[list[ID]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        return _filter_in(queryset, "organization", value)

    @strawberry_django.filter_field
    def status(
        self, queryset: QuerySet, info: Info, value: Optional[list[int]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        return _filter_in(queryset, "status", value)

    @strawberry_django.filter_field
    def teams(
        self, queryset: QuerySet, value: Optional[list[SelahTeamEnum]], prefix: str
    ) -> tuple[QuerySet[models.Task], Q]:
        return _filter_in(queryset, "team", value)

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
    status: auto
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
    status: auto


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: ID
    description: auto
    summary: str
    team: Optional[SelahTeamEnum]
    status: auto
