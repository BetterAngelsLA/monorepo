from typing import TYPE_CHECKING, Annotated, Optional, cast

import strawberry
import strawberry_django
from django.db.models import Q, QuerySet
from strawberry import ID, UNSET, Info, Maybe, auto
from strawberry_django.auth.utils import get_current_user

from accounts.models import User
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.graphql.types import make_in_filter
from tasks.enums import TaskStatusEnum
from teams.types import TeamType

from . import models

if TYPE_CHECKING:
    from hmis.types import HmisClientProfileType


@strawberry_django.filter_type(models.Task, lookups=True)
class TaskFilter:
    client_profile: Optional[ID]
    hmis_client_profile: Optional[ID]
    note: Optional[strawberry_django.FilterLookup[ID]]
    hmis_note: Optional[strawberry_django.FilterLookup[ID]]
    created_by: Optional[ID]
    client_profiles = make_in_filter("client_profile", ID)
    hmis_client_profiles = make_in_filter("hmis_client_profile", ID)
    authors = make_in_filter("created_by", ID)
    assignees = make_in_filter("assignee", ID)
    organizations = make_in_filter("organization", ID)
    status = make_in_filter("status", TaskStatusEnum)
    team_ids = make_in_filter("team", ID)

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

    @strawberry_django.filter_field
    def client_profile_lookup(self, info: Info, value: Optional[strawberry_django.FilterLookup[ID]], prefix: str) -> Q:
        if not value:
            return Q()

        query = Q()

        if value.exact is not UNSET and value.exact is not None:
            query &= Q(client_profile=value.exact)

        if value.is_null is not UNSET and value.is_null is not None:
            query &= Q(client_profile__isnull=value.is_null)

        if value.in_list is not UNSET and value.in_list is not None:
            query &= Q(client_profile__in=value.in_list)

        return query

    @strawberry_django.filter_field
    def hmis_client_profile_lookup(
        self, info: Info, value: Optional[strawberry_django.FilterLookup[ID]], prefix: str
    ) -> Q:
        if not value:
            return Q()

        query = Q()

        if value.exact is not UNSET and value.exact is not None:
            query &= Q(hmis_client_profile=value.exact)

        if value.is_null is not UNSET and value.is_null is not None:
            query &= Q(hmis_client_profile__isnull=value.is_null)

        if value.in_list is not UNSET and value.in_list is not None:
            query &= Q(hmis_client_profile__in=value.in_list)

        return query


@strawberry_django.order_type(models.Task, one_of=False)
class TaskOrder:
    id: auto
    created_at: auto
    updated_at: auto
    status: auto


@strawberry_django.type(models.Task, pagination=True, filters=TaskFilter, ordering=TaskOrder)
class TaskType:
    id: ID
    hmis_client_profile: Optional[Annotated["HmisClientProfileType", strawberry.lazy("hmis.types")]]
    client_profile: Optional[ClientProfileType]
    created_at: auto
    created_by: UserType
    assignee: Optional[UserType]
    description: auto
    note: auto
    hmis_note: auto
    organization: Optional[OrganizationType]
    status: Optional[TaskStatusEnum]
    summary: Optional[str]
    team: Optional[TeamType]

    # Deprecated alias for ``team`` — see ``NoteType.current_team``.
    current_team: Optional[TeamType] = strawberry_django.field(field_name="team", deprecation_reason="Use team instead")
    updated_at: auto


@strawberry_django.input(models.Task, partial=True)
class CreateTaskInput:
    client_profile: Optional[ID]
    hmis_client_profile: Optional[ID]
    description: auto
    note: Optional[ID]
    hmis_note: Optional[ID]
    summary: str
    team_id: Maybe[ID | None]
    assignee_id: Maybe[ID | None]
    status: Optional[TaskStatusEnum]


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    """
    Input for updating a task.
    Omitted fields are left unchanged — UNSET for the plain ``Optional``
    fields, absent (``None``) for the ``Maybe`` ones.
    """

    id: ID
    description: auto
    summary: auto
    team_id: Maybe[ID | None]
    assignee_id: Maybe[ID | None]
    status: Optional[TaskStatusEnum]


@strawberry_django.filter_type(User)
class TaskAssigneeFilter:
    @strawberry_django.filter_field
    def organization(self, queryset: QuerySet, info: Info, value: Optional[ID], prefix: str) -> Q:
        """Narrow the roster to one organization.

        ``get_queryset`` already bounds this to orgs the caller belongs to, so
        passing someone else's id yields an empty list rather than widening the
        result.
        """
        if value is None:
            return Q()

        return Q(organizations_organization=value)

    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Q:
        if value is None:
            return Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            query &= Q(first_name__icontains=term) | Q(last_name__icontains=term) | Q(middle_name__icontains=term)

        return query


@strawberry_django.order_type(User, one_of=False)
class TaskAssigneeOrder:
    first_name: auto
    last_name: auto
    id: auto


@strawberry_django.type(
    User,
    filters=TaskAssigneeFilter,
    ordering=TaskAssigneeOrder,
)
class TaskAssigneeType:
    """A member of the caller's org who a task can be assigned to.

    Deliberately narrower than ``OrganizationMemberType``: choosing an assignee
    is part of writing a task, so it is gated on ``tasks.add`` rather than on
    ``organizations.view_org_members`` — a caseworker can assign a task without
    being able to administer the roster. Exposes only the name, which is all the
    assignee picker and the task card render.
    """

    id: ID
    first_name: auto
    last_name: auto
    middle_name: auto

    @classmethod
    def get_queryset(cls, queryset: QuerySet[User], info: Info) -> QuerySet[User]:
        """Restrict to members of the organizations the caller belongs to.

        For the common single-org caller this is exactly the set
        ``Task.clean()`` accepts. A caller in several orgs sees the union —
        there is no request-scoped "active org" on this side to narrow it with
        — so the write path is still the authority: it rejects an assignee who
        is not in the *task's* org. ``distinct()`` because a user in several of
        the caller's orgs matches once per shared org.
        """
        current_user = cast(User, get_current_user(info))
        caller_org_ids = current_user.organizations_organization.values("pk")

        # `is_active`: an offboarded caseworker must not be offered as an
        # assignee — they cannot log in to act on the task.
        #
        # The explicit `order_by` gives the offset-paginated list a stable
        # default; without it the sort is whatever the database returns and
        # paging can skip or repeat rows. A client-supplied `ordering` replaces
        # it.
        return (
            queryset.filter(
                organizations_organization__in=caller_org_ids,
                is_active=True,
            )
            .distinct()
            .order_by("first_name", "last_name", "id")
        )
