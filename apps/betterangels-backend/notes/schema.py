import uuid
from datetime import datetime
from typing import List, cast

import pghistory
import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from common.graphql.types import DeleteDjangoObjectInput
from common.models import Attachment
from common.permissions.enums import AttachmentPermissions
from django.apps import apps
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone
from guardian.shortcuts import assign_perm
from notes.models import Note, ServiceRequest, Task
from notes.permissions import (
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
    TaskPermissions,
)
from pghistory.models import Context, Events
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
    CreateServiceRequestInput,
    CreateTaskInput,
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

    @strawberry_django.mutation(
        extensions=[HasRetvalPerm(perms=[NotePermissions.CHANGE])]
    )
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        now = timezone.now()
        with transaction.atomic():
            with pghistory.context(timestamp=now, label=info.field_name):
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

    @strawberry_django.mutation(extensions=[HasRetvalPerm(NotePermissions.CHANGE)])
    def revert_note(self, info: Info, data: RevertNoteInput) -> NoteType:
        revert_to_context_id: uuid.UUID | None = None
        contexts_to_delete: list[uuid.UUID] = []

        for context in Context.objects.filter(metadata__label="updateNote").order_by(
            "-metadata__timestamp"
        ):
            timestamp = datetime.fromisoformat(
                context.metadata["timestamp"].replace("Z", "+00:00")
            )

            if timestamp > data.saved_at:
                contexts_to_delete.append(context.id)
            else:
                revert_to_context_id = context.id
                break

        if revert_to_context_id is None:
            raise Exception("Nothing to revert")

        # First, delete any models that were associated with the Note instance
        # in contexts that were created AFTER the selected saved_at time
        for event in Events.objects.filter(
            pgh_context_id__in=contexts_to_delete
        ).exclude(pgh_model="notes.NoteEvent"):
            if ".add" in event.pgh_label:
                apps.get_model(event.pgh_model).objects.get(
                    id=event.pgh_obj_id
                ).pgh_obj.delete()

        # Next, revert all the tracked models to the states they were in at context
        # just BEFORE the selected saved_at time
        for event in Events.objects.filter(pgh_context_id=revert_to_context_id):
            apps.get_model(event.pgh_model).objects.get(
                pgh_context_id=revert_to_context_id, id=event.pgh_obj_id
            ).revert()

        reverted_note = Note.objects.get(id=data.id)

        return cast(NoteType, reverted_note)

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

    @strawberry_django.mutation(extensions=[HasPerm(ServiceRequestPermissions.ADD)])
    def create_service_request(
        self, info: Info, data: CreateServiceRequestInput
    ) -> ServiceRequestType:
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
