from datetime import datetime
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.types import UserType
from common.graphql.types import AttachmentInterface, LocationInput, LocationType
from common.models import Attachment
from django.db.models import Case, Exists, F, Q, QuerySet, Value, When
from notes.enums import NoteNamespaceEnum, ServiceRequestTypeEnum, TaskTypeEnum
from notes.permissions import PrivateDetailsPermissions
from strawberry import ID, Info, auto
from strawberry.file_uploads import Upload
from strawberry_django.auth.utils import get_current_user
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
    id: auto
    service: auto
    custom_service: auto
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
    client: Optional[ID]


@strawberry_django.input(models.ServiceRequest)
class CreateNoteServiceRequestInput:
    service: auto
    custom_service: Optional[str]
    note_id: ID
    service_request_type: ServiceRequestTypeEnum


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: auto
    custom_service: auto
    status: auto
    due_by: auto
    client: Optional[ID]


@strawberry_django.type(models.Task, pagination=True)
class TaskType:
    id: auto
    title: auto
    location: Optional[LocationType]
    status: auto
    due_by: auto
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
    note_id: ID
    task_type: TaskTypeEnum


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: auto
    title: auto
    location: Optional[ID]
    status: auto
    due_by: auto
    client: Optional[ID]


@strawberry_django.type(models.Mood)
class MoodType:
    id: auto
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


@strawberry_django.filters.filter(models.Note)
class NoteFilter:
    client: auto
    created_by: auto
    is_submitted: auto

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
    def user_created(
        self, queryset: QuerySet, info: Info, value: Optional[bool], prefix: str
    ) -> Tuple[QuerySet[models.Note], Q]:
        if value:
            user = get_current_user(info)

            return (queryset.filter(created_by=user), Q())

        return queryset, Q()


@strawberry_django.type(models.Note, pagination=True, filters=NoteFilter, order=NoteOrder)  # type: ignore[literal-required]
class NoteType:
    id: auto
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
    title: auto
    public_details: auto
    private_details: auto
    client: Optional[ID]


@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: auto
    title: auto
    location: Optional[ID]
    public_details: auto
    private_details: auto
    is_submitted: auto
    interacted_at: auto


@strawberry_django.input(models.Note)
class UpdateNoteLocationInput:
    id: auto
    location: LocationInput


@strawberry_django.input(models.Task)
class UpdateTaskLocationInput:
    id: auto
    location: LocationInput


@strawberry_django.input(models.Note)
class RevertNoteInput:
    id: auto
    saved_at: datetime


@strawberry.type
class DeletedObjectType:
    id: int
