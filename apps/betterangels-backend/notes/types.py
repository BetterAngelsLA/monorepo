from typing import List, Optional

import strawberry_django
from accounts.types import UserInput, UserType
from django.db.models import Case, Exists, F, Value, When
from notes.permissions import PrivateNotePermissions
from strawberry import auto
from strawberry_django.utils.query import filter_for_user

from . import models


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
    client: Optional[UserType]
    moods: List[MoodType]
    is_submitted: auto
    timestamp: auto
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
                            [PrivateNotePermissions.VIEW],
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


@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    private_details: auto
    moods: Optional[List[CreateMoodInput]]
    is_submitted: auto
