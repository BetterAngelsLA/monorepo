import re
from typing import TYPE_CHECKING, cast

from common.permissions.utils import require_can
from common.utils import get_by_pk_or_not_found
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Room, Shelter
from shelters.selectors import room_get, room_queryset, shelter_get
from shelters.services.data import RoomCreateData, RoomUpdateData
from shelters.services.utils import (
    _ROOM_M2M_FIELDS,
    _clone_label,
    _set_m2m_from_enums,
    _split_payload,
    _validate_subset_attributes,
)

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def room_create(*, user: "User", organization_id: str, data: RoomCreateData) -> Room:
    """Create a new Room associated with an existing Shelter.

    Resolves *shelter* via :func:`~shelters.selectors.shelter_get` with
    ``view_shelter`` permission, then checks create authority with
    ``require_can(user, Room.perms.ADD, org)`` (ADR 0001 §2.6).

    *data* is a typed write payload (:class:`RoomCreateData`); ``None`` fields
    are left to model defaults.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the shelter is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add rooms.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    shelter = shelter_get(
        user=user,
        shelter_id=data.shelter_id,
        organization_id=organization_id,
        permission=Shelter.perms.VIEW,
    )

    require_can(user, Room.perms.ADD, org=organization_id)

    scalar_data, m2m_data = _split_payload(data, _ROOM_M2M_FIELDS, skip=frozenset({"shelter_id"}))

    _validate_subset_attributes(shelter, m2m_data)

    room = Room(shelter=shelter, **scalar_data)
    room.full_clean()
    room.save()
    _set_m2m_from_enums(room, m2m_data)
    return room


@transaction.atomic
def room_update(*, user: "User", organization_id: str, data: RoomUpdateData) -> Room:
    """Update an existing room, including M2M relationships when provided.

    Resolves *room* (``data.room_id``) via :func:`~shelters.selectors.room_get`
    with ``change_room`` permission.

    *data* is a typed write payload (:class:`RoomUpdateData`) that carries the
    target ``room_id``; ``None`` fields (absent or explicit null) are left
    unchanged.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    room = room_get(
        user=user,
        room_id=data.room_id,
        organization_id=organization_id,
        permission=Room.perms.CHANGE,
    )

    scalar_data, m2m_data = _split_payload(data, _ROOM_M2M_FIELDS, skip=frozenset({"room_id"}))

    _validate_subset_attributes(room.shelter, m2m_data)

    for key, value in scalar_data.items():
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

    Unmatched or inaccessible IDs are silently skipped; only successfully
    deleted IDs are returned.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching rooms exist.
    """
    qs = room_queryset(user=user, organization_id=organization_id, permission=Room.perms.DELETE)
    qs = qs.filter(pk__in=room_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching rooms found.")
    qs.delete()
    return deleted_ids


@transaction.atomic
def room_clone(*, user: "User", organization_id: str, room_id: str) -> Room:
    """Clone an existing room, including all M2M relationships.

    Scopes to *organization_id* where *user* is a member.  Beds are not copied.
    Cloning creates a new room, so it follows the create convention (ADR 0001
    §2.6): the source is resolved with view authority and create authority is
    checked with ``can(user, Room.perms.ADD, org)``.

    Raises:
        ``ObjectDoesNotExist`` when the room is not found.
        ``django.core.exceptions.PermissionDenied`` when the user cannot add rooms.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    qs = room_queryset(
        Room.objects.select_related("shelter").prefetch_related(*_ROOM_M2M_FIELDS),
        user=user,
        organization_id=organization_id,
        permission=Room.perms.VIEW,
    )
    source = get_by_pk_or_not_found(qs, pk=room_id)

    require_can(user, Room.perms.ADD, org=organization_id)

    return cast(
        Room,
        source.make_clone(attrs={"name": _unique_clone_name(shelter_id=source.shelter.pk, name=source.name)}),
    )
