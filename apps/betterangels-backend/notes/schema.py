from typing import List, cast

import strawberry
import strawberry_django
from accounts.models import User
from common.graphql.types import DeleteDjangoObjectInput
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models.expressions import Subquery
from guardian.shortcuts import assign_perm
from notes.enums import ServiceRequestStatusEnum, ServiceRequestTypeEnum, TaskTypeEnum
from notes.models import Mood, Note, ServiceRequest, Task
from notes.permissions import (
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
    TaskPermissions,
)
from notes.utils import get_user_permission_group
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
    CreateNoteMoodInput,
    CreateNoteServiceRequestInput,
    CreateNoteTaskInput,
    CreateServiceRequestInput,
    CreateTaskInput,
    DeletedObjectType,
    MoodType,
    NoteAttachmentType,
    NoteFilter,
    NoteType,
    RevertNoteInput,
    ServiceRequestType,
    TaskType,
    UpdateNoteInput,
    UpdateServiceRequestInput,
    UpdateTaskInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)], filters=NoteFilter
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    note_attachment: NoteAttachmentType = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    note_attachments: List[NoteAttachmentType] = strawberry_django.field(
        extensions=[HasRetvalPerm(AttachmentPermissions.VIEW)],
    )

    service_request: ServiceRequestType = strawberry_django.field(
        extensions=[HasRetvalPerm(ServiceRequestPermissions.VIEW)]
    )

    service_requests: List[ServiceRequestType] = strawberry_django.field(
        extensions=[HasRetvalPerm(ServiceRequestPermissions.VIEW)]
    )

    task: TaskType = strawberry_django.field(
        extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )

    tasks: List[TaskType] = strawberry_django.field(
        extensions=[HasRetvalPerm(TaskPermissions.VIEW)]
    )


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

            permission_group = get_user_permission_group(user)
            if not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            note_data = asdict(data)
            note = resolvers.create(
                info,
                Note,
                {
                    **note_data,
                    "created_by": user,
                    "organization": permission_group.organization,
                },
            )

            permissions = [
                NotePermissions.CHANGE,
                NotePermissions.DELETE,
                PrivateDetailsPermissions.VIEW,
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
        with transaction.atomic():
            user = cast(User, get_current_user(info))
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=data.note)

            permission_group = get_user_permission_group(user)
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

            permissions = [
                AttachmentPermissions.VIEW,
                AttachmentPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, attachment)

            return cast(NoteAttachmentType, attachment)

    delete_note_attachment: NoteAttachmentType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=AttachmentPermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(NotePermissions.ADD)])
    def create_note_mood(self, info: Info, data: CreateNoteMoodInput) -> MoodType:
        with transaction.atomic():
            user = get_current_user(info)

            mood_data = asdict(data)
            note_id = str(mood_data.pop("note_id"))

            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=note_id)
            permission_group = get_user_permission_group(user)

            if not note or not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            mood = resolvers.create(
                info,
                Mood,
                {**mood_data, "note": note},
            )

            return cast(MoodType, mood)

    @strawberry_django.mutation(extensions=[HasPerm(NotePermissions.ADD)])
    def delete_mood(
        self, info: Info, data: DeleteDjangoObjectInput
    ) -> DeletedObjectType:
        user = get_current_user(info)
        mood_id, _ = Mood.objects.filter(
            id=data.id,
            note_id__in=Subquery(
                filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).values("id")
            ),
        ).delete()

        return DeletedObjectType(id=mood_id)

    @strawberry_django.mutation(extensions=[HasPerm(ServiceRequestPermissions.ADD)])
    def create_service_request(
        self, info: Info, data: CreateServiceRequestInput
    ) -> ServiceRequestType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

            if not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            service_request_data = asdict(data)
            service_request = resolvers.create(
                info,
                ServiceRequest,
                {
                    **service_request_data,
                    "created_by": user,
                },
            )

            permissions = [
                ServiceRequestPermissions.VIEW,
                ServiceRequestPermissions.CHANGE,
                ServiceRequestPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, service_request)

            return cast(ServiceRequestType, service_request)

    @strawberry_django.mutation(extensions=[HasPerm(ServiceRequestPermissions.ADD)])
    def create_note_service_request(
        self, info: Info, data: CreateNoteServiceRequestInput
    ) -> ServiceRequestType:
        with transaction.atomic():
            user = get_current_user(info)
            service_request_data = asdict(data)
            service_request_type = str(service_request_data.pop("service_request_type"))
            note_id = str(service_request_data.pop("note_id"))
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=note_id)
            permission_group = get_user_permission_group(user)

            if not note or not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            service_request = resolvers.create(
                info,
                ServiceRequest,
                {
                    **service_request_data,
                    "status": (
                        ServiceRequestStatusEnum.TO_DO
                        if service_request_type == ServiceRequestTypeEnum.REQUESTED
                        else ServiceRequestStatusEnum.COMPLETED
                    ),
                    "client": note.client,
                    "created_by": user,
                },
            )

            permissions = [
                ServiceRequestPermissions.VIEW,
                ServiceRequestPermissions.CHANGE,
                ServiceRequestPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, service_request)

            if service_request_type == ServiceRequestTypeEnum.PROVIDED:
                note.provided_services.add(service_request)
            elif service_request_type == ServiceRequestTypeEnum.REQUESTED:
                note.requested_services.add(service_request)
            else:
                raise NotImplementedError

            return cast(ServiceRequestType, service_request)

    @strawberry_django.mutation(
        extensions=[HasRetvalPerm(perms=[ServiceRequestPermissions.CHANGE])]
    )
    def update_service_request(
        self, info: Info, data: UpdateServiceRequestInput
    ) -> ServiceRequestType:
        with transaction.atomic():
            service_request_data = asdict(data)
            service_request = ServiceRequest.objects.get(id=data.id)
            service_request = resolvers.update(
                info,
                service_request,
                {
                    **service_request_data,
                },
            )

            return cast(ServiceRequestType, service_request)

    delete_service_request: ServiceRequestType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=ServiceRequestPermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(TaskPermissions.ADD)])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)
            if not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            task_data = asdict(data)
            task = resolvers.create(
                info,
                Task,
                {
                    **task_data,
                    "created_by": user,
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

    @strawberry_django.mutation(extensions=[HasPerm(TaskPermissions.ADD)])
    def create_note_task(self, info: Info, data: CreateNoteTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            task_data = asdict(data)
            task_type = str(task_data.pop("task_type"))
            note_id = str(task_data.pop("note_id"))
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=note_id)
            permission_group = get_user_permission_group(user)

            if not note or not (permission_group and permission_group.group):
                raise PermissionError("User lacks proper organization or permissions")

            task = resolvers.create(
                info,
                Task,
                {
                    **task_data,
                    "client": note.client,
                    "created_by": user,
                },
            )

            permissions = [
                TaskPermissions.VIEW,
                TaskPermissions.CHANGE,
                TaskPermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, task)

            if task_type == TaskTypeEnum.PURPOSE:
                note.purposes.add(task)
            elif task_type == TaskTypeEnum.NEXT_STEP:
                note.next_steps.add(task)
            else:
                raise NotImplementedError

            return cast(TaskType, task)

    @strawberry_django.mutation(
        extensions=[HasRetvalPerm(perms=[TaskPermissions.CHANGE])]
    )
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        with transaction.atomic():
            task_data = asdict(data)
            task = Task.objects.get(id=data.id)
            task = resolvers.update(
                info,
                task,
                {
                    **task_data,
                },
            )

            return cast(TaskType, task)

    delete_task: TaskType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=TaskPermissions.DELETE),
        ],
    )
