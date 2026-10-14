"""Computed status query helpers for beds and rooms.

Query-building functions that encode the status priority chain:
OUT_OF_SERVICE -> OCCUPIED -> RESERVED -> IN_TURNAROUND -> AVAILABLE

Moved from ``shelters/managers.py`` per HackSoft style guide:
*"Business logic should not live in Custom managers or querysets."*
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Union, cast

from django.db.models import (
    Case,
    CharField,
    Count,
    DateTimeField,
    Exists,
    IntegerField,
    OuterRef,
    Q,
    Subquery,
    Value,
    When,
)

from shelters.enums import BedStatusChoices, ReservationStatusChoices, RoomStatusChoices

if TYPE_CHECKING:
    from shelters.models import Bed, Reservation, Room

# Not a TypeVar -- the two enums are independent and correspondence can't be enforced here.
StatusChoice = Union[BedStatusChoices, RoomStatusChoices]


def _reservation_model() -> type[Reservation]:
    from shelters.models import Reservation

    return Reservation


def _reservation_exists(
    fk_field: str,
    *,
    status: ReservationStatusChoices | None = None,
    status__in: list[ReservationStatusChoices] | None = None,
    extra: dict[str, object] | None = None,
) -> Exists:
    """Return an ``Exists`` subquery for reservations matching the given filters on *fk_field*."""
    Reservation = _reservation_model()
    filters: dict[str, object] = {fk_field: OuterRef("pk")}
    if status is not None:
        filters["status"] = status
    if status__in is not None:
        filters["status__in"] = status__in
    if extra:
        filters.update(extra)
    return Exists(Reservation.objects.filter(**filters))


# Convenience wrappers -- self-documenting callers for the status filter chain.
def checked_in_exists(fk_field: str) -> Exists:
    return _reservation_exists(fk_field, status=ReservationStatusChoices.CHECKED_IN)


def confirmed_or_overdue_exists(fk_field: str) -> Exists:
    return _reservation_exists(
        fk_field,
        status__in=[ReservationStatusChoices.CONFIRMED, ReservationStatusChoices.CHECK_IN_OVERDUE],
    )


def completed_checkout_exists(fk_field: str) -> Exists:
    return _reservation_exists(
        fk_field, status=ReservationStatusChoices.COMPLETED, extra={"checked_out_at__isnull": False}
    )


def active_reservation_exists(fk_field: str) -> Exists:
    from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES

    return _reservation_exists(fk_field, status__in=list(ACTIVE_RESERVATION_STATUSES))


def latest_completed_checkout_subquery(fk_field: str) -> Subquery:
    Reservation = _reservation_model()
    return Subquery(
        Reservation.objects.filter(
            **{fk_field: OuterRef("pk")},
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at__isnull=False,
        )
        .order_by("-checked_out_at")
        .values("checked_out_at")[:1],
        output_field=DateTimeField(),
    )


def in_turnaround_filter_q(fk_field: str) -> Q:
    """``Q`` for in-turnaround without a prior ``annotate`` (uses correlated subqueries)."""
    has_completed_checkout = Q(completed_checkout_exists(fk_field))
    needs_cleaning = Q(last_cleaned__isnull=True) | Q(last_cleaned__lte=latest_completed_checkout_subquery(fk_field))
    return has_completed_checkout & needs_cleaning


def status_filter_q(
    status: StatusChoice,
    *,
    fk_field: str,
    status_enum: type[BedStatusChoices] | type[RoomStatusChoices],
) -> Q:
    """Build a ``Q`` object for filtering a single computed status (index-friendly Exists)."""
    if status == status_enum.OUT_OF_SERVICE:
        return Q(maintenance_flag=True)

    base = Q(maintenance_flag=False)

    if status == status_enum.OCCUPIED:
        return base & Q(checked_in_exists(fk_field))

    if status == status_enum.RESERVED:
        return base & Q(confirmed_or_overdue_exists(fk_field)) & ~Q(checked_in_exists(fk_field))

    if status == status_enum.IN_TURNAROUND:
        return base & in_turnaround_filter_q(fk_field) & ~Q(active_reservation_exists(fk_field))

    if status == status_enum.AVAILABLE:
        return base & ~in_turnaround_filter_q(fk_field) & ~Q(active_reservation_exists(fk_field))

    return Q()


def computed_status_case(
    fk_field: str,
    status_enum: type[BedStatusChoices] | type[RoomStatusChoices],
) -> Case:
    """First-match status annotation; priority matches ``compute_reservable_status``."""
    return Case(
        When(maintenance_flag=True, then=Value(status_enum.OUT_OF_SERVICE)),
        When(checked_in_exists(fk_field), then=Value(status_enum.OCCUPIED)),
        When(confirmed_or_overdue_exists(fk_field), then=Value(status_enum.RESERVED)),
        When(in_turnaround_filter_q(fk_field), then=Value(status_enum.IN_TURNAROUND)),
        default=Value(status_enum.AVAILABLE),
        output_field=CharField(),
    )


def bed_computed_status_annotation() -> Case:
    return computed_status_case("bed_id", BedStatusChoices)


def room_computed_status_annotation() -> Case:
    return computed_status_case("room_id", RoomStatusChoices)


def shelter_count_subquery(
    model_class: type[Bed] | type[Room],
    status: StatusChoice | None = None,
) -> Subquery:
    from shelters.managers import BedQuerySet, RoomQuerySet

    qs = cast(
        BedQuerySet | RoomQuerySet,
        model_class.objects.filter(shelter_id=OuterRef("pk")),
    )
    if status is not None:
        qs = cast(BedQuerySet | RoomQuerySet, qs.filter_by_status(status))

    return Subquery(
        qs.order_by().values("shelter").annotate(c=Count("pk")).values("c"),
        output_field=IntegerField(),
    )
