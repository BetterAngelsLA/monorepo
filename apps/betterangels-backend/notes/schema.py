from dataclasses import asdict
from typing import List, cast
from common.graphql.types import DeleteModelInput

import strawberry
import strawberry_django
from guardian.shortcuts import assign_perm
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.permissions import HasRetvalPerm, IsAuthenticated
from strawberry_django.mutations import resolvers

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
            # As of 1-24-2024 we are unable to apply HasRetvalPerm to a paginated list.
            # Instead we enforce permissions within get_queryset on NoteType.
        ],
        pagination=True,
    )


@strawberry.type
class Mutation:
    @strawberry.mutation(
        extensions=[
            IsAuthenticated(),
        ]
    )
    def create_note(self, info: Info, input: CreateNoteInput) -> NoteType:
        user = get_current_user(info)

        note = resolvers.create(
            info,
            Note,
            {
                **asdict(input),
                "created_by": user,
            },
        )
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

    delete_note: NoteType = mutations.delete(
        DeleteModelInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.DELETE.value]),
        ],
    )
