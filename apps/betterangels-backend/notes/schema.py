from typing import List, cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from common.graphql.types import DeleteDjangoObjectInput
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.models import Note, ServiceRequest, Task
from notes.permissions import (
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
    TaskPermissions,
)
from strawberry import asdict
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm

from .types import (
    CreateNoteInput,
    CreateServiceRequestInput,
    CreateTaskInput,
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
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
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

            client = User(id=data.client.id) if data.client else None
            service_request_data = asdict(data)
            service_request = resolvers.create(
                info,
                ServiceRequest,
                {
                    **service_request_data,
                    "created_by": user,
                    "client": client,
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
            client = User(id=data.client.id) if data.client else None
            service_request_data = asdict(data)
            service_request = ServiceRequest.objects.get(id=data.id)
            service_request = resolvers.update(
                info,
                service_request,
                {
                    **service_request_data,
                    "client": client,
                },
            )

            return cast(ServiceRequestType, service_request)

    delete_service_request: ServiceRequestType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=ServiceRequestPermissions.DELETE),
        ],
    )
