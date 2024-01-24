from typing import List, Optional, cast

import strawberry
import strawberry_django
from django.db.models import QuerySet
from guardian.shortcuts import assign_perm, get_objects_for_user
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasRetvalPerm, IsAuthenticated

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
        ]
    )


@strawberry.type
class Mutation:
    @strawberry.mutation(
        extensions=[
            IsAuthenticated(),
        ]
    )
    def create_note(self, info: Info, input: CreateNoteInput) -> Optional[NoteType]:
        user = get_current_user(info)
        note = Note.objects.create(created_by=user, title=input.title, body=input.body)
        # Assign object-level permissions to the user who created the note
        for perm in [
            NotePermissions.VIEW.value,
            NotePermissions.CHANGE.value,
            NotePermissions.DELETE.value,
        ]:
            assign_perm(perm, user, note)
        return cast(NoteType, note)

    update_note: NoteType = mutations.update(
        UpdateNoteInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.CHANGE.value]),
        ],
    )

    @strawberry.mutation(extensions=[IsAuthenticated()])
    def delete_note(self, info: Info, id: strawberry.ID) -> bool:
        user = get_current_user(info)

        # Get the queryset of notes the user has permission to delete
        notes_with_delete_permission = cast(
            QuerySet[Note],
            get_objects_for_user(user, NotePermissions.DELETE.value, klass=Note),
        )

        # Delete the note with the specified ID, if it exists in the queryset
        deleted_count, _ = notes_with_delete_permission.filter(id=id).delete()

        return deleted_count > 0
