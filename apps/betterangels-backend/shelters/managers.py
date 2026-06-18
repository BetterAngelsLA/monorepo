from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Iterable, Union, cast

from django.db import models
from django.db.models import (
    Case,
    CharField,
    Count,
    DateTimeField,
    Exists,
    F,
    IntegerField,
    Manager,
    OuterRef,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)
from shelters.enums import BedStatusChoices, ReservationStatusChoices, RoomStatusChoices, ScheduleTypeChoices
from shelters.selectors import admin_shelter_list, shelter_list, shelters_open_at

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter  # noqa: F401
    from shelters.models import Bed, Reservation, Room


# Not a TypeVar — the two enums are independent and correspondence can't be enforced here.
StatusChoice = Union[BedStatusChoices, RoomStatusChoices]


class ShelterQuerySet(QuerySet["Shelter"]):
    def approved(self) -> "ShelterQuerySet":
        return shelter_list(self)  # type: ignore[return-value]

    def open_at(
        self,
        dt: datetime.datetime,
        schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
    ) -> "ShelterQuerySet":
        """Shelters whose *schedule_type* schedule says they are open at *dt*."""
        return shelters_open_at(self, dt=dt, schedule_type=schedule_type)  # type: ignore[return-value]


class ShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> ShelterQuerySet:
        return ShelterQuerySet(self.model, using=self._db)

    def approved(self) -> ShelterQuerySet:
        return self.get_queryset().approved()

    def open_at(
        self,
        dt: datetime.datetime,
        schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
    ) -> ShelterQuerySet:
        return self.get_queryset().open_at(dt, schedule_type)


class AdminShelterQuerySet(ShelterQuerySet):
    def for_user(self, user: "User") -> "AdminShelterQuerySet":
        return admin_shelter_list(self, user=user)  # type: ignore[return-value]


class AdminShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> AdminShelterQuerySet:
        return AdminShelterQuerySet(self.model, using=self._db)

    def for_user(self, user: "User") -> AdminShelterQuerySet:
        return self.get_queryset().for_user(user)


def _reservation_model() -> type[Reservation]:
    from shelters.models import Reservation

    return Reservation


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


def has_checked_in_exists(fk_field: str) -> Exists:
    Reservation = _reservation_model()
    return Exists(
        Reservation.objects.filter(
            **{fk_field: OuterRef("pk")},
            status=ReservationStatusChoices.CHECKED_IN,
        )
    )


def has_confirmed_or_overdue_exists(fk_field: str) -> Exists:
    Reservation = _reservation_model()
    return Exists(
        Reservation.objects.filter(
            **{fk_field: OuterRef("pk")},
            status__in=[
                ReservationStatusChoices.CONFIRMED,
                ReservationStatusChoices.CHECK_IN_OVERDUE,
            ],
        )
    )


def has_completed_checkout_exists(fk_field: str) -> Exists:
    Reservation = _reservation_model()
    return Exists(
        Reservation.objects.filter(
            **{fk_field: OuterRef("pk")},
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at__isnull=False,
        )
    )


def has_active_reservation_exists(fk_field: str) -> Exists:
    from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES

    Reservation = _reservation_model()
    return Exists(
        Reservation.objects.filter(
            **{fk_field: OuterRef("pk")},
            status__in=ACTIVE_RESERVATION_STATUSES,
        )
    )


def in_turnaround_q(*, checkout_field: str = "_latest_checkout") -> Q:
    return Q(**{f"{checkout_field}__isnull": False}) & (
        Q(last_cleaned__isnull=True) | Q(last_cleaned__lte=F(checkout_field))
    )


def in_turnaround_filter_q(fk_field: str) -> Q:
    """``Q`` for in-turnaround without a prior ``annotate`` (uses correlated subqueries)."""
    has_completed_checkout = Q(has_completed_checkout_exists(fk_field))
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

    if status == status_enum.IN_TURNAROUND:
        return base & in_turnaround_filter_q(fk_field)

    not_turnaround = ~in_turnaround_filter_q(fk_field)

    if status == status_enum.OCCUPIED:
        return base & not_turnaround & Q(has_checked_in_exists(fk_field))

    if status == status_enum.RESERVED:
        return (
            base & not_turnaround & Q(has_confirmed_or_overdue_exists(fk_field)) & ~Q(has_checked_in_exists(fk_field))
        )

    if status == status_enum.AVAILABLE:
        return base & not_turnaround & ~Q(has_active_reservation_exists(fk_field))

    return Q()


class ReservableStatusQuerySetMixin:
    """Shared status filtering/annotation for Bed and Room querysets."""

    reservable_fk: str = "bed_id"
    status_enum: type[BedStatusChoices] | type[RoomStatusChoices] = BedStatusChoices

    def with_computed_status(self) -> QuerySet:
        fk = self.reservable_fk
        enum = self.status_enum
        latest_checkout = latest_completed_checkout_subquery(fk)
        checked_in = has_checked_in_exists(fk)
        confirmed_or_overdue = has_confirmed_or_overdue_exists(fk)
        qs = cast(QuerySet, self)

        return cast(
            QuerySet,
            qs.annotate(_latest_checkout=latest_checkout).annotate(
                _computed_status=Case(
                    When(maintenance_flag=True, then=Value(enum.OUT_OF_SERVICE)),
                    # IN_TURNAROUND fires before OCCUPIED/RESERVED — the When order is load-bearing.
                    When(in_turnaround_q(checkout_field="_latest_checkout"), then=Value(enum.IN_TURNAROUND)),
                    When(checked_in, then=Value(enum.OCCUPIED)),
                    When(confirmed_or_overdue, then=Value(enum.RESERVED)),
                    default=Value(enum.AVAILABLE),
                    output_field=CharField(),
                )
            ),
        )

    def filter_by_status(self, status: StatusChoice) -> QuerySet:
        return cast(QuerySet, self).filter(self.status_filter_q(status))

    def filter_by_statuses(self, statuses: Iterable[StatusChoice]) -> QuerySet:
        # Empty statuses is treated as "no filter" — return the full queryset unchanged.
        combined = Q()
        for status in statuses:
            combined |= self.status_filter_q(status)
        qs = cast(QuerySet, self)
        if not combined:
            return qs
        return qs.filter(combined)

    @classmethod
    def status_filter_q(cls, status: StatusChoice) -> Q:
        return status_filter_q(status, fk_field=cls.reservable_fk, status_enum=cls.status_enum)


class BedQuerySet(ReservableStatusQuerySetMixin, QuerySet):
    reservable_fk = "bed_id"
    status_enum = BedStatusChoices


class RoomQuerySet(ReservableStatusQuerySetMixin, QuerySet):
    reservable_fk = "room_id"
    status_enum = RoomStatusChoices


class BedManager(Manager["Bed"]):
    def get_queryset(self) -> BedQuerySet:
        return BedQuerySet(self.model, using=self._db)

    def with_computed_status(self) -> BedQuerySet:
        return cast(BedQuerySet, self.get_queryset().with_computed_status())

    def filter_by_status(self, status: BedStatusChoices) -> BedQuerySet:
        return cast(BedQuerySet, self.get_queryset().filter_by_status(status))

    def filter_by_statuses(self, statuses: Iterable[BedStatusChoices]) -> BedQuerySet:
        return cast(BedQuerySet, self.get_queryset().filter_by_statuses(statuses))


class RoomManager(Manager["Room"]):
    def get_queryset(self) -> RoomQuerySet:
        return RoomQuerySet(self.model, using=self._db)

    def with_computed_status(self) -> RoomQuerySet:
        return cast(RoomQuerySet, self.get_queryset().with_computed_status())

    def filter_by_status(self, status: RoomStatusChoices) -> RoomQuerySet:
        return cast(RoomQuerySet, self.get_queryset().filter_by_status(status))

    def filter_by_statuses(self, statuses: Iterable[RoomStatusChoices]) -> RoomQuerySet:
        return cast(RoomQuerySet, self.get_queryset().filter_by_statuses(statuses))


def _shelter_reservable_status_count_subquery(
    model_class: type[Bed] | type[Room],
    status: StatusChoice,
) -> Subquery:
    base_qs = cast(BedQuerySet | RoomQuerySet, model_class.objects.filter(shelter_id=OuterRef("pk")))
    return Subquery(
        base_qs.filter_by_status(status).order_by().values("shelter").annotate(c=Count("pk")).values("c"),
        output_field=IntegerField(),
    )


def shelter_bed_status_count_subquery(status: BedStatusChoices) -> Subquery:
    from shelters.models import Bed

    return _shelter_reservable_status_count_subquery(Bed, status)


def shelter_room_status_count_subquery(status: RoomStatusChoices) -> Subquery:
    from shelters.models import Room

    return _shelter_reservable_status_count_subquery(Room, status)
