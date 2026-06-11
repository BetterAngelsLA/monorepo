import re
from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Room, Shelter
from shelters.selectors import admin_room_list, shelter_get
from shelters.services.utils import _ROOM_M2M_FIELDS, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


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
    data = dict(data)
    shelter_id = data.pop("shelter_id")
    try:
        shelter = shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist(f"Shelter matching ID {shelter_id} could not be found.")

    m2m_data: Dict[str, Any] = {k: data.pop(k) for k in list(data) if k in _ROOM_M2M_FIELDS and data[k] is not None}

    _validate_subset_attributes(shelter, m2m_data)
    raw_occupants = m2m_data.pop("occupants", [])

    # Drop None values so model defaults apply
    scalar_data = {k: v for k, v in data.items() if v is not None}

    room = Room(shelter=shelter, **scalar_data)
    room.full_clean()
    room.save()
    _set_m2m_from_enums(room, m2m_data)
    if raw_occupants:
        room.occupants.set(raw_occupants)

    # TODO: Assign perms here. See: SDB-178

    return room


@transaction.atomic
def room_update(*, user: "User", room_id: int | str, data: Dict[str, Any]) -> Room:
    """Update an existing room, including M2M relationships when provided.

    Validates org access via the room's shelter. Only keys present in *data*
    are applied; ``None`` scalar values are skipped.

    Raises:
        ``ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    try:
        room = Room.objects.select_related("shelter").prefetch_related(*_ROOM_M2M_FIELDS).get(pk=room_id)
    except Room.DoesNotExist:
        raise ObjectDoesNotExist(f"Room matching ID {room_id} could not be found.")

    shelter_get(user=user, shelter_id=room.shelter_id)

    m2m_data: Dict[str, Any] = {
        k: data.pop(k) for k in list(data) if k in _ROOM_M2M_FIELDS and k in data and data[k] is not None
    }

    _validate_subset_attributes(room.shelter, m2m_data)

    for key, value in data.items():
        if value is not None:
            setattr(room, key, value)

    room.full_clean()
    room.save()

    if m2m_data:
        _set_m2m_from_enums(room, m2m_data)

    return room


def _clone_label(label: str | None) -> str:
    if not label:
        return "(Copy)"
    return f"{label} (Copy)"


def _copy_number_pattern(name: str | None) -> re.Pattern[str]:
    if name:
        return re.compile(rf"^{re.escape(name)} \(Copy(?: (\d+))?\)$")
    return re.compile(r"^\(Copy(?: (\d+))?\)$")


def _unique_clone_name(*, shelter_id: int | str, name: str | None) -> str:
    """Return a clone name that is unique within the shelter."""
    primary = _clone_label(name)
    prefix = f"{name} (Copy" if name else "(Copy"
    pattern = _copy_number_pattern(name)

    existing_names = Room.objects.filter(shelter_id=shelter_id, name__startswith=prefix).values_list("name", flat=True)
    if primary not in existing_names:
        return primary

    max_copy_number = 1
    for existing_name in existing_names:
        match = pattern.fullmatch(existing_name)
        if match:
            max_copy_number = max(max_copy_number, int(match.group(1) or 1))

    next_number = max_copy_number + 1
    base = name or ""
    return f"{base} (Copy {next_number})" if base else f"(Copy {next_number})"


@transaction.atomic
def room_delete(*, user: "User", ids: list[int]) -> list[int]:
    """Delete rooms by their IDs and return the deleted instances.

    Raises:
        ``ObjectDoesNotExist`` when any of the given IDs does not match a room.
    """
    rooms = admin_room_list(Room.objects.all(), user=user).filter(pk__in=ids)
    found_ids = {room.pk for room in rooms}
    missing = [id for id in ids if id not in found_ids]
    deleted_ids = []
    if missing:
        raise ObjectDoesNotExist(f"Room(s) matching ID(s) {missing} could not be found.")
    for room in rooms:
        deleted_ids.append(room.pk)
        room.delete()

    return deleted_ids


@transaction.atomic
def room_clone(*, user: "User", room_id: str, shelter_id: str) -> Room:
    """Clone an existing room on *shelter_id*, including all M2M relationships.

    Validates org access via ``shelter_get``. The source room must belong to
    *shelter_id*. Beds are not copied.

    Raises:
        ``ObjectDoesNotExist`` when the shelter or room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter = shelter_get(user=user, shelter_id=shelter_id)
    try:
        source = Room.objects.filter(shelter_id=shelter.pk).prefetch_related(*_ROOM_M2M_FIELDS).get(pk=room_id)
    except Room.DoesNotExist:
        raise ObjectDoesNotExist(f"Room matching ID {room_id} could not be found for shelter {shelter_id}.")

    clone = Room(
        amenities=source.amenities,
        last_cleaned_inspected=source.last_cleaned_inspected,
        maintenance_flag=source.maintenance_flag,
        medical_respite=source.medical_respite,
        name=_unique_clone_name(shelter_id=shelter.pk, name=source.name),
        notes=source.notes,
        shelter=shelter,
        status=source.status,
        storage=source.storage,
        type=source.type,
        type_other=source.type_other,
    )
    clone.full_clean()
    clone.save()

    for field_name in _ROOM_M2M_FIELDS:
        getattr(clone, field_name).set(getattr(source, field_name).all())

    return clone
