from typing import cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.utils import get_user_permission_group
from clients.models import ClientProfile, ClientProfileImportRecord
from common.graphql.extensions import PermissionedQuerySet
from common.graphql.types import DeleteDjangoObjectInput, DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.db import transaction
from django.db.models import QuerySet
from django.db.models.expressions import Subquery
from notes.enums import ServiceRequestStatusEnum
from notes.models import Mood, Note, NoteDataImport, NoteImportRecord, ServiceRequest
from notes.permissions import (
    NoteImportRecordPermissions,
    NotePermissions,
    ServiceRequestPermissions,
)
from notes.services import (
    mood_create,
    mood_delete,
    note_create,
    note_create_full,
    note_service_request_create,
    note_service_request_remove,
    note_update,
    note_update_location,
    service_request_create,
    service_request_delete,
    service_request_update,
)
from notes.utils import NoteReverter
from strawberry import asdict
from strawberry.types import Info
from strawberry_django import mutations
from strawberry_django.auth.utils import get_current_user
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.query import filter_for_user

from .types import (
    CreateFullNoteInput,
    CreateNoteDataImportInput,
    CreateNoteInput,
    CreateNoteMoodInput,
    CreateNoteServiceRequestInput,
    CreateServiceRequestInput,
    ImportNoteInput,
    InteractionAuthorType,
    MoodType,
    NoteDataImportType,
    NoteFilter,
    NoteImportRecordType,
    NoteType,
    OrganizationServiceCategoryType,
    OrganizationServiceType,
    RemoveNoteServiceRequestInput,
    RevertNoteInput,
    ServiceRequestType,
    UpdateNoteInput,
    UpdateNoteLocationInput,
    UpdateServiceRequestInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasRetvalPerm(NotePermissions.VIEW)], filters=NoteFilter
    )

    notes: OffsetPaginated[NoteType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasRetvalPerm(NotePermissions.VIEW)],
    )

    services: OffsetPaginated[OrganizationServiceType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )

    service_categories: OffsetPaginated[OrganizationServiceCategoryType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )

    interaction_authors: OffsetPaginated[InteractionAuthorType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )


@strawberry.type
class Mutation:
    # Notes
    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(NotePermissions.ADD)])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(user)

        note = note_create(
            user=user,
            permission_group=permission_group,
            purpose=data.purpose if data.purpose is not strawberry.UNSET else None,
            team=data.team if data.team is not strawberry.UNSET else None,
            public_details=data.public_details if data.public_details is not strawberry.UNSET else "",
            private_details=data.private_details if data.private_details is not strawberry.UNSET else "",
            client_profile_id=(
                str(data.client_profile)
                if data.client_profile and data.client_profile is not strawberry.UNSET
                else None
            ),
            is_submitted=bool(data.is_submitted) if data.is_submitted is not strawberry.UNSET else False,
            interacted_at=data.interacted_at if data.interacted_at is not strawberry.UNSET else None,
        )

        note._private_details = note.private_details

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated], extensions=[HasPerm(NotePermissions.ADD)])
    def create_full_note(self, info: Info, data: CreateFullNoteInput) -> NoteType:
        """
        Atomically create a note with all nested relations in one mutation.
        Supports: location, moods, provided/requested services, and tasks.
        """
        user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(user)

        location_dict = asdict(data.location) if data.location else None
        provided_list = [asdict(s) for s in data.provided_services] if data.provided_services else None
        requested_list = [asdict(s) for s in data.requested_services] if data.requested_services else None
        tasks_list = [asdict(t) for t in data.tasks] if data.tasks else None

        note = note_create_full(
            user=user,
            permission_group=permission_group,
            purpose=data.purpose,
            team=data.team,
            public_details=data.public_details or "",
            private_details=data.private_details or "",
            client_profile_id=str(data.client_profile) if data.client_profile else None,
            is_submitted=bool(data.is_submitted),
            interacted_at=data.interacted_at,
            location_data=location_dict,
            moods=data.moods,
            provided_services=provided_list,
            requested_services=requested_list,
            tasks=tasks_list,
        )

        # Annotated field workaround for permission checks
        note._private_details = note.private_details

        return cast(NoteType, note)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE])],
    )
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        qs: QuerySet[Note] = info.context.qs
        clean = {k: v for k, v in asdict(data).items() if v is not strawberry.UNSET}

        note = qs.get(pk=data.id)
        note = note_update(note=note, data=clean)
        note._private_details = note.private_details

        return cast(NoteType, note)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE])],
    )
    def update_note_location(self, info: Info, data: UpdateNoteLocationInput) -> NoteType:
        qs: QuerySet[Note] = info.context.qs
        note = qs.get(id=data.id)

        location_data: dict = strawberry.asdict(data)["location"]  # type: ignore[assignment]
        note = note_update_location(note=note, location_data=location_data)

        return cast(NoteType, note)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE])],
    )
    def revert_note(self, info: Info, data: RevertNoteInput) -> NoteType:
        qs: QuerySet[Note] = info.context.qs
        note = qs.get(id=data.id)

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
        permission_classes=[IsAuthenticated],
        extensions=[
            HasRetvalPerm(perms=NotePermissions.DELETE),
        ],
    )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_note_mood(self, info: Info, data: CreateNoteMoodInput) -> MoodType:
        user = get_current_user(info)

        try:
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=str(data.note_id))
        except Note.DoesNotExist:
            raise PermissionError("You do not have permission to modify this note.")

        moods = mood_create(data=[data.descriptor], note=note)
        return cast(MoodType, moods[0])

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

        deleted_id = mood_delete(mood=mood)

        return DeletedObjectType(id=deleted_id)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(ServiceRequestPermissions.ADD)]
    )
    def create_service_request(self, info: Info, data: CreateServiceRequestInput) -> ServiceRequestType:
        user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(user)

        client_profile = ClientProfile.objects.get(pk=data.client_profile) if data.client_profile else None

        srs = service_request_create(
            user=user,
            permission_group=permission_group,
            data=[asdict(data)],
            status=ServiceRequestStatusEnum(str(data.status)),
            client_profile=client_profile,
        )

        return cast(ServiceRequestType, srs[0])

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(ServiceRequestPermissions.ADD)]
    )
    def create_note_service_request(self, info: Info, data: CreateNoteServiceRequestInput) -> ServiceRequestType:
        user = cast(User, get_current_user(info))
        permission_group = get_user_permission_group(user)

        try:
            note = filter_for_user(
                Note.objects.all(),
                user,
                [NotePermissions.CHANGE],
            ).get(id=str(data.note_id))
        except Note.DoesNotExist:
            raise PermissionError("You do not have permission to modify this note.")

        srs = note_service_request_create(
            user=user,
            permission_group=permission_group,
            note=note,
            data=[
                {
                    "service_id": str(data.service_id) if data.service_id else None,
                    "service_other": data.service_other,
                }
            ],
            sr_type=data.service_request_type,
        )

        return cast(ServiceRequestType, srs[0])

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=ServiceRequest, perms=[ServiceRequestPermissions.CHANGE])],
    )
    def update_service_request(self, info: Info, data: UpdateServiceRequestInput) -> ServiceRequestType:
        qs: QuerySet[ServiceRequest] = info.context.qs
        clean = {k: v for k, v in asdict(data).items() if v is not strawberry.UNSET}

        sr = qs.get(id=data.id)
        sr = service_request_update(service_request=sr, data=clean)

        return cast(ServiceRequestType, sr)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[PermissionedQuerySet(model=Note, perms=[NotePermissions.CHANGE])],
    )
    def remove_note_service_request(self, info: Info, data: RemoveNoteServiceRequestInput) -> NoteType:
        qs: QuerySet[Note] = info.context.qs
        note = qs.get(id=data.note_id)

        service_request = ServiceRequest.objects.get(id=data.service_request_id)
        note_service_request_remove(
            note=note,
            service_request=service_request,
            sr_type=data.service_request_type,
        )

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_service_request(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        """
        NOTE: this function will need to change once ServiceRequests are able to be associated with zero or more than one Note
        """
        user = get_current_user(info)

        try:
            sr = filter_for_user(
                ServiceRequest.objects.all(),
                user,
                [ServiceRequestPermissions.DELETE],
            ).get(id=data.id)

        except ServiceRequest.DoesNotExist:
            raise PermissionError("You do not have permission to modify this service request.")

        deleted_id = service_request_delete(service_request=sr)

        return DeletedObjectType(id=deleted_id)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(NoteImportRecordPermissions.ADD)]
    )
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

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(NoteImportRecordPermissions.ADD)]
    )
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
