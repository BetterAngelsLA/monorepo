import dataclasses
from typing import List, Optional

import strawberry_django
from accounts.types import UserType
from common.permissions.utils import get_objects_for_user
from django.db.models import CharField, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce
from notes.permissions import PrivateNotePermissions
from strawberry import auto

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


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    public_details: auto
    client: Optional[UserType]
    moods: List[MoodType]

    is_submitted: auto

    created_at: auto
    created_by: UserType

    @strawberry_django.field(
        annotate={
            "_private_details": lambda info: Coalesce(
                Subquery(
                    get_objects_for_user(
                        info.context.request.user,
                        [PrivateNotePermissions.VIEW],
                        models.Note.objects.all(),
                    )
                    .filter(id=OuterRef("pk"))
                    .values("private_details")[:1],
                    output_field=CharField(),
                ),
                Value(None),
            )
        },
    )
    def private_details(self, root: models.Note) -> Optional[str]:
        return root._private_details  # type: ignore


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
@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    private_details: auto
    moods: Optional[List[CreateMoodInput]]
    is_submitted: auto
