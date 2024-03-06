import dataclasses
from typing import List, Optional

import strawberry_django
from accounts.types import UserInput, UserType
from notes.permissions import PrivateNotePermissions
from strawberry import auto
from strawberry_django.permissions import HasSourcePerm

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Task, pagination=True)
class TaskType:
    id: auto
    title: auto
    status: auto
    due_by: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType


@dataclasses.dataclass
@strawberry_django.input(models.Task)
class CreateTaskInput:
    title: auto
    status: auto
    due_by: auto
    client: Optional[UserInput]
    created_at: auto


@dataclasses.dataclass
@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: auto
    title: auto
    status: auto
    due_by: auto
    client: Optional[UserInput]
    created_at: auto


@strawberry_django.type(models.Mood)
class MoodType:
    descriptor: auto


@dataclasses.dataclass
@strawberry_django.input(models.Mood)
class CreateMoodInput:
    descriptor: auto


@dataclasses.dataclass
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
    private_details: Optional[str] = strawberry_django.field(
        extensions=[HasSourcePerm(PrivateNotePermissions.VIEW)],
    )


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    public_details: auto
    private_details: auto
    client: Optional[UserInput]


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    private_details: auto
    moods: Optional[List[CreateMoodInput]]
    is_submitted: auto
