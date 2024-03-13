from datetime import datetime
from typing import List, Optional

import strawberry_django
from accounts.types import UserInput, UserType
from django.db.models import Case, Exists, F, Value, When
from notes.permissions import PrivateDetailsPermissions
from strawberry import auto
from strawberry_django.utils.query import filter_for_user

from . import models


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
    client: Optional[UserInput]


@strawberry_django.input(models.ServiceRequest, partial=True)
class UpdateServiceRequestInput:
    id: auto
    custom_service: auto
    status: auto
    due_by: auto
    client: Optional[UserInput]


@strawberry_django.type(models.Task, pagination=True)
class TaskType:
    id: auto
    title: auto
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
    client: Optional[UserInput]


@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: auto
    title: auto
    status: auto
    due_by: auto
    client: Optional[UserInput]


@strawberry_django.type(models.Mood)
class MoodType:
    descriptor: auto


@strawberry_django.input(models.Mood)
class CreateMoodInput:
    descriptor: auto


@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    public_details: auto
    moods: List[MoodType]
    is_submitted: auto
    timestamp: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType

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
    client: Optional[UserInput]


@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    private_details: auto
    moods: Optional[List[CreateMoodInput]]
    is_submitted: auto
    timestamp: auto


@strawberry_django.input(models.Note)
class RevertNoteInput:
    id: auto
    saved_at: datetime
