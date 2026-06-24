from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Iterable, Self, Union, cast

from django.db import models
from django.db.models import Manager, Q, QuerySet
from shelters.enums import BedStatusChoices, RoomStatusChoices, ScheduleTypeChoices
from shelters.open_at import shelters_open_at
from shelters.selectors import shelter_list
from shelters.selectors.computed_status import (
    computed_status_case,
    status_filter_q,
)

if TYPE_CHECKING:
    from shelters.models import Shelter  # noqa: F401
    from shelters.models import Bed, Room


# Not a TypeVar -- the two enums are independent and correspondence can't be enforced here.
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


class ReservableStatusQuerySetMixin:
    """Shared status filtering/annotation for Bed and Room querysets.

    Delegates to query-building functions in
    ``shelters.selectors.computed_status`` per HackSoft style guide.
    """

    reservable_fk: str = "bed_id"
    status_enum: type[BedStatusChoices] | type[RoomStatusChoices] = BedStatusChoices

    def with_computed_status(self) -> Self:
        qs = cast(QuerySet, self)
        return cast(
            Self,
            qs.annotate(_computed_status=computed_status_case(self.reservable_fk, self.status_enum)),
        )

    def filter_by_status(self, status: StatusChoice) -> QuerySet:
        return cast(QuerySet, self).filter(self.status_filter_q(status))

    def filter_by_statuses(self, statuses: Iterable[StatusChoice]) -> QuerySet:
        # Empty statuses is treated as "no filter" -- return the full queryset unchanged.
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
        return self.get_queryset().with_computed_status()

    def filter_by_status(self, status: BedStatusChoices) -> BedQuerySet:
        return cast(BedQuerySet, self.get_queryset().filter_by_status(status))

    def filter_by_statuses(self, statuses: Iterable[BedStatusChoices]) -> BedQuerySet:
        return cast(BedQuerySet, self.get_queryset().filter_by_statuses(statuses))


class RoomManager(Manager["Room"]):
    def get_queryset(self) -> RoomQuerySet:
        return RoomQuerySet(self.model, using=self._db)

    def with_computed_status(self) -> RoomQuerySet:
        return self.get_queryset().with_computed_status()

    def filter_by_status(self, status: RoomStatusChoices) -> RoomQuerySet:
        return cast(RoomQuerySet, self.get_queryset().filter_by_status(status))

    def filter_by_statuses(self, statuses: Iterable[RoomStatusChoices]) -> RoomQuerySet:
        return cast(RoomQuerySet, self.get_queryset().filter_by_statuses(statuses))
