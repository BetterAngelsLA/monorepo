from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from shelters.models import Reservation
from shelters.selectors import shelter_get
from strawberry import UNSET

if TYPE_CHECKING:
    from accounts.models import User


@transaction.atomic
def reservation_update(*, user: "User", data: Dict[str, Any]) -> Reservation:
    data = dict(data)
    reservation_id = data.pop("reservation_id")

    try:
        reservation = Reservation.objects.get(pk=reservation_id)
        shelter_get(user=user, shelter_id=reservation.shelter_id)
    except Reservation.DoesNotExist:
        raise ObjectDoesNotExist(f"Reservation {reservation_id} not found.")

    for field, value in data.items():
        if value is not UNSET:
            setattr(reservation, field, value)

    reservation.full_clean()
    reservation.save()
    return reservation

@transaction.atomic
def reservation_update_status(*, user: "User", reservation_id: Any, status: Any) -> Reservation:
    try:
        reservation = Reservation.objects.get(pk=reservation_id)
        shelter_get(user=user, shelter_id=reservation.shelter_id)
    except Reservation.DoesNotExist:
        raise ObjectDoesNotExist(f"Reservation {reservation_id} not found.")

    reservation.status = status
    reservation.full_clean()
    reservation.save()
    return reservation
