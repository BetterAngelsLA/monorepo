import dataclasses
from typing import Any, Dict, List, Optional

import strawberry_django
from accounts.types import UserType
from common.permissions.utils import get_objects_for_user
from django.db.models import QuerySet
from notes.permissions import PrivateNotePermissions
from strawberry import auto
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

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
@strawberry_django.type(models.PrivateNoteDetail)
class PrivateNoteDetailType:
    id: auto
    content: auto
    created_at: auto

    @classmethod
    def get_queryset(
        cls,
        queryset: QuerySet[models.PrivateNoteDetail],
        info: Info,
        **kwargs: Dict[str, Any]
    ) -> QuerySet[models.PrivateNoteDetail]:
        # As of 1-24-2024 we are unable to apply HasRetvalPerm to a paginated list.
        # Instead we use get_objects_for_user to enforce permissions.
        user = get_current_user(info)
        return get_objects_for_user(user, [PrivateNotePermissions.VIEW], klass=queryset)


@dataclasses.dataclass
@strawberry_django.type(models.Note, pagination=True)
class NoteType:
    id: auto
    title: auto
    public_details: auto
    private_details = auto
    created_at: auto
    created_by: UserType
    client: Optional[UserType]
    moods: List[MoodType]
    is_submitted: auto


@dataclasses.dataclass
@strawberry_django.input(models.User)
class UserInput:
    id: auto


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class CreateNoteInput:
    title: auto
    public_details: auto
    client: Optional[UserInput]


@dataclasses.dataclass
@strawberry_django.input(models.Note)
class UpdateNoteInput:
    id: auto
    title: auto
    public_details: auto
    moods: Optional[List[CreateMoodInput]]
    is_submitted: auto
