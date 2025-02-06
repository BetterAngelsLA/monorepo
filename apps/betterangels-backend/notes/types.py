from datetime import datetime
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.models import User
from accounts.types import UserType
from common.graphql.types import AttachmentInterface, LocationInput, LocationType
from common.models import Attachment
from django.db.models import Case, Exists, F, Q, QuerySet, Value, When
from notes.enums import (
    DueByGroupEnum,
    NoteNamespaceEnum,
    SelahTeamEnum,
    ServiceRequestTypeEnum,
    TaskTypeEnum,
)
from notes.permissions import PrivateDetailsPermissions
from strawberry import ID, Info, auto
from strawberry.file_uploads import Upload
from strawberry_django.utils.query import filter_for_user

from . import models


@strawberry_django.filter(Attachment)
class NoteAttachmentFilter:
    attachment_type: auto
    namespace: NoteNamespaceEnum


@strawberry_django.type(Attachment, filters=NoteAttachmentFilter, pagination=True)
class NoteAttachmentType(AttachmentInterface):
    namespace: NoteNamespaceEnum


@strawberry_django.input(Attachment)
class CreateNoteAttachmentInput:
    note: ID
    file: Upload
    namespace: NoteNamespaceEnum


@strawberry_django.type(models.ServiceRequest, pagination=True)
class ServiceRequestType:
    id: ID
    service: auto
    custom_service: auto
    service_other: auto
    status: auto
    due_by: auto
    completed_on: auto
    client: Optional[UserType]
    created_by: UserType
    created_at: auto


@strawberry_django.input(models.ServiceRequest)
class CreateServiceRequestInput:
    service: auto
    status: auto
    custom_service: auto
    service_other: auto
    client: Optional[ID]


@strawberry_django.input(models.ServiceRequest)
class CreateNoteServiceRequestInput:
    service: auto
    custom_service: Optional[str]
    service_other: Optional[str]
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: ID
    custom_service: auto
    service_other: auto
    status: auto
    due_by: auto
    client: Optional[ID]


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
    client: Optional[UserType]
    created_at: auto
    created_by: UserType


@strawberry_django.input(models.Task)
class CreateTaskInput:
    title: auto
    status: auto
    due_by: auto
    client: Optional[ID]


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
    client: Optional[ID]


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
    client: Optional[ID]
    created_by: Optional[ID]
    is_submitted: auto
    organization: Optional[ID]

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
                Q(client__first_name__icontains=term)
                | Q(client__last_name__icontains=term)
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
        if value is None:
            return queryset, Q()

        return queryset.filter(team__in=value), Q()


@strawberry_django.type(models.Note, pagination=True, filters=NoteFilter, order=NoteOrder)  # type: ignore[literal-required]
class NoteType:
    id: ID
    purpose: auto
    team: Optional[SelahTeamEnum]
    title: auto
    location: Optional[LocationType]
    attachments: List[NoteAttachmentType]
    moods: List[MoodType]
    purposes: List[TaskType]
    next_steps: List[TaskType]
    provided_services: List[ServiceRequestType]
    requested_services: List[ServiceRequestType]
    public_details: auto
    is_submitted: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType
    interacted_at: auto

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
    title: Optional[str]
    public_details: auto
    private_details: auto
    client: Optional[ID]


@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: ID
    purpose: auto
    team: Optional[SelahTeamEnum]
    title: auto
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


@strawberry_django.type(User)
class InteractionAuthorType:
    id: ID
    first_name: auto
    last_name: auto
    middle_name: auto
