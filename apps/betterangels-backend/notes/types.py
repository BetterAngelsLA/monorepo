import dataclasses
from typing import List, Optional

import strawberry_django
from accounts.types import UserType
from django.db.models import OuterRef, Subquery
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
@strawberry_django.type(models.Service)
class ServiceType:
    descriptor: auto
    custom_descriptor: Optional[str]


@dataclasses.dataclass
@strawberry_django.input(models.Service)
class CreateServiceInput:
    descriptor: auto
    custom_descriptor: Optional[str]


@strawberry_django.type(
    models.Note,
    pagination=True,
)
class NoteType:
    id: auto
    title: auto
    public_details: auto
    client: Optional[UserType]
    moods: List[MoodType]

    is_submitted: auto

    created_at: auto
    created_by: UserType

    private_details: Optional[str] = strawberry_django.field(
        extensions=[HasSourcePerm(PrivateNotePermissions.VIEW)],
    )

    history_id: int = strawberry_django.field(
        annotate=Subquery(
            models.Note.history.model.objects.filter(id=OuterRef("pk"))
            .order_by("-history_date")
            .values("id")[:1]
        )
    )


@strawberry_django.input(models.User)
class UserInput:
    id: auto


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


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class RevertNoteVersionInput:
    id: auto
    history_id: int
