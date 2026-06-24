import re
from typing import TYPE_CHECKING, Any, Dict, cast

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Room, Shelter
from shelters.selectors import room_get, room_queryset, shelter_get
from common.utils import get_by_pk_or_not_found
from shelters.services.utils import _ROOM_M2M_FIELDS, _clone_label, _set_m2m_from_enums, _validate_subset_attributes

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def room_create(*, user: "User", organization_id: str, data: Dict[str, Any]) -> Room:
    """Create a new Room associated with an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``view_shelter`` permission.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    shelter_id = data.pop("shelter_id")

    shelter = shelter_get(
        user=user,
        shelter_id=shelter_id,
        organization_id=organization_id,
        permission=Shelter.perms.VIEW,
    )

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
def room_update(*, user: "User", organization_id: str, room_id: int | str, data: Dict[str, Any]) -> Room:
    """Update an existing room, including M2M relationships when provided.

    Resolves *room* via :func:`~shelters.selectors.room_get` with
    ``change_room`` permission.

    Only keys present in *data* are applied; ``None`` scalar values are
    skipped.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    data.pop("id", None)

    room = room_get(
        user=user,
        room_id=room_id,
        organization_id=organization_id,
        permission=Room.perms.CHANGE,
    )

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
def room_delete(*, user: "User", organization_id: str, room_ids: list[int]) -> list[int]:
    """Delete rooms and return the deleted IDs.

    Scopes to *organization_id* where *user* is a member.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching rooms exist.
    """
    qs = room_queryset(user=user, organization_id=organization_id)
    qs = qs.filter(pk__in=room_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching rooms found.")
    qs.delete()
    return deleted_ids


@transaction.atomic
def room_clone(*, user: "User", organization_id: str, room_id: str) -> Room:
    """Clone an existing room, including all M2M relationships.

    Scopes to *organization_id* where *user* is a member.
    Beds are not copied.

    Raises:
        ``ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    qs = room_queryset(
        Room.objects.select_related("shelter").prefetch_related(*_ROOM_M2M_FIELDS),
        user=user,
        organization_id=organization_id,
    )
    source = get_by_pk_or_not_found(qs, pk=room_id)
    return cast(
        Room,
        source.make_clone(attrs={"name": _unique_clone_name(shelter_id=source.shelter.pk, name=source.name)}),
    )
