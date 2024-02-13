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
from strawberry_django.permissions import HasRetvalPerm, IsAuthenticated

from .models import Note
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
        #     User.create_client()

        client_id = data.client.id if data.client else None

        note = Note.objects.create(
            title=data.title,
            public_details=data.public_details,
            created_by=user,
            client_id=client_id,
        )

        # Assign object-level permissions to the user who created the note.
        # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
        for perm in [
            NotePermissions.VIEW,
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
        ]:
            assign_perm(perm, user, note)

        return cast(NoteType, note)

    # @strawberry.mutation(
    #     extensions=[
    #         IsAuthenticated(),
    #         HasRetvalPerm(perms=[NotePermissions.CHANGE]),
    #     ]
    # )
    # @transaction.atomic()
    # def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
    #     # note = NoteService.update_note(
    #     #     id=data.id,
    #     #     title=data.title,
    #     #     public_details=data.public_details,
    #     #     is_submitted=data.is_submitted,
    #     # )
    #     from IPython import embed

    #     embed()
    #     note = Note.objects.get(pk=id)

    #     mood_titles = (
    #         [mood.title for mood in data.moods if mood.title] if data.moods else []
    #     )

    #     for field in data:
    #         note.field = data.field
    #     # if title:
    #     #     note.title = title
    #     # if public_details:
    #     #     note.public_details = public_details
    #     # if is_submitted:
    #     #     note.is_submitted = is_submitted

    #     note.save()

    # if mood_titles:
    #     Mood.objects.filter(note=note).delete()
    #     mood_instances = [Mood(title=title, note=note) for title in mood_titles]
    #     Mood.objects.bulk_create(mood_instances)

    # return note

    # return cast(NoteType, note)

    update_note: NoteType = mutations.update(
        UpdateNoteInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ],
    )

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.DELETE]),
        ],
    )
