import dataclasses
from typing import Any, Dict, List, Optional, cast

import strawberry_django
from accounts.types import UserType
from django.db.models import QuerySet
from guardian.shortcuts import get_objects_for_user
from notes.permissions import NotePermissions
from strawberry import auto
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from . import models


@dataclasses.dataclass
@strawberry_django.type(models.Mood)
class MoodType:
    id: auto
    title: auto


@dataclasses.dataclass
@strawberry_django.input(models.Mood)
class CreateMoodInput:
    title: auto


@dataclasses.dataclass
@strawberry_django.type(models.Task)
class TaskType:
    id: auto
    title: auto
    created_at: auto
    created_by: UserType


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    public_details: auto
    created_at: auto
    tasks: List[TaskType]
    moods: List[MoodType]

    @classmethod
    def get_queryset(
        cls, queryset: QuerySet[models.Note], info: Info, **kwargs: Dict[str, Any]
    ) -> QuerySet[models.Note]:
        # As of 1-24-2024 we are unable to apply HasRetvalPerm to a paginated list.
        # Instead we use get_objects_for_user to enforce permissions.
        user = get_current_user(info)
        return cast(
            QuerySet[models.Note],
            get_objects_for_user(user, NotePermissions.VIEW, klass=queryset),
        )


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    public_details: auto
    moods: Optional[List[CreateMoodInput]]


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
