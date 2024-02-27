import dataclasses
from typing import List, Optional

import strawberry_django
from accounts.types import UserType
from notes.permissions import PrivateNotePermissions
from strawberry import auto
from strawberry_django.permissions import HasSourcePerm

from . import models


@strawberry_django.type(models.Mood)
class MoodType:
    descriptor: auto


@dataclasses.dataclass
@strawberry_django.input(models.Mood)
class CreateMoodInput:
    descriptor: auto


@dataclasses.dataclass
@strawberry_django.type(models.ProvidedService)
class ProvidedServiceType:
    descriptor: auto
    custom_descriptor: Optional[str]


@dataclasses.dataclass
@strawberry_django.type(models.RequestedService)
class RequestedServiceType:
    descriptor: auto
    custom_descriptor: Optional[str]


@dataclasses.dataclass
@strawberry_django.input(models.ProvidedService)
class ProvidedServiceInput:
    descriptor: auto
    custom_descriptor: Optional[str]


@dataclasses.dataclass
@strawberry_django.input(models.RequestedService)
class RequestedServiceInput:
    descriptor: auto
    custom_descriptor: Optional[str]


@dataclasses.dataclass
@strawberry_django.type(models.Task)
class TaskType:
    id: auto
    title: auto
    status: auto
    due_date: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType


@dataclasses.dataclass
@strawberry_django.input(models.Task)
class CreateTaskInput:
    id: auto
    title: auto
    status: auto
    due_date: auto
    client: Optional[UserType]
    created_at: auto


@dataclasses.dataclass
@strawberry_django.input(models.Task, partial=True)
class UpdateTaskInput:
    id: auto
    title: auto
    status: auto
    due_date: auto
    client: Optional[UserType]
    created_at: auto


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    timestamp: auto
    public_details: auto
    provided_services: List[ProvidedServiceType]
    requested_services: List[RequestedServiceType]
    moods: List[MoodType]
    is_submitted: auto
    client: Optional[UserType]
    created_at: auto
    created_by: UserType
    private_details: Optional[str] = strawberry_django.field(
        extensions=[HasSourcePerm(PrivateNotePermissions.VIEW)],
    )


@dataclasses.dataclass
@strawberry_django.input(models.User)
class UserInput:
    id: auto


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    public_details: auto
    private_details: auto
    client: Optional[UserInput]


@dataclasses.dataclass
@strawberry_django.input(models.Note, partial=True)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    private_details: auto
    moods: Optional[List[CreateMoodInput]]
    provided_services: Optional[List[ProvidedServiceInput]]
    requested_services: Optional[List[RequestedServiceInput]]
    is_submitted: auto
