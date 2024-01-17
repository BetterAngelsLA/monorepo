import dataclasses

import strawberry_django
from accounts.types import UserType
from strawberry import auto

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Note)
class NoteType:
    id: auto
    title: auto
    body: auto
    created_at: auto
    created_by: UserType


@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    body: auto


@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    body: auto
