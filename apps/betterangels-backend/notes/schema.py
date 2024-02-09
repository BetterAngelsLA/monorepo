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

        note_data = dict(
            title=data.title,
            public_details=data.public_details,
            created_by=user,
            client=getattr(data.client, "id", None),
            # TODO: add rest of fields
        )

        note = resolvers.create(info, Note, note_data)

        # Assign object-level permissions to the user who created the note.
        # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
        for perm in [
            NotePermissions.VIEW,
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
        ]:
            assign_perm(perm, user, note)
        return cast(NoteType, note)

    @strawberry.mutation(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ]
    )
    @transaction.atomic()
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        FLAT_FIELDS = ("title", "public_details")

        note = Note.objects.get(pk=data.id)
        update_fields = [
            (field, value)
            for field, value in asdict(data).items()
            if field in FLAT_FIELDS
        ]
        for field, value in update_fields:
            if value is not None:
                setattr(note, field, value)

        note.save()

        if data.moods:
            mood_instances = [Mood(title=mood.title, note=note) for mood in data.moods]
            Mood.objects.bulk_create(mood_instances)

        return cast(NoteType, note)

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.DELETE]),
        ],
    )
