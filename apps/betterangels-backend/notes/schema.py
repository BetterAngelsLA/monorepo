from typing import Optional, cast

import strawberry
import strawberry_django
from accounts.models import User
from accounts.selectors import resolve_permission_group
from accounts.types import OrganizationFilter, OrganizationOrder, OrganizationType
from clients.models import ClientProfileImportRecord
from common.graphql.org import resolve_org_or_deny
from common.graphql.permission_checkers import can_anywhere_checker
from common.graphql.types import (
    AuthorizedPresignedS3UploadsType,
    DeleteDjangoObjectInput,
    DeletedObjectType,
)
from common.permissions.selectors import writable
from common.permissions.utils import IsAuthenticated, PERMISSION_DENIED_MESSAGE, get_writable_or_deny, require_can
from common.utils import get_or_none
from common.services.types import UploadRequest, UploadConfirmation
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Exists, OuterRef, Q, QuerySet
from notes.groups import CASEWORKER
from notes.models import Note, NoteDataImport, NoteImportRecord, ServiceRequest
from notes.permissions import (
    NoteImportRecordPermissions,
    NotePermissions,
)
from notes.services import (
    create_note_attachment_presigned_uploads,
    note_create,
    note_service_request_create,
    note_update,
    note_update_location,
    resolve_note_file_uploads,
    service_request_delete,
)
from notes.utils import NoteReverter
from organizations.models import Organization
from strawberry import UNSET, asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm

from .types import (
    CreateNoteDataImportInput,
    CreateNoteInput,
    CreateNoteServiceRequestInput,
    GenerateNoteAttachmentUploadsInput,
    ImportNoteInput,
    InteractionAuthorType,
    NoteAttachmentType,
    NoteAttachmentUploadsType,
    NoteDataImportType,
    NoteFilter,
    NoteImportRecordType,
    NoteType,
    OrganizationServiceCategoryType,
    OrganizationServiceType,
    ResolveNoteAttachmentUploadsInput,
    RevertNoteInput,
    ServiceRequestType,
    UpdateNoteInput,
    UpdateNoteLocationInput,
)


@strawberry.type
class Query:
    note: NoteType = strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.VIEW, perm_checker=can_anywhere_checker)],
        filters=NoteFilter,
    )

    notes: OffsetPaginated[NoteType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
    )

    services: OffsetPaginated[OrganizationServiceType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD, perm_checker=can_anywhere_checker)],
    )

    service_categories: OffsetPaginated[OrganizationServiceCategoryType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD, perm_checker=can_anywhere_checker)],
    )

    interaction_authors: OffsetPaginated[InteractionAuthorType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD, perm_checker=can_anywhere_checker)],
    )

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationType],
        permission_classes=[IsAuthenticated],
    )
    def caseworker_organizations(
        self,
        info: Info,
        ordering: Optional[list[OrganizationOrder]] = None,
        filters: Optional[OrganizationFilter] = None,
    ) -> QuerySet[Organization]:
        """Return organizations where the current user is a caseworker."""
        user = cast(User, get_current_user(info))
        from accounts.models import PermissionGroup

        has_caseworker_group = Exists(
            PermissionGroup.objects.filter(
                organization=OuterRef("pk"),
                template__name=CASEWORKER.name,
                user=user,
            )
        )
        queryset: QuerySet[Organization] = Organization.objects.filter(has_caseworker_group)
        return queryset


@strawberry.type
class Mutation:
    # Notes
    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_note(self, info: Info, data: CreateNoteInput) -> NoteType:
        """
        Create a note with optional nested relations (location, services, tasks).
        All nested fields are optional, so this is fully backward-compatible with
        callers that only send core note fields.
        """
        user = cast(User, get_current_user(info))

        location_dict = asdict(data.location) if data.location else None
        provided_list = [asdict(s) for s in data.provided_services] if data.provided_services else None
        requested_list = [asdict(s) for s in data.requested_services] if data.requested_services else None
        tasks_list = [asdict(t) for t in data.tasks] if data.tasks else None

        team_id = data.team_id.value if data.team_id else None

        note_kwargs = dict(
            user=user,
            purpose=data.purpose,
            team_id=team_id,
            public_details=data.public_details or "",
            private_details=data.private_details or "",
            client_profile_id=str(data.client_profile) if data.client_profile else None,
            is_submitted=bool(data.is_submitted),
            interacted_at=data.interacted_at,
            location_data=location_dict,
            provided_services=provided_list,
            requested_services=requested_list,
            tasks=tasks_list,
        )

        if data.organization_id is not None and data.organization_id is not UNSET:
            # Payload-scoped grant authority (ADR 0001 §5, RFC 0003 slice 2).
            organization = resolve_org_or_deny(data.organization_id)
            require_can(user, NotePermissions.ADD, org=organization)
            note = note_create(organization=organization, **note_kwargs)
        else:
            # Compat window: a build that predates the payload org creates
            # through its legacy ``CASEWORKER`` group — the org comes from the
            # group, as before the cutover.  Dropped by the strict flip once
            # the build sending ``organizationId`` is deployed.
            try:
                permission_group = resolve_permission_group(user, template=CASEWORKER)
            except PermissionError:
                # Same structured denial the removed ``HasPerm`` extension
                # produced for a caller without the app-level perm (the
                # builtin ``PermissionError`` would escape as an unhandled
                # error).
                raise PermissionDenied(PERMISSION_DENIED_MESSAGE)
            note = note_create(permission_group=permission_group, **note_kwargs)

        note._private_details = note.private_details

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_note(self, info: Info, data: UpdateNoteInput) -> NoteType:
        user = cast(User, get_current_user(info))

        clean = asdict(data)

        note = get_writable_or_deny(Note.objects.all(), data.id, user, NotePermissions.CHANGE)

        note = note_update(
            note=note,
            data=clean,
            user=user,
            organization=note.organization,
        )
        note._private_details = note.private_details

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_note_location(self, info: Info, data: UpdateNoteLocationInput) -> NoteType:
        user = cast(User, get_current_user(info))

        note = get_writable_or_deny(Note.objects.all(), data.id, user, NotePermissions.CHANGE)

        location_data = cast(dict, strawberry.asdict(data)["location"])
        note = note_update_location(note=note, location_data=location_data)

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def revert_note(self, info: Info, data: RevertNoteInput) -> NoteType:
        user = cast(User, get_current_user(info))

        note = get_writable_or_deny(Note.objects.all(), data.id, user, NotePermissions.CHANGE)

        NoteReverter(note_id=data.id).revert_to_revert_before_timestamp(
            revert_before_timestamp=data.revert_before_timestamp.isoformat()
        )
        note.refresh_from_db()

        return cast(NoteType, note)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_note(self, info: Info, data: DeleteDjangoObjectInput) -> NoteType:
        user = cast(User, get_current_user(info))

        note = get_writable_or_deny(
            Note.objects.all(),
            data.id,
            user,
            NotePermissions.DELETE,
            message="You do not have permission to delete this interaction.",
        )

        return cast(NoteType, resolvers.delete(info, note))

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_note_service_request(self, info: Info, data: CreateNoteServiceRequestInput) -> ServiceRequestType:
        user = cast(User, get_current_user(info))

        note = get_writable_or_deny(Note.objects.all(), data.note_id, user, NotePermissions.CHANGE)

        service_requests = note_service_request_create(
            user=user,
            organization=note.organization,
            note=note,
            data=[
                {
                    "service_id": str(data.service_id) if data.service_id else None,
                    "service_other": data.service_other,
                }
            ],
            sr_type=data.service_request_type,
        )

        return cast(ServiceRequestType, service_requests[0])

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_service_request(self, info: Info, data: DeleteDjangoObjectInput) -> DeletedObjectType:
        """
        NOTE: this function will need to change once ServiceRequests are able to be associated with zero or more than one Note
        """
        user = cast(User, get_current_user(info))

        sr = get_or_none(ServiceRequest.objects.all(), data.id)
        # The mutation means "remove this request from its visit note", so the
        # note's org-scope is the authority (SR has no org reach of its own
        # until the service catalog is org-scoped).  The write-scoped exists is
        # the gate; no note → fail closed.
        if sr is None or not (
            writable(Note.objects.all(), user, NotePermissions.CHANGE)
            .filter(Q(provided_services=sr) | Q(requested_services=sr))
            .exists()
        ):
            raise PermissionDenied("You do not have permission to delete this service request.")

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
        user = cast(User, get_current_user(info))
        permission_group = resolve_permission_group(user, template=CASEWORKER)
        try:
            with transaction.atomic():
                note = note_create(
                    user=user,
                    permission_group=permission_group,
                    purpose=data.note.purpose if data.note.purpose is not strawberry.UNSET else None,
                    team_id=data.note.team_id.value if data.note.team_id else None,
                    public_details=data.note.public_details if data.note.public_details is not strawberry.UNSET else "",
                    private_details=(
                        data.note.private_details if data.note.private_details is not strawberry.UNSET else ""
                    ),
                    client_profile_id=(
                        str(data.note.client_profile)
                        if data.note.client_profile and data.note.client_profile is not strawberry.UNSET
                        else None
                    ),
                    is_submitted=(
                        bool(data.note.is_submitted) if data.note.is_submitted is not strawberry.UNSET else False
                    ),
                    interacted_at=(
                        data.note.interacted_at if data.note.interacted_at is not strawberry.UNSET else None
                    ),
                )
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

    # ── Note Attachment Presigned S3 Uploads ────────────────────────────

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def generate_note_file_uploads(
        self,
        info: Info,
        data: GenerateNoteAttachmentUploadsInput,
    ) -> AuthorizedPresignedS3UploadsType:
        user = cast(User, get_current_user(info))

        get_writable_or_deny(Note.objects.all(), data.note_id, user, NotePermissions.CHANGE)

        uploads = [
            UploadRequest(
                ref_id=u.ref_id,
                filename=u.filename,
                mime_type=u.content_type,
            )
            for u in data.uploads
        ]
        presigned = create_note_attachment_presigned_uploads(user=user, uploads=uploads)

        return AuthorizedPresignedS3UploadsType.from_batch(presigned)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def resolve_note_file_uploads(
        self,
        info: Info,
        data: ResolveNoteAttachmentUploadsInput,
    ) -> NoteAttachmentUploadsType:
        user = cast(User, get_current_user(info))

        note = get_writable_or_deny(Note.objects.all(), data.note_id, user, NotePermissions.CHANGE)

        attachment_list = [
            UploadConfirmation(
                presigned_key=a.presigned_key,
                upload_token=a.upload_token,
                filename=a.filename,
                mime_type=a.content_type,
            )
            for a in data.attachments
        ]
        attachments = resolve_note_file_uploads(user=user, note=note, attachments=attachment_list)

        return NoteAttachmentUploadsType(attachments=cast(list[NoteAttachmentType], attachments))
