import re
from typing import Any, Dict, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.db.models import QuerySet
from shelters.models import Room, Shelter
from shelters.services.utils import _ROOM_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes


@transaction.atomic
def room_create(*, shelter: "Shelter", data: Dict[str, Any]) -> Room:
    """Create a new Room associated with *shelter*.

    The caller is responsible for resolving *shelter* (e.g. via
    :func:`~shelters.selectors.shelter_get`).

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("shelter_id", None)
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
def room_update(*, room: Room, data: Dict[str, Any]) -> Room:
    """Update *room*, including M2M relationships when provided.

    Only keys present in *data* are applied; ``None`` scalar values are
    skipped.

    The caller is responsible for resolving *room* (e.g. via
    :func:`~shelters.selectors.room_get`).

    Raises:
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("id", None)

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


def _copy_number_pattern(name: str | None) -> re.Pattern[str]:
    if name:
        return re.compile(rf"^{re.escape(name)} \(Copy(?: (\d+))?\)$")
    return re.compile(r"^\(Copy(?: (\d+))?\)$")


def _unique_clone_name(*, shelter_id: int | str, name: str | None) -> str:
    """Return a clone name that is unique within the shelter."""
    primary = _clone_label(name, default="(Copy)")
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
def room_delete(*, queryset: "QuerySet[Room]") -> list[int]:
    """Delete rooms in *queryset* and return the deleted IDs.

    The caller is responsible for scoping *queryset* appropriately
    (e.g. via :func:`~shelters.selectors.operator_room_list`).

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when *queryset* is empty.
    """
    deleted_ids = list(queryset.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching rooms found.")
    queryset.delete()
    return deleted_ids


@transaction.atomic
def room_clone(*, queryset: "QuerySet[Room]", room_id: str) -> Room:
    """Clone an existing room, including all M2M relationships.

    The caller is responsible for scoping *queryset* and prefetching M2M
    fields (e.g. via ``operator_room_list(...).prefetch_related(...)``).
    Beds are not copied.

    Raises:
        ``ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    try:
        source = queryset.get(pk=room_id)
    except Room.DoesNotExist:
        raise ObjectDoesNotExist(f"Room matching ID {room_id} could not be found.")

    return cast(
        Room,
        source.make_clone(attrs={"name": _unique_clone_name(shelter_id=source.shelter.pk, name=source.name)}),
    )
