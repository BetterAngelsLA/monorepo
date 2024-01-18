from typing import List, Optional, cast

import strawberry
import strawberry_django
from guardian.shortcuts import assign_perm, get_objects_for_user
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasPerm, HasRetvalPerm, IsAuthenticated

from .models import Note
from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.VIEW.value]),
        ],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.VIEW.value]),
        ],
        pagination=True,
    )


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_note(self, info: Info, input: CreateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        if user.is_authenticated:
            note = Note.objects.create(
                created_by=user, title=input.title, body=input.body
            )
            assign_perm(NotePermissions.VIEW.value, user, note)
            assign_perm(NotePermissions.CHANGE.value, user, note)
            assign_perm(NotePermissions.DELETE.value, user, note)
            return note
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
