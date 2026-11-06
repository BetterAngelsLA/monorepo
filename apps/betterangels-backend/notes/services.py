from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, cast

import pghistory
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone
from organizations.models import Organization
from strawberry import UNSET

from accounts.models import PermissionGroup, User
from clients.models import ClientProfile
from common.constants import DEFAULT_DOCUMENT_CONTENT_TYPES, DEFAULT_IMAGE_CONTENT_TYPES
from common.models import Attachment, Location
from common.permissions.utils import PERMISSION_DENIED_MESSAGE, assign_object_permissions, require_can
from common.services import file_upload
from common.services.file_upload import (
    AttachmentUploadConfig,
    UploadConfirmation,
    UploadRequest,
)
from common.services.types import AuthorizedPresignedUploadBatch
from notes.enums import ServiceRequestStatusEnum, ServiceRequestTypeEnum
from notes.models import Note, OrganizationService, ServiceRequest
from notes.permissions import (
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
)
from tasks.models import Task
from tasks.services import task_create, task_delete, task_update

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _resolve_service(
    item: Dict[str, Any],
    organization: Any,
) -> Optional[OrganizationService]:
    """Resolve a service FK from either an ID or a free-text label."""
    if service_id := item.get("service_id"):
        return OrganizationService.objects.get(pk=service_id)

    if service_other := item.get("service_other"):
        svc, _ = OrganizationService.objects.get_or_create(
            label=service_other,
            organization=organization,
        )
        return svc

    return None


# ---------------------------------------------------------------------------
# Note
# ---------------------------------------------------------------------------


#: Fields a note's task list may clear by sending an explicit null.  Everything
#: else is left alone when the payload omits it — the mutation is a patch, and
#: it must not null a required column just because a caller sent a partial item.
_TASK_CLEARABLE_FIELDS = frozenset({"team_id", "assignee_id", "description"})


def _task_update_fields(item: Dict[str, Any]) -> Dict[str, Any]:
    """The fields of one payload item that an in-place update should apply."""
    return {
        key: value
        for key, value in item.items()
        if key != "id" and value is not UNSET and (value is not None or key in _TASK_CLEARABLE_FIELDS)
    }


def _sync_note_tasks(*, note: Note, tasks_data: List[Dict[str, Any]], user: User) -> None:
    """Reconcile a note's task list with the payload, asking for the exact authority.

    A task is a task whatever path it arrives on: the note gate is not a
    substitute for ``tasks.add``/``change``/``delete`` (RFC 0003).  Items
    carrying ``id`` are updated in place, items without one are created, and the
    note's tasks the payload no longer names are deleted — each arm gated by its
    own permission at the note's org.

    A payload with **no** ids is a legacy replace-all (a build that predates the
    id field sends the whole list anonymous): every existing task is deleted and
    the list recreated, which is the pre-diff behaviour.

    An id that is not on this note refuses: it would otherwise let a caller
    update or delete another note's task through this mutation.
    """
    existing = {str(pk): task for pk, task in ((t.pk, t) for t in note.tasks.all())}
    incoming = [dict(item) for item in tasks_data]
    referenced = {str(item["id"]) for item in incoming if item.get("id")}

    if referenced - existing.keys():
        # Not on this note — a foreign id, or one that no longer exists.
        raise PermissionDenied(PERMISSION_DENIED_MESSAGE)

    to_update = [item for item in incoming if item.get("id")]
    to_create = [item for item in incoming if not item.get("id")]
    to_delete = [pk for pk in existing if pk not in referenced]

    if to_delete:
        require_can(user, Task.perms.DELETE, org=note.organization)
    if to_update:
        require_can(user, Task.perms.CHANGE, org=note.organization)
    if to_create:
        require_can(user, Task.perms.ADD, org=note.organization)

    for pk in to_delete:
        task_delete(task=existing[pk])

    for item in to_update:
        task_update(task=existing[str(item["id"])], data=_task_update_fields(item))

    if to_create:
        task_create(
            user=user,
            organization=note.organization,
            data=[{key: value for key, value in item.items() if key != "id"} for item in to_create],
            note=note,
            client_profile=note.client_profile,
        )


@transaction.atomic
def note_update(
    *,
    note: Note,
    data: Dict[str, Any],
    user: Optional[User] = None,
    permission_group: Optional[PermissionGroup] = None,
    organization: Optional[Organization] = None,
) -> Note:
    """
    Update a Note, including nested relations.

    Core fields are updated in-place. Nested relations reconcile rather than
    replace: a task carrying ``id`` is updated, one without it is created, and
    the note's tasks the payload no longer names are deleted. A payload with no
    ids at all is a legacy replace-all.  Caller is responsible for permission
    checks.
    """
    # Extract nested relation data (handle separately)
    location_data = data.pop("location", None)
    provided_services_data = data.pop("provided_services", None)
    requested_services_data = data.pop("requested_services", None)
    tasks_data = data.pop("tasks", None)

    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_update"):
        for field, value in data.items():
            if field == "id":
                continue
            setattr(note, field, value)

        # --- Location (replace) ---
        if location_data is not None:
            location = Location.get_or_create_location(location_data)
            note.location = location

        # Single save for core fields + location to produce one pghistory event.
        note.full_clean()
        note.save()

        # --- Provided services (replace-all) ---
        if provided_services_data is not None and user and (permission_group or organization):
            note.provided_services.all().delete()
            if provided_services_data:
                note_service_request_create(
                    user=user,
                    permission_group=permission_group,
                    organization=organization,
                    note=note,
                    data=provided_services_data,
                    sr_type=ServiceRequestTypeEnum.PROVIDED,
                )

        # --- Requested services (replace-all) ---
        if requested_services_data is not None and user and (permission_group or organization):
            note.requested_services.all().delete()
            if requested_services_data:
                note_service_request_create(
                    user=user,
                    permission_group=permission_group,
                    organization=organization,
                    note=note,
                    data=requested_services_data,
                    sr_type=ServiceRequestTypeEnum.REQUESTED,
                )

        # --- Tasks (diff by id; legacy payloads replace all) ---
        if tasks_data is not None and user and (permission_group or organization):
            _sync_note_tasks(note=note, tasks_data=tasks_data, user=user)

    return note


@transaction.atomic
def note_update_location(
    *,
    note: Note,
    location_data: Dict[str, Any],
) -> Note:
    """Replace a Note's Location. Caller is responsible for permission checks.

    Uses get_or_create so that identical (point, address, poi) triples share
    a Location row.  When the triple changes the FK points to a different row,
    which pghistory records for reverts.
    """
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_update_location"):
        note.location = Location.get_or_create_location(location_data)
        note.save(update_fields=["location"])

    return note


# ---------------------------------------------------------------------------
# Service Request
# ---------------------------------------------------------------------------


def service_request_create(
    *,
    user: User,
    permission_group: Optional[PermissionGroup] = None,
    organization: Optional[Organization] = None,
    data: List[Dict[str, Any]],
    status: ServiceRequestStatusEnum,
    client_profile: Optional[ClientProfile] = None,
) -> List[ServiceRequest]:
    """Create one or more ServiceRequests.

    The org comes from *organization* (grant path) or the legacy
    ``permission_group``; guardian rows are assigned only on the legacy path
    (RFC 0003 slice 2).
    """
    org = organization if organization is not None else cast("PermissionGroup", permission_group).organization

    created: List[ServiceRequest] = []
    for item in data:
        sr = ServiceRequest.objects.create(
            service=_resolve_service(item, org),
            status=status,
            client_profile=client_profile,
            created_by=user,
        )

        if permission_group is not None:
            assign_object_permissions(
                permission_group,
                sr,
                [
                    ServiceRequestPermissions.VIEW,
                    ServiceRequestPermissions.CHANGE,
                    ServiceRequestPermissions.DELETE,
                ],
            )
        created.append(sr)

    return created


def service_request_delete(*, service_request: ServiceRequest) -> int:
    """Delete a ServiceRequest. Caller is responsible for permission checks."""
    sr_id = service_request.id
    note_id = service_request.get_note_id()
    with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label="service_request_delete"):
        service_request.delete()
    return sr_id


def _status_for_sr_type(sr_type: ServiceRequestTypeEnum) -> ServiceRequestStatusEnum:
    """Map a service request type to its default status."""
    if sr_type == ServiceRequestTypeEnum.REQUESTED:
        return ServiceRequestStatusEnum.TO_DO
    return ServiceRequestStatusEnum.COMPLETED


def note_service_request_create(
    *,
    user: User,
    permission_group: Optional[PermissionGroup] = None,
    organization: Optional[Organization] = None,
    note: Note,
    data: List[Dict[str, Any]],
    sr_type: ServiceRequestTypeEnum,
) -> List[ServiceRequest]:
    """Create ServiceRequests and link them to a Note's M2M."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_service_request_create"):
        service_requests = service_request_create(
            user=user,
            permission_group=permission_group,
            organization=organization,
            data=data,
            status=_status_for_sr_type(sr_type),
            client_profile=note.client_profile,
        )

        if sr_type == ServiceRequestTypeEnum.PROVIDED:
            note.provided_services.add(*service_requests)
        elif sr_type == ServiceRequestTypeEnum.REQUESTED:
            note.requested_services.add(*service_requests)

    return service_requests


@transaction.atomic
def note_create(
    *,
    user: User,
    permission_group: Optional[PermissionGroup] = None,
    organization: Optional[Organization] = None,
    purpose: Optional[str] = None,
    team_id: Optional[str] = None,
    public_details: str = "",
    private_details: str = "",
    client_profile_id: Optional[str] = None,
    is_submitted: bool = False,
    interacted_at: Optional[datetime] = None,
    location_data: Optional[Dict[str, Any]] = None,
    provided_services: Optional[List[Dict[str, Any]]] = None,
    requested_services: Optional[List[Dict[str, Any]]] = None,
    tasks: Optional[List[Dict[str, Any]]] = None,
) -> Note:
    """
    Create a note with all nested relations atomically.

    All nested params (location, services, tasks) are optional,
    making this backward-compatible with callers that only send core fields.
    """

    location = None
    if location_data:
        location = Location.get_or_create_location(location_data)

    org = organization if organization is not None else cast("PermissionGroup", permission_group).organization

    note = Note(
        purpose=purpose,
        team_id=team_id,
        public_details=public_details or "",
        private_details=private_details or "",
        client_profile_id=client_profile_id,
        is_submitted=is_submitted,
        interacted_at=interacted_at or timezone.now(),
        location=location,
        created_by=user,
        organization=org,
    )
    note.full_clean()
    note.save()

    if permission_group is not None:
        assign_object_permissions(
            permission_group,
            note,
            [
                NotePermissions.CHANGE,
                NotePermissions.DELETE,
                PrivateDetailsPermissions.VIEW,
            ],
        )

    if provided_services:
        note_service_request_create(
            user=user,
            permission_group=permission_group,
            organization=organization,
            note=note,
            data=provided_services,
            sr_type=ServiceRequestTypeEnum.PROVIDED,
        )

    if requested_services:
        note_service_request_create(
            user=user,
            permission_group=permission_group,
            organization=organization,
            note=note,
            data=requested_services,
            sr_type=ServiceRequestTypeEnum.REQUESTED,
        )

    if tasks:
        # Same authority as a flat ``createTask`` (RFC 0003) — creating through a
        # note must not be a way around ``tasks.add``.
        require_can(user, Task.perms.ADD, org=note.organization)
        task_create(
            user=user,
            organization=note.organization,
            data=tasks,
            note=note,
            client_profile=note.client_profile,
        )

    return note


NOTE_ATTACHMENT_CONFIG = AttachmentUploadConfig(
    upload_path="note_attachments",
    service_name="note_attachment",
    allowed_content_types=DEFAULT_DOCUMENT_CONTENT_TYPES | DEFAULT_IMAGE_CONTENT_TYPES,
    max_file_size=settings.NOTE_ATTACHMENT_MAX_FILE_SIZE,
)


def create_note_attachment_presigned_uploads(
    *,
    user: User,
    uploads: Iterable[UploadRequest],
) -> AuthorizedPresignedUploadBatch:
    """Generate presigned S3 URLs and upload tokens for note attachments (Phase 1)."""
    return file_upload.create_presigned_uploads(
        user=user,
        uploads=uploads,
        config=NOTE_ATTACHMENT_CONFIG,
    )


def resolve_note_file_uploads(
    *,
    user: User,
    note: Note,
    attachments: Iterable[UploadConfirmation],
    permission_group: Optional[PermissionGroup] = None,
) -> list[Attachment]:
    """Validate tokens + S3 → create Attachment rows for a note (Phase 3).

    ``permission_group`` is the legacy arm: when the caller holds the
    ``CASEWORKER`` group, the guardian rows below are assigned for parity with
    the pre-cutover path.  A grant-only holder has none — authority is the
    caller's note gate (``get_writable_or_deny``), so the row is created without
    guardians rather than refused.  Resolving the group here would raise for
    that holder and abort the whole upload.
    """
    with transaction.atomic():
        attached = file_upload.create_attachment_records(
            user=user,
            content_object=note,
            uploads=attachments,
            config=NOTE_ATTACHMENT_CONFIG,
        )

        if permission_group is not None:
            for att in attached:
                assign_object_permissions(
                    permission_group,
                    att,
                    [
                        Attachment.perms.DELETE,
                        Attachment.perms.CHANGE,
                    ],
                )

    return attached
