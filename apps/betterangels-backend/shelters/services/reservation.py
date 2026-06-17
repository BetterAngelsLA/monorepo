from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from shelters.models import Reservation, ReservationClient, Shelter
from shelters.selectors import admin_reservation_list, bed_get, reservation_get, room_get, shelter_get

if TYPE_CHECKING:
    from accounts.models import User


def _set_clients(reservation: Reservation, clients_data: list[Dict[str, Any]] | None) -> None:
    if clients_data is None:
        return

    reservation.reservation_clients.all().delete()
    for entry in clients_data:
        ReservationClient.objects.create(
            reservation=reservation,
            client_profile_id=entry["client_profile_id"],
            is_primary=entry.get("is_primary", False),
        )


@transaction.atomic
def reservation_create(*, user: "User", data: Dict[str, Any]) -> Reservation:
    """Create a new Reservation associated with a Room and/or Bed.

    Validates that *user* belongs to the shelter's organization. The shelter
    is derived from ``bed_id`` or ``room_id``.

    Raises:
        ``ObjectDoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)

    bed_id = data.get("bed_id")
    room_id = data.get("room_id")

    clients_data = data.pop("clients", None)
    if not clients_data:
        raise ValidationError("At least one client must be associated with a reservation.")

    if bed_id:
        shelter_id = bed_get(user=user, bed_id=bed_id).shelter_id
    elif room_id:
        shelter_id = room_get(user=user, room_id=room_id).shelter_id
    else:
        raise ObjectDoesNotExist("A bed or room must be provided to create a Reservation.")

    try:
        shelter_get(user=user, shelter_id=shelter_id)
    except Shelter.DoesNotExist:
        raise ObjectDoesNotExist("You do not have permission to create a Reservation for this Shelter.")

    scalar_data = {k: v for k, v in data.items() if v is not None}

    reservation = Reservation(created_by=user, **scalar_data)
    reservation.full_clean()
    reservation.save()
    _set_clients(reservation, clients_data)

    return reservation


@transaction.atomic
def reservation_update(*, user: "User", reservation_id: int | str, data: Dict[str, Any]) -> Reservation:
    """Update an existing reservation.

    Validates org access via the reservation's shelter. Only keys present in
    *data* are applied; ``None`` scalar values are skipped.

    Raises:
        ``ObjectDoesNotExist`` when the reservation is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    try:
        reservation = reservation_get(user=user, reservation_id=reservation_id)
    except Reservation.DoesNotExist:
        raise ObjectDoesNotExist(f"Reservation matching ID {reservation_id} could not be found.")

    clients_data = data.pop("clients", None)

    for key, value in data.items():
        if value is not None:
            setattr(reservation, key, value)

    reservation.full_clean()
    reservation.save()
    _set_clients(reservation, clients_data)

    return reservation


@transaction.atomic
def reservation_delete(*, user: "User", ids: list[int]) -> list[int]:
    """Delete reservations by their IDs and return the deleted IDs.

    Raises:
        ``ObjectDoesNotExist`` when any of the given IDs does not match a reservation
        the user can access.
    """
    reservations = admin_reservation_list(Reservation.objects.all(), user=user).filter(pk__in=ids)
    deleted_ids = []

    for reservation in reservations:
        pk = reservation.pk
        reservation.delete()
        deleted_ids.append(pk)

    return deleted_ids
