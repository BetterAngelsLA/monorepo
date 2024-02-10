from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from common.graphql.types import DeleteDjangoObjectInput
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.permissions import NotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasRetvalPerm, IsAuthenticated

from .models import Mood, Note
from .services import NoteService
from .types import CreateNoteInput, NoteType, UpdateNoteInput


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.VIEW]),
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
    @transaction.atomic()
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        user = get_current_user(info)

        # TODO: Handle creating Notes without existing Client.
        # if not data.client:
        #     ClientService.create_client()

        client_id = data.client.id if data.client else None

        note = NoteService.create_note(
            title=data.title,
            public_details=data.public_details,
            user=user,
            client_id=client_id,
        )

        return cast(NoteType, note)

    @strawberry.mutation(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ]
    )
    @transaction.atomic()
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        note = NoteService.update_note(
            id=data.id,
            title=data.title,
            public_details=data.public_details,
            is_submitted=data.is_submitted,
            mood_titles=[mood.title for mood in data.moods if mood.title]
            if data.moods
            else [],
        )

        return cast(NoteType, note)

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.DELETE]),
        ],
    )
