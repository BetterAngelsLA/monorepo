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

from .models import Note, Task
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
        # TODO: clean all this up
        # print("&" * 100)
        # print(data)

        # TODO update status
        # TODO: refactor using resolvers
        # task = resolvers.update(info, Task, task_data)
        if existing_tasks := Task.objects.filter(
            id__in=[t.id for t in data.parent_tasks if type(t.id) == int]
        ):
            print(existing_tasks)

        # TODO: add location + due_date
        # TODO: refactor using resolvers
        # task = resolvers.create(info, Task, task_data)
        if new_tasks := [t for t in data.parent_tasks if type(t.id) != int]:
            created_tasks = Task.objects.bulk_create(
                [
                    Task(
                        title=t.title,
                        created_by=user,
                        # TODO: need to create contract for client
                        client=user,
                    )
                    for t in new_tasks
                ]
            )

        print("&" * 100)
        print(data)
        note_data = dict(
            title=data.title,
            public_details=data.public_details,
            created_by=user,
            client=getattr(data.client, "id", None),
            # TODO: add rest of fields
        )

        note = resolvers.create(info, Note, note_data)
        if existing_tasks:
            note.parent_tasks.add(*list(existing_tasks))

        if new_tasks:
            note.parent_tasks.add(*list(created_tasks))

        # Assign object-level permissions to the user who created the note.
        # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
        for perm in [
            NotePermissions.VIEW,
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
        ]:
            assign_perm(perm, user, note)
        return cast(NoteType, note)

    # TODO: make atomic
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
