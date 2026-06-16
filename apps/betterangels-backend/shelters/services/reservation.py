from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Reservation, ReservationClient, Shelter
from shelters.selectors import admin_reservation_list, reservation_get, shelter_get

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
    """Create a new Reservation associated with an existing Shelter.

    Validates that *user* belongs to the shelter's organization via
    ``shelter_get`` before creating the reservation.

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

    clients_data = data.pop("clients", None)
    scalar_data = {k: v for k, v in data.items() if v is not None}

    reservation = Reservation(shelter=shelter, created_by=user, **scalar_data)
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
