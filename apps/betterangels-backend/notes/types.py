import dataclasses

import strawberry_django
from accounts.types import UserType
from strawberry import auto

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    body: auto
    created_at: auto
    created_by: UserType


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    body: auto


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    body: auto
