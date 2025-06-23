from datetime import datetime
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import OrganizationType, UserType
from clients.types import ClientProfileType
from common.graphql.types import LocationInput, LocationType, NonBlankString
from django.db.models import (
    BooleanField,
    Case,
    Exists,
    F,
    OuterRef,
    Q,
    QuerySet,
    Value,
    When,
)
from notes.enums import (
    DueByGroupEnum,
    SelahTeamEnum,
    ServiceRequestTypeEnum,
    TaskTypeEnum,
)
from notes.permissions import NotePermissions, PrivateDetailsPermissions
from strawberry import ID, Info, auto
from strawberry_django.utils.query import filter_for_user

from . import models


@strawberry_django.type(models.ServiceRequest, pagination=True)
class ServiceRequestType:
    id: ID
    service: auto
    service_other: auto
    status: auto
    due_by: auto
    completed_on: auto
    client_profile: ClientProfileType | None
    created_by: UserType
    created_at: auto


@strawberry_django.input(models.ServiceRequest)
class CreateServiceRequestInput:
    service: auto
    status: auto
    service_other: auto
    client_profile: ID | None


@strawberry_django.input(models.ServiceRequest)
class CreateNoteServiceRequestInput:
    service: auto
    service_other: Optional[str]
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: ID
    service_other: auto
    status: auto
    due_by: auto


@strawberry_django.ordering.order(models.Task)
class TaskOrder:
    due_by: auto
    id: auto


@strawberry_django.type(models.Task, pagination=True, order=TaskOrder)  # type: ignore[literal-required]
class TaskType:
    id: ID
    title: auto
    location: Optional[LocationType]
    status: auto
    due_by: auto
    due_by_group: DueByGroupEnum
    client_profile: ClientProfileType | None
    created_at: auto
    created_by: UserType


@strawberry_django.input(models.Task)
class CreateTaskInput:
    title: auto
    status: auto
    due_by: auto
    client_profile: ID | None


@strawberry_django.input(models.Task)
class CreateNoteTaskInput:
    title: auto
    status: auto
    due_by: auto
    note_id: ID
    task_type: TaskTypeEnum


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: ID
    title: auto
    location: Optional[ID]
    status: auto
    due_by: auto


@strawberry_django.type(models.Mood)
class MoodType:
    id: ID
    descriptor: auto


@strawberry.input
class AddNoteTaskInput:
    task_id: ID
    note_id: ID
    task_type: TaskTypeEnum


@strawberry.input
class RemoveNoteTaskInput:
    task_id: ID
    note_id: ID
    task_type: TaskTypeEnum


@strawberry.input
class RemoveNoteServiceRequestInput:
    service_request_id: ID
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.Mood)
class CreateNoteMoodInput:
    descriptor: auto
    note_id: ID


@strawberry_django.ordering.order(models.Note)
class NoteOrder:
    interacted_at: auto
    id: auto


@strawberry_django.filters.filter(models.Note)
class NoteFilter:
    client_profile: ID | None
    created_by: ID | None
    is_submitted: auto

    @strawberry_django.filter_field
    def organizations(
        self, queryset: QuerySet, info: Info, value: Optional[List[ID]], prefix: str
    ) -> Tuple[QuerySet[models.Note], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(organization__in=value), Q()

    @strawberry_django.filter_field
    def authors(
        self, queryset: QuerySet, info: Info, value: Optional[List[ID]], prefix: str
    ) -> Tuple[QuerySet[models.Note], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(created_by__in=value), Q()

    @strawberry_django.filter_field
    def search(
        self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str
    ) -> Tuple[QuerySet[models.Note], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split(" ")
        query = Q()

        for term in search_terms:
            q_search = Q(
                Q(client_profile__first_name__icontains=term)
                | Q(client_profile__last_name__icontains=term)
                | Q(public_details__icontains=term)
            )

            query &= q_search

        return (
            queryset.filter(query),
            Q(),
        )

    @strawberry_django.filter_field
    def teams(
        self, queryset: QuerySet, value: Optional[List[SelahTeamEnum]], prefix: str
    ) -> Tuple[QuerySet[models.Note], Q]:
        if not value:
            return queryset, Q()

        return queryset.filter(team__in=value), Q()


@strawberry_django.type(models.Note, pagination=True, filters=NoteFilter, order=NoteOrder)  # type: ignore[literal-required]
class NoteType:
    id: ID
    organization: OrganizationType
    purpose: auto
    team: Optional[SelahTeamEnum]
    location: Optional[LocationType]
    moods: List[MoodType]
    purposes: List[TaskType]
    next_steps: List[TaskType]
    provided_services: List[ServiceRequestType]
    requested_services: List[ServiceRequestType]
    public_details: auto
    is_submitted: auto
    client_profile: ClientProfileType | None
    created_at: auto
    created_by: UserType
    interacted_at: auto

    @strawberry_django.field(
        annotate={
            "_can_edit": lambda info: Case(
                When(
                    Exists(
                        filter_for_user(
                            models.Note.objects.all(),
                            info.context.request.user,
                            [NotePermissions.CHANGE],
                        ).filter(pk=OuterRef("pk"))
                    ),
                    then=Value(True),
                ),
                default=Value(False),
                output_field=BooleanField(),
            ),
        }
    )
    def user_can_edit(self, root: models.Note) -> bool:
        return bool(getattr(root, "_can_edit", False))

    @strawberry_django.field(
        annotate={
            "_private_details": lambda info: Case(
                When(
                    Exists(
                        filter_for_user(
                            models.Note.objects.all(),
                            info.context.request.user,
                            [PrivateDetailsPermissions.VIEW],
                        )
                    ),
                    then=F("private_details"),
                ),
                default=Value(None),
            ),
        }
    )
    def private_details(self, root: models.Note) -> Optional[str]:
        return root._private_details


@strawberry_django.input(models.Note)
class CreateNoteInput:
    purpose: auto
    team: Optional[SelahTeamEnum]
    public_details: auto
    private_details: auto
    client_profile: ID | None
    is_submitted: auto
    interacted_at: auto


@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: ID
    purpose: Optional[NonBlankString]
    team: Optional[SelahTeamEnum]
    location: Optional[ID]
    public_details: auto
    private_details: auto
    is_submitted: auto
    interacted_at: auto


@strawberry_django.input(models.Note)
class UpdateNoteLocationInput:
    id: ID
    location: LocationInput


@strawberry_django.input(models.Task)
class UpdateTaskLocationInput:
    id: ID
    location: LocationInput


@strawberry_django.input(models.Note)
class RevertNoteInput:
    id: ID
    revert_before_timestamp: datetime


@strawberry_django.filters.filter(User)
class InteractionAuthorFilter:
    @strawberry_django.filter_field
    def search(self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str) -> Tuple[QuerySet[User], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split(" ")
        query = Q()

        for term in search_terms:
            q_search = Q(Q(first_name__icontains=term) | Q(last_name__icontains=term) | Q(middle_name__icontains=term))

            query &= q_search

        return (
            queryset.filter(query),
            Q(),
        )


@strawberry_django.ordering.order(User)
class InteractionAuthorOrder:
    first_name: auto
    last_name: auto
    id: auto


@strawberry_django.type(User, filters=InteractionAuthorFilter, order=InteractionAuthorOrder)  # type: ignore[literal-required]
class InteractionAuthorType:
    id: ID
    first_name: auto
    last_name: auto
    middle_name: auto


# Data Import
@strawberry_django.input(models.NoteDataImport)
class CreateNoteDataImportInput:
    source_file: str
    notes: str


@strawberry_django.input(models.NoteImportRecord)
class ImportNoteInput:
    import_job_id: auto
    source_id: auto
    source_name: auto
    raw_data: auto
    note: CreateNoteInput


# Output types for note import
@strawberry_django.type(models.NoteDataImport)
class NoteDataImportType:
    id: auto
    imported_at: auto
    source_file: auto
    notes: auto
    imported_by: auto


@strawberry_django.type(models.NoteImportRecord)
class NoteImportRecordType:
    id: auto
    source_id: auto
    source_name: auto
    success: auto
    error_message: auto
    created_at: auto
    note: Optional[NoteType]
    raw_data: auto
