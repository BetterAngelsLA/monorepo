from typing import Optional, cast

import strawberry
import strawberry_django
from common.graphql.types import PaginatedResponse
from common.graphql.utils import paginate_queryset
from django.db.models import QuerySet
from guardian.shortcuts import assign_perm, get_objects_for_user
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django import NodeInput, mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginationInput
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

    @strawberry_django.field(
        extensions=[IsAuthenticated()],
    )
    def notes(
        self,
        info: strawberry.types.Info,
        pagination: Optional[OffsetPaginationInput] = None,
    ) -> PaginatedResponse[NoteType]:
        user = get_current_user(info)
        available_notes: QuerySet[Note] = get_objects_for_user(
            user, [NotePermissions.VIEW.value], Note
        )
        return paginate_queryset(available_notes, pagination)


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
        UpdateNoteInput, extensions=[IsAuthenticated()]
    )
    delete_note: NoteType = mutations.delete(NodeInput, extensions=[IsAuthenticated()])
