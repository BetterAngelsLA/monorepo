from typing import List, Optional, cast

import strawberry
import strawberry_django
from guardian.shortcuts import get_objects_for_user
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasPerm, IsAuthenticated

from .models import Note
from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    @strawberry_django.field(
        extensions=[IsAuthenticated(), HasPerm(NotePermissions.VIEW.value)],
    )
    def note(self, info: Info) -> Optional[NoteType]:
        user = get_current_user(info)
        note = get_objects_for_user(user, NotePermissions.VIEW.value, Note).first()
        return cast(Optional[NoteType], note)

    @strawberry_django.field(
        extensions=[IsAuthenticated(), HasPerm(NotePermissions.VIEW.value)],
        pagination=True,
    )
    def notes(self, info: Info) -> List[NoteType]:
        user = get_current_user(info)
        notes = get_objects_for_user(user, NotePermissions.VIEW.value, Note)
        return cast(List[NoteType], notes)


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_note(self, info: Info, input: CreateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            note = Note.objects.create(
                created_by=user, title=input.title, body=input.body
            )
            return NoteType(**note.__dict__)
        return None

    @strawberry.mutation
    def update_note(self, info: Info, input: UpdateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            note = Note.objects.get(id=input.id)
            note.title = input.title
            note.body = input.body
            note.save()
            return NoteType(**note.__dict__)
        return None

    @strawberry.mutation
    def delete_note(
        self,
        info: Info,
        id: strawberry.ID,
    ) -> bool:
        user = get_current_user(info)
        if user.is_authenticated:
            note = Note.objects.get(id=id)
            note.delete()
            return True
        return False
