"""
Shelter services — business logic for writing to the database.

Following the Django Styleguide (HackSoft), services are the single source
of truth for write operations.  They are framework-agnostic: no GraphQL /
Strawberry imports, no ``info`` parameter, no API-layer exceptions.

Raises ``django.core.exceptions.ValidationError`` on invalid data — callers
(API / schema layer) are responsible for translating to their own error format.
"""

from typing import TYPE_CHECKING, Any, Dict, List

from clients.enums import ClientStatusEnum
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import models, transaction
from organizations.models import Organization
from places import Places
from shelters.enums import (
    BedStatusChoices,
    ConditionChoices,
    DayOfWeekChoices,
    RoomStatusChoices,
    ScheduleTypeChoices,
)
from shelters.models import Bed, Reservation, ReservationClient, Room, Schedule, Shelter
from shelters.selectors import shelter_get

if TYPE_CHECKING:
    from accounts.models import User

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_m2m_field_names(model: type[models.Model]) -> list[str]:
    """Return the names of every ``ManyToManyField`` on *model*."""
    return [field.name for field in model._meta.many_to_many]


def _set_m2m_from_enums(instance: models.Model, data: Dict[str, List[Any]]) -> None:
    """Set M2M relationships from enum / string values using ``get_or_create``.

    Handles the *enum-backed lookup-table* pattern where each M2M target
    model has a single ``name`` field (``TextChoicesField`` with
    ``unique=True``).  Enum values are extracted via
    ``getattr(v, "value", v)`` so both enum instances and raw strings
    (e.g. city names) are supported.
    """
    for field_name, values in data.items():
        if not values:
            getattr(instance, field_name).set([])
            continue

        related_model: Any = instance._meta.get_field(field_name).related_model
        instances = [related_model.objects.get_or_create(name=getattr(v, "value", v))[0] for v in values]
        getattr(instance, field_name).set(instances)


def _parse_location(data: Any) -> Any:
    """Convert a ``ShelterLocationInput`` dict to a ``Places`` object."""
    if not data:
        return None
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    return Places(
        place=data.get("place"),
        latitude=str(latitude) if latitude is not None else None,
        longitude=str(longitude) if longitude is not None else None,
    )


def _prepare_shelter_data(
    data: Dict[str, Any],
    m2m_field_names: list[str],
) -> tuple[Dict[str, Any], Dict[str, List[Any]], List[Dict[str, Any]]]:
    """Separate M2M data and schedules from scalar fields and transform custom types.

    Transforms:
    - ``location`` dict → ``Places`` instance
    - ``organization`` ID → ``organization_id`` FK column
    - ``status`` enum → raw string value
    - ``schedules`` list extracted for bulk creation after shelter save

    Returns ``(scalar_data, m2m_data, schedules_data)``.
    """
    m2m_data: Dict[str, List[Any]] = {k: data.pop(k) for k in list(data) if k in m2m_field_names}

    # Extract schedules before model creation
    schedules_data: List[Dict[str, Any]] = data.pop("schedules", None) or []

    if "location" in data:
        data["location"] = _parse_location(data["location"])

    if org := data.pop("organization", None):
        data["organization_id"] = org

    if "status" in data:
        status = data["status"]
        if status is not None:
            data["status"] = getattr(status, "value", status)
        else:
            del data["status"]

    return data, m2m_data, schedules_data


# Pre-compute M2M field names once at module level.
_SHELTER_M2M_FIELDS = _get_m2m_field_names(Shelter)


def _create_schedules(shelter: Shelter, schedules_data: List[Dict[str, Any]]) -> None:
    """Bulk-create Schedule rows from a list of input dicts.

    Each input dict may contain ``days`` (a list of day enums).
    One Schedule row is created per day.  If ``days`` is empty or absent,
    a single row with ``day=None`` (every day) is created.
    """
    if not schedules_data:
        return
    objs = []
    for entry in schedules_data:
        # Resolve enum values to their raw strings for TextChoicesField
        raw_type = entry.get("schedule_type")
        schedule_type = (
            ScheduleTypeChoices(getattr(raw_type, "value", raw_type)) if raw_type else ScheduleTypeChoices.OPERATING
        )

        raw_condition = entry.get("condition")
        condition: ConditionChoices | None = (
            ConditionChoices(getattr(raw_condition, "value", raw_condition)) if raw_condition else None
        )

        # Fan out: one row per day (or a single row with day=None)
        raw_days = entry.get("days") or [None]
        for raw_day in raw_days:
            day: DayOfWeekChoices | None = DayOfWeekChoices(getattr(raw_day, "value", raw_day)) if raw_day else None
            objs.append(
                Schedule(
                    shelter=shelter,
                    schedule_type=schedule_type,
                    day=day,
                    start_time=entry.get("start_time"),
                    end_time=entry.get("end_time"),
                    start_date=entry.get("start_date"),
                    end_date=entry.get("end_date"),
                    condition=condition,
                    is_exception=entry.get("is_exception", False),
                )
            )
    Schedule.objects.bulk_create(objs)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


@transaction.atomic
def shelter_create(*, user: "User", data: Dict[str, Any]) -> Shelter:
    """Create a new Shelter with all M2M relationships and schedules.

    Validates that *user* belongs to the target organization before
    creating anything.

    Accepts a plain dict (e.g. from ``strawberry.asdict(data)`` with
    ``UNSET`` keys already removed).

    Raises:
        ``PermissionError`` when the user is not a member of the org.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    org_id = data.get("organization")
    if not Organization.objects.filter(pk=org_id, users=user).exists():
        raise PermissionError("You do not have permission to create a shelter for this organization.")

    scalar_data, m2m_data, schedules_data = _prepare_shelter_data(data, _SHELTER_M2M_FIELDS)

    shelter = Shelter(**scalar_data)
    shelter.full_clean()
    shelter.save()

    _set_m2m_from_enums(shelter, m2m_data)
    _create_schedules(shelter, schedules_data)

    return shelter


_BED_M2M_FIELDS = _get_m2m_field_names(Bed)


@transaction.atomic
def bed_create(*, user: "User", data: Dict[str, Any]) -> Bed:
    """Create a new Bed associated with an existing Shelter.

    Validates that *user* belongs to the shelter's organization via
    ``shelter_get`` before creating the bed.

    Raises:
        ``ObjectDoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")
    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

    m2m_data: Dict[str, List[Any]] = {
        k: data.pop(k) for k in list(data) if k in _BED_M2M_FIELDS and data[k] is not None
    }

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    bed = Bed(shelter=shelter, **scalar_data)
    bed.full_clean()
    bed.save()
    _set_m2m_from_enums(bed, m2m_data)

    return bed


@transaction.atomic
def room_create(*, user: "User", data: Dict[str, Any]) -> Room:
    """Create a new Room associated with an existing Shelter.

    Validates that *user* belongs to the shelter's organization via
    ``shelter_get`` before creating the room.

    Raises:
        ``ObjectDoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = {**data}
    shelter_id = data.pop("shelter_id")
    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")
    room = Room(shelter=shelter, **data)
    room.full_clean()
    room.save()
    return room


@transaction.atomic
def reservation_create(*, user: "User", data: Dict[str, Any]) -> Reservation:
    """Create a Reservation with client associations and status updates.

    Atomically:
    1. Creates the Reservation record
    2. Creates ReservationClient junction records
    3. Updates bed status to RESERVED (if bed provided)
    4. Updates room status to RESERVED (if room provided)
    5. Updates each client's status to RESERVED

    Raises:
        ``ObjectDoesNotExist`` when the shelter, bed, room, or clients
        are not found, or user lacks org access.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    from clients.models import ClientProfile

    data = dict(data)
    shelter_id = data.pop("shelter_id")
    client_entries: List[Dict[str, Any]] = data.pop("clients")
    if not client_entries:
        raise ValidationError("At least one client must be provided.")
    bed_id = data.pop("bed_id", None)
    room_id = data.pop("room_id", None)

    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

    if not bed_id and not room_id:
        raise ValidationError("At least one of bed or room must be provided.")

    bed = None
    if bed_id:
        try:
            bed = Bed.objects.select_for_update().get(pk=bed_id, shelter=shelter)
        except Bed.DoesNotExist:
            raise ObjectDoesNotExist(f"Bed matching ID {bed_id} could not be found in this shelter.")
        if bed.status == BedStatusChoices.RESERVED:
            raise ValidationError(f"Bed matching ID {bed_id} is already reserved.")

    room = None
    if room_id:
        try:
            room = Room.objects.select_for_update().get(pk=room_id, shelter=shelter)
        except Room.DoesNotExist:
            raise ObjectDoesNotExist(f"Room matching ID {room_id} could not be found in this shelter.")
        if room.status == RoomStatusChoices.RESERVED:
            raise ValidationError(f"Room matching ID {room_id} is already reserved.")

    # Validate client entries before any writes
    client_profile_ids = [entry["client_profile_id"] for entry in client_entries]
    if len(client_profile_ids) != len(set(client_profile_ids)):
        raise ValidationError("Duplicate client profiles are not allowed in a single reservation.")

    primary_count = sum(1 for entry in client_entries if entry.get("is_primary", False))
    if primary_count > 1:
        raise ValidationError("Only one client can be marked as primary per reservation.")

    client_profiles = ClientProfile.objects.filter(pk__in=client_profile_ids)
    if client_profiles.count() != len(client_profile_ids):
        raise ObjectDoesNotExist("One or more client profiles could not be found.")

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    reservation = Reservation(
        shelter=shelter,
        bed=bed,
        room=room,
        created_by=user,
        **scalar_data,
    )
    reservation.full_clean()
    reservation.save()

    ReservationClient.objects.bulk_create(
        [
            ReservationClient(
                reservation=reservation,
                client_profile_id=entry["client_profile_id"],
                is_primary=entry.get("is_primary", False),
            )
            for entry in client_entries
        ]
    )

    # Update bed status to RESERVED
    if bed:
        bed.status = BedStatusChoices.RESERVED
        bed.save(update_fields=["status"])

    # Update room status to RESERVED
    if room:
        room.status = RoomStatusChoices.RESERVED
        room.save(update_fields=["status"])

    # Update each client's status to RESERVED
    client_profiles.update(status=ClientStatusEnum.RESERVED)

    return reservation
