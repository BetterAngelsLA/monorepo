from typing import TYPE_CHECKING, Any, Dict

from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction
from django.utils import timezone

from shelters.enums import ReservationStatusChoices
from shelters.models import Reservation, ReservationClient
from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES
from shelters.selectors import bed_get, reservation_get, room_get
from shelters.selectors.operator import reservation_queryset
from shelters.status import get_last_completed_checkout, is_in_turnaround

if TYPE_CHECKING:
    from accounts.models import User

    from shelters.models.shelter import Bed, Room


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


def _validate_clients(clients_data: list[dict[str, Any]]) -> None:
    """Validate that exactly one client is primary when multiple clients are assigned."""
    if len(clients_data) == 1:
        return

    primary_count = sum(1 for c in clients_data if c.get("is_primary", False))
    if primary_count != 1:
        raise ValidationError("Exactly one client must be marked as primary when multiple clients are assigned.")


def _validate_reservation(reservation: Reservation) -> None:
    """Validate reservation against business rules: availability, turnaround, conflicts."""
    errors: dict[str, str] = {}

    if reservation.bed:
        _validate_reservable(errors, reservation, reservation.bed, "bed")
    if reservation.room and not reservation.bed:
        _validate_reservable(errors, reservation, reservation.room, "room", room_only=True)

    if errors:
        raise ValidationError(errors)


def _validate_reservable(
    errors: dict[str, str],
    reservation: Reservation,
    reservable: "Bed | Room",
    field_name: str,
    *,
    room_only: bool = False,
) -> None:
    """Validate a single reservable (bed or room) for availability and conflicts."""
    if reservable.maintenance_flag:
        errors[field_name] = f"The selected {field_name} is out of service."
        return

    if is_in_turnaround(
        last_cleaned=reservable.last_cleaned,
        last_checkout=get_last_completed_checkout(reservable.reservations.all()),
    ):
        errors[field_name] = f"The selected {field_name} is currently in turnaround."
        return

    conflicting_qs = Reservation.objects.filter(
        **{f"{field_name}_id": reservable.pk},
        status__in=ACTIVE_RESERVATION_STATUSES,
    )
    if room_only:
        conflicting_qs = conflicting_qs.filter(bed__isnull=True)
    if reservation.pk:
        conflicting_qs = conflicting_qs.exclude(pk=reservation.pk)
    if conflicting_qs.exists():
        errors[field_name] = f"This {field_name} already has an active reservation."


@transaction.atomic
def reservation_create(*, user: "User", organization_id: str, data: Dict[str, Any]) -> Reservation:
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
        bed_get(user=user, organization_id=organization_id, bed_id=bed_id)
    elif room_id:
        room_get(user=user, organization_id=organization_id, room_id=room_id)
    else:
        raise ObjectDoesNotExist("A bed or room must be provided to create a Reservation.")

    scalar_data = {k: v for k, v in data.items() if v is not None}

    reservation = Reservation(created_by=user, **scalar_data)
    reservation.full_clean()
    _validate_reservation(reservation)
    reservation.save()
    _validate_clients(clients_data)
    _set_clients(reservation, clients_data)

    return reservation


@transaction.atomic
def reservation_update(
    *, user: "User", organization_id: str, reservation_id: int | str, data: Dict[str, Any]
) -> Reservation:
    """Update an existing reservation.

    Validates org access via the reservation's shelter. Only keys present in
    *data* are applied; ``None`` scalar values are skipped.

    Raises:
        ``ObjectDoesNotExist`` when the reservation is not found.
        ``django.core.exceptions.ValidationError`` on invalid data.
    """
    data = dict(data)
    try:
        reservation = reservation_get(user=user, organization_id=organization_id, reservation_id=reservation_id)
    except Reservation.DoesNotExist:
        raise ObjectDoesNotExist(f"Reservation matching ID {reservation_id} could not be found.")

    clients_data = data.pop("clients", None)
    if clients_data:
        _validate_clients(clients_data)

    previous_status = reservation.status

    for key, value in data.items():
        if value is not None:
            setattr(reservation, key, value)

    # Auto-set timestamps on status transitions
    new_status = data.get("status")
    if new_status is not None and new_status != previous_status:
        if new_status == ReservationStatusChoices.COMPLETED:
            reservation.checked_out_at = timezone.now()
        elif new_status == ReservationStatusChoices.CHECKED_IN:
            reservation.checked_in_at = timezone.now()

    reservation.full_clean()
    _validate_reservation(reservation)
    reservation.save()
    _set_clients(reservation, clients_data)

    return reservation


@transaction.atomic
def reservation_delete(*, user: "User", organization_id: str, reservation_ids: list[int]) -> list[int]:
    """Delete reservations and return the deleted IDs.

    Scopes to *organization_id* where *user* is a member.

    Unmatched or inaccessible IDs are silently skipped; only successfully
    deleted IDs are returned.

    Raises:
        ``django.core.exceptions.ObjectDoesNotExist`` when no matching reservations exist.
    """
    qs = reservation_queryset(user=user, organization_id=organization_id)
    qs = qs.filter(pk__in=reservation_ids)
    deleted_ids = list(qs.values_list("pk", flat=True))
    if not deleted_ids:
        raise ObjectDoesNotExist("No matching reservations found.")
    qs.delete()
    return deleted_ids
