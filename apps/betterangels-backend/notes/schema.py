from dataclasses import asdict
from typing import List, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from common.graphql.types import DeleteDjangoObjectInput
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.models import Note, Task
from notes.permissions import NotePermissions, PrivateNotePermissions
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .types import (
    CreateNoteInput,
    CreateTaskInput,
    NoteType,
    TaskType,
    UpdateNoteInput,
    UpdateTaskInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[HasPerm(NotePermissions.VIEW)],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    task: TaskType = strawberry_django.field()

    tasks: List[TaskType] = strawberry_django.field()


@strawberry.type
class Mutation:
    # Notes
    @strawberry_django.mutation(extensions=[HasPerm(NotePermissions.ADD)])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        with transaction.atomic():
            user = get_current_user(info)
            # TODO: Handle creating Notes without existing Client.
            # if not data.client:
            #     User.create_client()

            # WARNING: Temporary workaround for organization selection
            # TODO: Update once organization selection is implemented. Currently selects
            # the first organization with a default Caseworker role for the user.
            permission_group = (
                PermissionGroup.objects.select_related("organization", "group")
                .filter(
                    organization__users=user,
                    name=GroupTemplateNames.CASEWORKER,
                )
                .first()
            )

            if not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            client = User(id=data.client.id) if data.client else None
            note_data = asdict(data)
            note = resolvers.create(
                info,
                Note,
                {
                    **note_data,
                    "created_by": user,
                    "client": client,
                    "organization": permission_group.organization,
                },
            )

            # Assign object-level permissions to the user who created the note.
            # Each perm assignment is 2 SQL queries. Maybe move to 1 perm?
            permissions = [
                NotePermissions.CHANGE,
                NotePermissions.DELETE,
                PrivateNotePermissions.VIEW,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, note)

            return cast(NoteType, note)

    update_note: NoteType = mutations.update(
        UpdateNoteInput,
        extensions=[
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ],
    )

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=NotePermissions.DELETE),
        ],
    )

    @strawberry_django.mutation()
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            client = User(id=data.client.id) if data.client else None
            task_data = asdict(data)
            task = resolvers.create(
                info,
                Task,
                {
                    **task_data,
                    "created_by": user,
                    "client": client,
                },
            )

            return cast(TaskType, task)

    update_task: TaskType = mutations.update(UpdateTaskInput)
    delete_task: TaskType = mutations.delete(DeleteDjangoObjectInput)
