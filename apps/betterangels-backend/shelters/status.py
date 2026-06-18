"""Pure-Python computed status rules for beds and rooms."""

from __future__ import annotations

import datetime
from typing import Set, TypeVar

from shelters.enums import BedStatusChoices, ReservationStatusChoices, RoomStatusChoices

_StatusChoice = TypeVar("_StatusChoice", BedStatusChoices, RoomStatusChoices)


def compute_reservable_status(
    *,
    maintenance_flag: bool,
    last_cleaned: datetime.datetime | None,
    last_checkout: datetime.datetime | None,
    active_reservation_statuses: Set[str],
    status_enum: type[_StatusChoice],
) -> _StatusChoice:
    """Return computed status using the same priority order as SQL annotations."""
    if maintenance_flag:
        return status_enum.OUT_OF_SERVICE

    if last_checkout and (last_cleaned is None or last_cleaned <= last_checkout):
        return status_enum.IN_TURNAROUND

    if ReservationStatusChoices.CHECKED_IN in active_reservation_statuses:
        return status_enum.OCCUPIED

    if active_reservation_statuses & {
        ReservationStatusChoices.CONFIRMED,
        ReservationStatusChoices.CHECK_IN_OVERDUE,
    }:
        return status_enum.RESERVED

    return status_enum.AVAILABLE


def compute_bed_status(
    *,
    maintenance_flag: bool,
    last_cleaned: datetime.datetime | None,
    last_checkout: datetime.datetime | None,
    active_reservation_statuses: Set[str],
) -> BedStatusChoices:
    return compute_reservable_status(
        maintenance_flag=maintenance_flag,
        last_cleaned=last_cleaned,
        last_checkout=last_checkout,
        active_reservation_statuses=active_reservation_statuses,
        status_enum=BedStatusChoices,
    )


def compute_room_status(
    *,
    maintenance_flag: bool,
    last_cleaned: datetime.datetime | None,
    last_checkout: datetime.datetime | None,
    active_reservation_statuses: Set[str],
) -> RoomStatusChoices:
    return compute_reservable_status(
        maintenance_flag=maintenance_flag,
        last_cleaned=last_cleaned,
        last_checkout=last_checkout,
        active_reservation_statuses=active_reservation_statuses,
        status_enum=RoomStatusChoices,
    )
