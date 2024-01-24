import dataclasses
from notes.permissions import NotePermissions

import strawberry_django
from accounts.types import UserType
from strawberry import auto

from . import models
from typing import Any, Dict, cast
from django.db.models import QuerySet
from guardian.shortcuts import get_objects_for_user
from strawberry_django.auth.utils import get_current_user
from strawberry.types import Info


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    body: auto
    created_at: auto
    created_by: UserType

    @classmethod
    def get_queryset(
        cls, queryset: QuerySet[models.Note], info: Info, **kwargs: Dict[str, Any]
    ) -> QuerySet[models.Note]:
        user = get_current_user(info)
        return cast(
            QuerySet[models.Note],
            get_objects_for_user(user, NotePermissions.VIEW.value, klass=queryset),
        )


@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    body: auto


@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    body: auto
