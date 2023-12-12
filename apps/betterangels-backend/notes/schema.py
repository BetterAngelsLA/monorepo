from typing import List, Optional

import strawberry
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from .models import Note
from .types import NoteType


@strawberry.type
class Query:
    @strawberry.field
    def notes(self, info: Info) -> List[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            return list(Note.objects.filter(created_by=user))  # type: ignore
        else:
            return []

    @strawberry.field
    def note(self, id: strawberry.ID, info: Info) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            return Note.objects.get(id=id)  # type: ignore
        else:
            return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_note(self, info: Info, title: str, body: str) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            return Note.objects.create(created_by=user, title=title, body=body)  # type: ignore
        else:
            return None

    @strawberry.mutation
    def update_note(
        self, info: Info, id: strawberry.ID, title: str, body: str
    ) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            note = Note.objects.get(id=id)
            note.title = title
            note.body = body
            note.save()
            return note  # type: ignore
        else:
            return None

    @strawberry.mutation
    def delete_note(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = get_current_user(info)
        if user.is_authenticated:
            # Need to figure out types here
            note = Note.objects.get(id=id)
            note.delete()
            return True
        else:
            return False
