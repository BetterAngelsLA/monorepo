from dataclasses import asdict
from typing import List, cast
from notes.enums import TaskStatusEnum

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

from .models import Mood, Note, Task
from .types import CreateNoteInput, NoteType, UpdateNoteInput


from strawberry.unset import UnsetType


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

        # TODO: refactor using resolvers
        # task = resolvers.update(info, Task, task_data)
        existing_tasks = None

        if data.parent_tasks and not isinstance(data.parent_tasks, UnsetType):
            if attached_tasks := [
                t.id for t in data.parent_tasks if not isinstance(t.id, UnsetType)
            ]:
                existing_tasks = Task.objects.filter(id__in=attached_tasks)

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
    @strawberry.mutation(
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ]
    )
    @transaction.atomic()
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        # TODO: clean all this up
        FLAT_FIELDS = ("title", "public_details")
        TASK_DRAFT_STATUS_MAP = {
            TaskStatusEnum.DRAFT_CANCELED.value: TaskStatusEnum.CANCELED.value,
            TaskStatusEnum.DRAFT_COMPLETED.value: TaskStatusEnum.COMPLETED.value,
            TaskStatusEnum.IN_PROGRESS.value: TaskStatusEnum.IN_PROGRESS.value,
        }

        user = get_current_user(info)
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
        existing_tasks = None
        new_tasks = None

        if data.moods:
            moods = Mood.objects.filter(title__in=[mood.title for mood in data.moods])
            note.moods.set(moods)

        # TODO: refactor using strawberry resolver
        if data.parent_tasks and not isinstance(data.parent_tasks, UnsetType):
            if attached_tasks := [
                t for t in data.parent_tasks if not isinstance(t.id, UnsetType)
            ]:
                task_updates = {
                    t.id: {"status": t.status, "title": t.title} for t in attached_tasks
                }
                existing_tasks = Task.objects.filter(id__in=task_updates.keys())
                for existing_task in existing_tasks:
                    updated_status = task_updates[existing_task.id]["status"]
                    if updated_status and not isinstance(updated_status, UnsetType):
                        existing_task.status = updated_status

                    updated_title = task_updates[existing_task.id]["title"]
                    if updated_title and not isinstance(updated_title, UnsetType):
                        existing_task.title = updated_title

                    if data.is_submitted:
                        existing_task.status = TASK_DRAFT_STATUS_MAP[
                            existing_task.status
                        ]

                    existing_task.save()

            # TODO: add location + due_date
            if new_tasks := [
                t for t in data.parent_tasks if isinstance(t.id, UnsetType)
            ]:
                created_tasks = []
                for new_task in new_tasks:
                    task_data = dict(
                        title=new_task.title,
                        status=TaskStatusEnum.COMPLETED.value
                        if data.is_submitted
                        else new_task.status,
                        created_by=user,
                        client=note.client,
                    )

                    created_tasks.append(resolvers.create(info, Task, task_data))

        # All delete tasks that were removed
        note.parent_tasks.clear()
        if existing_tasks:
            note.parent_tasks.add(*list(existing_tasks))

        if new_tasks:
            note.parent_tasks.add(*list(created_tasks))

        return cast(NoteType, note)

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            IsAuthenticated(),
            HasRetvalPerm(perms=[NotePermissions.DELETE]),
        ],
    )
