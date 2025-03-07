from typing import Dict, List, cast

import pghistory
import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_outreach_authorized_users, get_user_permission_group
from clients.models import ClientProfileImportRecord
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.models import Attachment, Location
from common.permissions.enums import AttachmentPermissions
from common.permissions.utils import IsAuthenticated
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import QuerySet
from django.db.models.expressions import Subquery
from django.utils import timezone
from guardian.shortcuts import assign_perm
from notes.enums import ServiceRequestStatusEnum, ServiceRequestTypeEnum, TaskTypeEnum
from notes.models import (
    Mood,
    Note,
    NoteDataImport,
    NoteImportRecord,
    ServiceRequest,
    Task,
)
from notes.permissions import (
    NoteImportRecordPermissions,
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
    TaskPermissions,
)
from notes.utils import NoteReverter
from strawberry import asdict
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .types import (
    AddNoteTaskInput,
    CreateNoteAttachmentInput,
    CreateNoteDataImportInput,
    CreateNoteInput,
    CreateNoteMoodInput,
    CreateNoteServiceRequestInput,
    CreateNoteTaskInput,
    CreateServiceRequestInput,
    CreateTaskInput,
    ImportNoteInput,
    InteractionAuthorType,
    MoodType,
    NoteAttachmentType,
    NoteDataImportType,
    NoteFilter,
    NoteImportRecordType,
    NoteType,
    RemoveNoteServiceRequestInput,
    RemoveNoteTaskInput,
    RevertNoteInput,
    ServiceRequestType,
    TaskType,
    UpdateNoteInput,
    UpdateNoteLocationInput,
    UpdateServiceRequestInput,
    UpdateTaskInput,
    UpdateTaskLocationInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(extensions=[HasRetvalPerm(NotePermissions.VIEW)], filters=NoteFilter)

    notes: List[NoteType] = strawberry_django.field(
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    notes_paginated: OffsetPaginated[NoteType] = strawberry_django.offset_paginated(
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

    task: TaskType = strawberry_django.field(extensions=[HasRetvalPerm(TaskPermissions.VIEW)])

    tasks: List[TaskType] = strawberry_django.field(extensions=[HasRetvalPerm(TaskPermissions.VIEW)])

    @strawberry_django.offset_paginated(
        OffsetPaginated[InteractionAuthorType], extensions=[HasPerm(NotePermissions.ADD)]
    )
    def interaction_authors(self) -> QuerySet[User]:
        return get_outreach_authorized_users()


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

    @strawberry_django.mutation(extensions=[HasRetvalPerm(perms=[NotePermissions.CHANGE])])
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        with transaction.atomic(), pghistory.context(note_id=data.id, timestamp=timezone.now(), label=info.field_name):
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

    @strawberry_django.mutation(
        extensions=[
            HasRetvalPerm(perms=[NotePermissions.CHANGE]),
        ]
    )
    def update_note_location(self, info: Info, data: UpdateNoteLocationInput) -> NoteType:
        with transaction.atomic(), pghistory.context(note_id=data.id, timestamp=timezone.now(), label=info.field_name):
            user = get_current_user(info)
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=data.id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")

            location_data: Dict = strawberry.asdict(data)
            location = Location.get_or_create_location(location_data["location"])
            note = resolvers.update(
                info,
                note,
                {
                    "location": location,
                },
            )

            return cast(NoteType, note)

    @strawberry_django.mutation(extensions=[HasRetvalPerm(NotePermissions.CHANGE)])
    def revert_note(self, info: Info, data: RevertNoteInput) -> NoteType:
        note = Note.objects.get(id=data.id)

        try:
            NoteReverter(note_id=data.id).revert_to_revert_before_timestamp(
                revert_before_timestamp=data.revert_before_timestamp.isoformat()
            )
            note.refresh_from_db()

        except Exception as e:
            # TODO: add error handling/logging, for now it either fully succeeds or fails silently
            print(e)

        return cast(NoteType, note)

    delete_note: NoteType = mutations.delete(
        DeleteDjangoObjectInput,
        extensions=[
            HasRetvalPerm(perms=NotePermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(extensions=[HasPerm(AttachmentPermissions.ADD)])
    def create_note_attachment(self, info: Info, data: CreateNoteAttachmentInput) -> NoteAttachmentType:
        with transaction.atomic():
            user = cast(User, get_current_user(info))
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=data.note)

            permission_group = get_user_permission_group(user)

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

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def add_note_task(self, info: Info, data: AddNoteTaskInput) -> NoteType:
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=data.note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")
            try:
                task = filter_for_user(
                    Task.objects.all(),
                    user,
                    [TaskPermissions.CHANGE],
                ).get(id=data.task_id)
            except Task.DoesNotExist:
                raise PermissionError("You do not have permission to access that task.")

            if data.task_type == TaskTypeEnum.PURPOSE:
                note.purposes.add(task)
            elif data.task_type == TaskTypeEnum.NEXT_STEP:
                note.next_steps.add(task)
            else:
                raise NotImplementedError

            return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def remove_note_task(self, info: Info, data: RemoveNoteTaskInput) -> NoteType:
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=data.note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")
            try:
                task = filter_for_user(
                    Task.objects.all(),
                    user,
                    [TaskPermissions.CHANGE],
                ).get(id=data.task_id)
            except Task.DoesNotExist:
                raise PermissionError("You do not have permission to access that task.")

            if data.task_type == TaskTypeEnum.PURPOSE:
                note.purposes.remove(task)
            elif data.task_type == TaskTypeEnum.NEXT_STEP:
                note.next_steps.remove(task)
            else:
                raise NotImplementedError

            return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_note_mood(self, info: Info, data: CreateNoteMoodInput) -> MoodType:
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)

            mood_data = asdict(data)
            note_id = str(mood_data.pop("note_id"))

            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")

            mood = resolvers.create(
                info,
                Mood,
                {
                    **mood_data,
                    "note": note,
                },
            )

            return cast(MoodType, mood)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_mood(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        user = get_current_user(info)
        try:
            mood = Mood.objects.get(
                id=data.id,
                note_id__in=Subquery(
                    filter_for_user(
                        Note.objects.all(),
                        user,
                        [NotePermissions.CHANGE],
                    ).values("id")
                ),
            )
        except Note.DoesNotExist:
            raise PermissionError("User lacks proper organization or permissions")

        mood_id = mood.id

        with pghistory.context(note_id=str(mood.note_id), timestamp=timezone.now(), label=info.field_name):
            mood.delete()

        return DeletedObjectType(id=mood_id)

    @strawberry_django.mutation(extensions=[HasPerm(ServiceRequestPermissions.ADD)])
    def create_service_request(self, info: Info, data: CreateServiceRequestInput) -> ServiceRequestType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

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
    def create_note_service_request(self, info: Info, data: CreateNoteServiceRequestInput) -> ServiceRequestType:
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)
            service_request_data = asdict(data)
            service_request_type = str(service_request_data.pop("service_request_type"))
            note_id = str(service_request_data.pop("note_id"))
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")

            permission_group = get_user_permission_group(user)

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

    @strawberry_django.mutation(extensions=[HasRetvalPerm(perms=[ServiceRequestPermissions.CHANGE])])
    def update_service_request(self, info: Info, data: UpdateServiceRequestInput) -> ServiceRequestType:
        with transaction.atomic():
            service_request_data = asdict(data)
            service_request = ServiceRequest.objects.get(id=data.id)
            note_id = service_request.get_note_id()

            with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
                service_request = resolvers.update(
                    info,
                    service_request,
                    {
                        **service_request_data,
                    },
                )

            return cast(ServiceRequestType, service_request)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def remove_note_service_request(self, info: Info, data: RemoveNoteServiceRequestInput) -> NoteType:
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=data.note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")

            service_request = ServiceRequest.objects.get(id=data.service_request_id)

            if data.service_request_type == ServiceRequestTypeEnum.REQUESTED:
                note.requested_services.remove(service_request)
            elif data.service_request_type == ServiceRequestTypeEnum.PROVIDED:
                note.provided_services.remove(service_request)
            else:
                raise NotImplementedError

            return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_service_request(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        """
        NOTE: this function will need to change once ServiceRequests are able to be associated with zero or more than one Note
        """
        user = get_current_user(info)

        try:
            service_request = filter_for_user(
                ServiceRequest.objects.all(),
                user,
                [ServiceRequestPermissions.DELETE],
            ).get(id=data.id)

        except ServiceRequest.DoesNotExist:
            raise PermissionError("You do not have permission to modify this service request.")

        service_request_id = service_request.id
        note_id = service_request.get_note_id()

        with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
            service_request.delete()

        return DeletedObjectType(id=service_request_id)

    @strawberry_django.mutation(extensions=[HasPerm(TaskPermissions.ADD)])
    def create_task(self, info: Info, data: CreateTaskInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

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
        with transaction.atomic(), pghistory.context(
            note_id=data.note_id, timestamp=timezone.now(), label=info.field_name
        ):
            user = get_current_user(info)
            task_data = asdict(data)
            task_type = str(task_data.pop("task_type"))
            note_id = str(task_data.pop("note_id"))
            try:
                note = filter_for_user(
                    Note.objects.all(),
                    user,
                    [NotePermissions.CHANGE],
                ).get(id=note_id)
            except Note.DoesNotExist:
                raise PermissionError("You do not have permission to modify this note.")

            permission_group = get_user_permission_group(user)

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

    @strawberry_django.mutation(extensions=[HasRetvalPerm(perms=[TaskPermissions.CHANGE])])
    def update_task(self, info: Info, data: UpdateTaskInput) -> TaskType:
        with transaction.atomic():
            task_data = asdict(data)
            task = Task.objects.get(id=data.id)
            note_id = task.get_note_id()

            with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
                task = resolvers.update(
                    info,
                    task,
                    {
                        **task_data,
                    },
                )

            return cast(TaskType, task)

    @strawberry_django.mutation(
        extensions=[
            HasRetvalPerm(perms=[TaskPermissions.CHANGE]),
        ]
    )
    def update_task_location(self, info: Info, data: UpdateTaskLocationInput) -> TaskType:
        with transaction.atomic():
            user = get_current_user(info)
            try:
                task = filter_for_user(
                    Task.objects.all(),
                    user,
                    [TaskPermissions.CHANGE],
                ).get(id=data.id)
            except Task.DoesNotExist:
                raise PermissionError("You do not have permission to modify this task.")

            note_id = task.get_note_id()

            with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
                location_data: Dict = strawberry.asdict(data)
                location = Location.get_or_create_location(location_data["location"])
                task = resolvers.update(
                    info,
                    task,
                    {
                        "location": location,
                    },
                )

            return cast(TaskType, task)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_task(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        """
        NOTE: this function will need to change once Tasks are able to be associated with zero or more than one Note
        """
        user = get_current_user(info)

        try:
            task = filter_for_user(
                Task.objects.all(),
                user,
                [TaskPermissions.DELETE],
            ).get(id=data.id)

        except Task.DoesNotExist:
            raise PermissionError("You do not have permission to modify this task.")

        task_id = task.id
        note_id = task.get_note_id()

        with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label=info.field_name):
            task.delete()

        return DeletedObjectType(id=task_id)

    @strawberry_django.mutation(extensions=[HasPerm(NoteImportRecordPermissions.ADD)])
    def create_note_data_import(self, info: Info, data: CreateNoteDataImportInput) -> NoteDataImportType:
        user = cast(User, get_current_user(info))
        record = NoteDataImport.objects.create(
            source_file=data.source_file,
            imported_by=user,
            notes=data.notes,
        )
        return NoteDataImportType(
            id=record.id,
            imported_at=record.imported_at.isoformat(),
            source_file=record.source_file,
            notes=record.notes,
            imported_by=record.imported_by,
        )

    @strawberry_django.mutation(extensions=[HasPerm(NoteImportRecordPermissions.ADD)])
    def import_note(self, info: Info, data: ImportNoteInput) -> NoteImportRecordType:
        """
        Imports a note. If the note input includes a 'parentId' field,
        this resolver looks up the corresponding ClientProfileImportRecord (with source "SELAH")
        and injects the internal client ID into the note data before creating the note.
        """
        existing = NoteImportRecord.objects.filter(
            source_name=data.source_name,
            source_id=data.source_id,
            success=True,
        ).first()
        if existing:
            raise Exception(
                f"Source ID {data.source_id} with source name '{data.source_name}' has already been imported successfully."
            )

        note_input = strawberry.asdict(data.note)

        # Pop out the parentId so it doesn't get passed to CreateNoteInput.
        parent_id = note_input.pop("parentId", None)
        if parent_id:
            cp_record = ClientProfileImportRecord.objects.filter(
                source_id=parent_id,
                source_name="SELAH",
                success=True,
            ).first()
            if cp_record is None or cp_record.client_profile is None:
                raise Exception(f"Client lookup failed for parentId '{parent_id}'")
            note_input["client"] = str(cp_record.client_profile.id)

        import_job = NoteDataImport.objects.get(id=data.import_job_id)
        try:
            with transaction.atomic():
                note = Mutation.create_note(self, info, data.note)
                record = NoteImportRecord.objects.create(
                    import_job=import_job,
                    source_id=data.source_id,
                    source_name=data.source_name,
                    note=note,
                    raw_data=data.raw_data,
                    success=True,
                )
        except Exception as e:
            record = NoteImportRecord.objects.create(
                import_job=import_job,
                source_id=data.source_id,
                source_name=data.source_name,
                raw_data=data.raw_data,
                success=False,
                error_message=str(e),
            )
        return cast(NoteImportRecordType, record)
