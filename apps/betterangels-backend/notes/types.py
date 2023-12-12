import strawberry
from accounts.types import UserType

from . import models


@strawberry.django.type(models.Note)
class NoteType:
    id: int
    title: str
    body: str
    created_at: strawberry.auto
    created_by: UserType
