from typing import List, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from common.graphql.types import DeleteDjangoObjectInput
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from guardian.shortcuts import assign_perm, get_objects_for_user
from notes.models import Note, Task
from notes.permissions import NotePermissions, PrivateNotePermissions, TaskPermissions
from strawberry import asdict
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .types import (
    CreateNoteAttachmentInput,
    CreateNoteInput,
    CreateTaskInput,
    NoteAttachmentType,
    NoteType,
    RevertNoteInput,
    TaskType,
    UpdateNoteInput,
    UpdateTaskInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    task: TaskType = strawberry_django.field(
        extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )

    tasks: List[TaskType] = strawberry_django.field(
        extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )


@strawberry.type
class Mutation:
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

            permissions = [
                NotePermissions.CHANGE,
                NotePermissions.DELETE,
                PrivateNotePermissions.VIEW,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, note)

            # Annotated Fields for Permission Checks. This is a workaround since
            # annotations are not applied during mutations.
            note._private_details = note.private_details

            return cast(NoteType, note)

    @strawberry_django.mutation(extensions=[HasRetvalPerm(NotePermissions.CHANGE)])
    def revert_note(self, info: Info, data: RevertNoteInput) -> NoteType:
        revert_to_note = Note.objects.get(id=data.id).log.as_of(data.saved_at)
        # saving a historical note as of a specific moment reverts the note and
        # its associated models to their states at that moment in history
        revert_to_note.save()

        return cast(NoteType, revert_to_note)

    @strawberry_django.mutation(
        extensions=[HasRetvalPerm(perms=[NotePermissions.CHANGE])]
    )
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        with transaction.atomic():
            note_data = asdict(data)
            note = Note.objects.get(id=data.id)
            note = resolvers.update(
                info,
                note,
                {
                    **note_data,
                },
            )

            # Annotated Fields for Permission Checks. This is a workaround since
            # annotations are not applied during mutations.
            note._private_details = note.private_details

            return cast(NoteType, note)

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=NotePermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(AttachmentPermissions.ADD)])
    def create_note_attachment(
        self, info: Info, data: CreateNoteAttachmentInput
    ) -> NoteAttachmentType:
        user = cast(User, get_current_user(info))

        note = get_objects_for_user(
            user, [NotePermissions.CHANGE], Note.objects.all()
        ).get(id=data.note)

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

        content_type = ContentType.objects.get_for_model(Note)
        attachment = Attachment.objects.create(
            file=data.file,
            namespace=data.namespace,
            content_type=content_type,
            object_id=note.id,
            uploaded_by=user,
            associated_with=note.client,
        )

        assign_perm(AttachmentPermissions.DELETE, permission_group.group, attachment)

        return cast(NoteAttachmentType, attachment)

    delete_note_attachment: NoteAttachmentType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=AttachmentPermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(TaskPermissions.ADD)])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)

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

            permissions = [
                TaskPermissions.VIEW,
                TaskPermissions.CHANGE,
                TaskPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, task)

            return cast(TaskType, task)

    @strawberry_django.mutation(
        extensions=[HasRetvalPerm(perms=[TaskPermissions.CHANGE])]
    )
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        with transaction.atomic():
            client = User(id=data.client.id) if data.client else None
            task_data = asdict(data)
            task = Task.objects.get(id=data.id)
            task = resolvers.update(
                info,
                task,
                {
                    **task_data,
                    "client": client,
                },
            )

            return cast(TaskType, task)

    delete_task: TaskType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=TaskPermissions.DELETE),
        ],
    )
