from datetime import datetime
from typing import Any, Dict, List, Optional

import pghistory
from accounts.models import PermissionGroup, User
from clients.models import ClientProfile
from common.enums import SelahTeamEnum
from common.models import Location
from common.permissions.utils import assign_object_permissions
from django.db import transaction
from django.utils import timezone
from notes.enums import MoodEnum, ServiceRequestStatusEnum, ServiceRequestTypeEnum
from notes.models import Mood, Note, OrganizationService, ServiceRequest
from notes.permissions import (
    NotePermissions,
    PrivateDetailsPermissions,
    ServiceRequestPermissions,
)
from tasks.services import task_create

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


def note_create(
    *,
    user: User,
    permission_group: PermissionGroup,
    purpose: Optional[str] = None,
    team: Optional[SelahTeamEnum] = None,
    public_details: str = "",
    private_details: str = "",
    client_profile_id: Optional[str] = None,
    is_submitted: bool = False,
    interacted_at: Optional[datetime] = None,
    location: Optional[Location] = None,
) -> Note:
    """Create a Note and assign object-level permissions."""
    note = Note.objects.create(
        purpose=purpose,
        team=team,
        public_details=public_details,
        private_details=private_details,
        client_profile_id=client_profile_id,
        is_submitted=is_submitted,
        interacted_at=interacted_at or timezone.now(),
        location=location,
        created_by=user,
        organization=permission_group.organization,
    )

    assign_object_permissions(
        permission_group.group,
        note,
        [
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
            PrivateDetailsPermissions.VIEW,
        ],
    )

    return note


def note_update(
    *,
    note: Note,
    data: Dict[str, Any],
) -> Note:
    """Update a Note. Caller is responsible for permission checks."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_update"):
        for field, value in data.items():
            if field == "id":
                continue
            # Handle location FK — resolve ID to Location instance
            if field == "location" and value is not None:
                value = Location.objects.get(pk=value)
            setattr(note, field, value)
        note.save()
    return note


def note_update_location(
    *,
    note: Note,
    location_data: Dict[str, Any],
) -> Note:
    """Resolve a Location and attach it to a Note. Caller is responsible for permission checks."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_update_location"):
        location = Location.get_or_create_location(location_data)
        note.location = location
        note.save(update_fields=["location"])
    return note


# ---------------------------------------------------------------------------
# Mood
# ---------------------------------------------------------------------------


def mood_create(
    *,
    data: List[MoodEnum],
    note: Note,
) -> List[Mood]:
    """Create one or more Moods for a Note (no permission check; use for internal composition)."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="mood_create"):
        return Mood.objects.bulk_create([Mood(descriptor=m, note=note) for m in data])


def mood_delete(*, mood: Mood) -> int:
    """Delete a Mood. Caller is responsible for permission checks."""
    deleted_id = mood.id
    with pghistory.context(note_id=str(mood.note_id), timestamp=timezone.now(), label="mood_delete"):
        mood.delete()
    return deleted_id


# ---------------------------------------------------------------------------
# Service Request
# ---------------------------------------------------------------------------


def service_request_create(
    *,
    user: User,
    permission_group: PermissionGroup,
    data: List[Dict[str, Any]],
    status: ServiceRequestStatusEnum,
    client_profile: Optional[ClientProfile] = None,
) -> List[ServiceRequest]:
    """Create one or more ServiceRequests and assign object-level permissions."""
    created: List[ServiceRequest] = []
    for item in data:
        sr = ServiceRequest.objects.create(
            service=_resolve_service(item, permission_group.organization),
            status=status,
            client_profile=client_profile,
            created_by=user,
        )

        assign_object_permissions(
            permission_group.group,
            sr,
            [
                ServiceRequestPermissions.VIEW,
                ServiceRequestPermissions.CHANGE,
                ServiceRequestPermissions.DELETE,
            ],
        )
        created.append(sr)

    return created


def service_request_update(
    *,
    service_request: ServiceRequest,
    data: Dict[str, Any],
) -> ServiceRequest:
    """Update a ServiceRequest. Caller is responsible for permission checks."""
    note_id = service_request.get_note_id()
    with pghistory.context(note_id=str(note_id), timestamp=timezone.now(), label="service_request_update"):
        for field, value in data.items():
            if field != "id":
                setattr(service_request, field, value)
        service_request.save()
    return service_request


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
    permission_group: PermissionGroup,
    note: Note,
    data: List[Dict[str, Any]],
    sr_type: ServiceRequestTypeEnum,
) -> List[ServiceRequest]:
    """Create ServiceRequests and link them to a Note's M2M."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_service_request_create"):
        srs = service_request_create(
            user=user,
            permission_group=permission_group,
            data=data,
            status=_status_for_sr_type(sr_type),
            client_profile=note.client_profile,
        )

        if sr_type == ServiceRequestTypeEnum.PROVIDED:
            note.provided_services.add(*srs)
        elif sr_type == ServiceRequestTypeEnum.REQUESTED:
            note.requested_services.add(*srs)

    return srs


def note_service_request_remove(
    *,
    note: Note,
    service_request: ServiceRequest,
    sr_type: ServiceRequestTypeEnum,
) -> None:
    """Remove a ServiceRequest from a Note's M2M. Caller is responsible for permission checks."""
    with pghistory.context(note_id=str(note.id), timestamp=timezone.now(), label="note_service_request_remove"):
        if sr_type == ServiceRequestTypeEnum.REQUESTED:
            note.requested_services.remove(service_request)
        elif sr_type == ServiceRequestTypeEnum.PROVIDED:
            note.provided_services.remove(service_request)
        else:
            raise NotImplementedError(f"Unsupported service request type: {sr_type}")


# ---------------------------------------------------------------------------
# Note (full deferred creation)
# ---------------------------------------------------------------------------


@transaction.atomic
def note_create_full(
    *,
    user: User,
    permission_group: PermissionGroup,
    purpose: Optional[str] = None,
    team: Optional[SelahTeamEnum] = None,
    public_details: str = "",
    private_details: str = "",
    client_profile_id: Optional[str] = None,
    is_submitted: bool = False,
    interacted_at: Optional[datetime] = None,
    location_data: Optional[Dict[str, Any]] = None,
    moods: Optional[List[MoodEnum]] = None,
    provided_services: Optional[List[Dict[str, Any]]] = None,
    requested_services: Optional[List[Dict[str, Any]]] = None,
    tasks: Optional[List[Dict[str, Any]]] = None,
) -> Note:
    """
    Create a note with all nested relations atomically.

    This is the "deferred creation" entry point: everything is held locally
    on the client and sent in one shot on submit or save-as-draft.
    """

    # --- Location ---
    location = None
    if location_data:
        location = Location.get_or_create_location(location_data)

    # --- Note ---
    note = note_create(
        user=user,
        permission_group=permission_group,
        purpose=purpose,
        team=team,
        public_details=public_details or "",
        private_details=private_details or "",
        client_profile_id=client_profile_id,
        is_submitted=is_submitted,
        interacted_at=interacted_at,
        location=location,
    )

    # --- Moods ---
    if moods:
        mood_create(data=moods, note=note)

    # --- Provided services ---
    if provided_services:
        note_service_request_create(
            user=user,
            permission_group=permission_group,
            note=note,
            data=provided_services,
            sr_type=ServiceRequestTypeEnum.PROVIDED,
        )

    # --- Requested services ---
    if requested_services:
        note_service_request_create(
            user=user,
            permission_group=permission_group,
            note=note,
            data=requested_services,
            sr_type=ServiceRequestTypeEnum.REQUESTED,
        )

    # --- Tasks ---
    if tasks:
        task_create(
            user=user,
            permission_group=permission_group,
            data=tasks,
            note=note,
            client_profile=note.client_profile,
        )

    return note
