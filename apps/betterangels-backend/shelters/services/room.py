from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Room, Shelter
from shelters.selectors import shelter_get
from shelters.services.utils import (
    _ROOM_M2M_FIELDS,
    _set_m2m_from_enums,
    _validate_subset_attributes,
)

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
    return room
