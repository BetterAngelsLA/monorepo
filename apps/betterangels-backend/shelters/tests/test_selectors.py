import datetime
from zoneinfo import ZoneInfo

from django.test import TestCase
from model_bakery import baker

# isort: split
from shelters.enums import ReservationStatusChoices
from shelters.models import (
    Bed,
    Reservation,
    Room,
    Shelter,
)
from shelters.selectors import (
    bed_status_metric,
    report_bed_status_counts,
    reservation_status_change_counts,
)
from shelters.selectors.reports import DailyBedCounts
from shelters.types.reporting import DailyBedStatusMetricsType, DailyOccupancyMetricsType

BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]
ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]
BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]


def _aware(y: int, m: int, d: int, hh: int = 12, mm: int = 0) -> datetime.datetime:
    return datetime.datetime(y, m, d, hh, mm, tzinfo=ZoneInfo("America/Los_Angeles"))


class ReservationStatusChangeCountsTestCase(TestCase):
    """Tests for ``reservation_status_change_counts``.

    The selector targets the *Reservations* metric of the shelter-occupancy
    report: counts of reservations whose status changed to OVERDUE,
    CANCELLED, CHECKED_IN, or transitioned from OVERDUE -> CHECKED_IN,
    within an inclusive date window.
    """

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        self.tz_la = ZoneInfo("America/Los_Angeles")
        self.start = datetime.datetime(2026, 1, 1, tzinfo=self.tz_la)
        self.end = datetime.datetime(2026, 2, 1, tzinfo=self.tz_la)  # exclusive: start of Feb 1

    def _dt_range(self, start_date: datetime.date, end_date: datetime.date) -> tuple:
        """LA-local ``(start_of_first, start_of_next)`` for inclusive [s, e] range."""
        start_dt = datetime.datetime(start_date.year, start_date.month, start_date.day, tzinfo=self.tz_la)
        end_exclusive = start_dt + datetime.timedelta(days=(end_date - start_date).days + 1)
        return start_dt, end_exclusive

    # -- helpers -------------------------------------------------------------

    def _make_reservation(
        self,
        statuses: list[ReservationStatusChoices],
        *,
        bed: Bed | None = None,
    ) -> Reservation:
        """Create a reservation, then apply each status in order.

        Each reservation gets its own fresh bed by default to satisfy the
        unique-active-reservation-per-bed constraint; pass an explicit
        ``bed`` to reuse one across reservations.  Every ``save`` that
        changes ``status`` fires a ``reservation.status_change`` event via
        the pghistory trigger.
        """
        bed = bed or baker.make(Bed, shelter=self.shelter, name="Test-Bed")
        reservation = Reservation.objects.create(bed=bed)
        for status in statuses:
            reservation.status = status
            reservation.save()
        return reservation

    def _set_event_dates(self, reservation: Reservation, dt: datetime.datetime) -> None:
        """Pin all of a reservation's status-change events to ``dt``."""
        ReservationEvent.objects.filter(
            pgh_obj_id=reservation.pk,
            pgh_label="reservation.status_change",
        ).update(pgh_created_at=dt)

    def _in_range(self) -> datetime.datetime:
        return _aware(2026, 1, 15)

    # -- tests ---------------------------------------------------------------

    def test_counts_each_transition_type(self) -> None:
        """One reservation per status produces a count of 1 in each bucket."""
        overdue = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        cancelled = self._make_reservation([ReservationStatusChoices.CANCELLED])
        checked_in = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        for r in (overdue, cancelled, checked_in):
            self._set_event_dates(r, self._in_range())

        with self.assertNumQueries(1):
            result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.check_in_overdue, 1)
        self.assertEqual(result.cancelled, 1)
        self.assertEqual(result.checked_in, 1)

    def test_overdue_to_checked_in_transition(self) -> None:
        """A check_in_overdue -> checked_in transition is counted via pgh_diff."""
        reservation = self._make_reservation(
            [ReservationStatusChoices.CHECK_IN_OVERDUE, ReservationStatusChoices.CHECKED_IN],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.check_in_overdue_to_checked_in, 1)
        # The same reservation also landed on checked_in, counted once there too.
        self.assertEqual(result.checked_in, 1)

    def test_each_reservation_counted_once_per_status(self) -> None:
        """Two transitions to checked_in on one reservation count as one (distinct)."""
        reservation = self._make_reservation(
            [
                ReservationStatusChoices.CHECKED_IN,
                ReservationStatusChoices.CANCELLED,
                ReservationStatusChoices.CHECKED_IN,
            ],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.checked_in, 1)

    def test_events_on_end_date_are_included(self) -> None:
        """An event late on the end_date (which is inclusive) is counted."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(reservation, _aware(2026, 1, 31, 23, 0))

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.checked_in, 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start_date or after end_date are not counted."""
        before = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(before, _aware(2025, 12, 31, 23, 0))
        # 2026-02-01 12:00 UTC is 2026-02-01 04:00 in LA, i.e. after the Jan-31
        # end date once the range is interpreted LA-local.
        self._set_event_dates(after, _aware(2026, 2, 1, 12, 0))

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.checked_in, 0)

    def test_other_shelter_events_excluded(self) -> None:
        """Events belonging to a different shelter are not counted."""
        other_bed = baker.make(Bed, shelter=self.other_shelter, name="Other-Bed")
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=other_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.checked_in, 0)

    def test_room_only_reservation_is_counted(self) -> None:
        """A reservation attached to a room (no bed) is picked up via the room FK path."""
        room = baker.make(Room, shelter=self.shelter, name="Test-Room")
        reservation = Reservation.objects.create(room=room)
        reservation.status = ReservationStatusChoices.CHECKED_IN
        reservation.save()
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.checked_in, 1)

    def test_raises_when_end_date_before_start_date(self) -> None:
        """An end_date before start_date is a programmer error."""
        with self.assertRaises(ValueError):
            reservation_status_change_counts(shelter=self.shelter, start=self.end, end=self.start)

    def test_no_events_returns_zero_counts(self) -> None:
        """A shelter with no status changes returns zero in every bucket."""
        result = reservation_status_change_counts(shelter=self.shelter, start=self.start, end=self.end)

        self.assertEqual(result.check_in_overdue, 0)
        self.assertEqual(result.cancelled, 0)
        self.assertEqual(result.checked_in, 0)
        self.assertEqual(result.check_in_overdue_to_checked_in, 0)

    def test_counts_across_date_range(self) -> None:
        """Counts are aggregated across the whole date range."""
        checked_in = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        cancelled = self._make_reservation([ReservationStatusChoices.CANCELLED])
        self._set_event_dates(checked_in, _aware(2026, 1, 1))
        self._set_event_dates(cancelled, _aware(2026, 1, 2))

        s, e = self._dt_range(datetime.date(2026, 1, 1), datetime.date(2026, 1, 2))
        result = reservation_status_change_counts(shelter=self.shelter, start=s, end=e)

        self.assertEqual(result.checked_in, 1)
        self.assertEqual(result.cancelled, 1)

    def test_counts_support_one_day_range(self) -> None:
        """A range where start_date == end_date includes that day."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        self._set_event_dates(reservation, _aware(2026, 1, 15, 23, 0))

        s, e = self._dt_range(datetime.date(2026, 1, 15), datetime.date(2026, 1, 15))
        result = reservation_status_change_counts(shelter=self.shelter, start=s, end=e)

        self.assertEqual(result.check_in_overdue, 1)

    def test_supports_one_year_range(self) -> None:
        """The selector supports year-long date ranges (SDB acceptance criterion)."""
        in_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        before_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(in_window, _aware(2025, 6, 15))
        self._set_event_dates(before_window, _aware(2024, 12, 31))

        s, e = self._dt_range(datetime.date(2025, 1, 1), datetime.date(2025, 12, 31))
        result = reservation_status_change_counts(shelter=self.shelter, start=s, end=e)

        self.assertEqual(result.checked_in, 1)


class DailyOccupancyTestCase(TestCase):
    """Tests for ``daily_occupancy``.

    Occupancy is reconstructed from the reservation event stream, so fixtures
    create reservations, drive them through statuses (each ``save`` fires a
    ``reservation.status_change`` event) and pin every event's ``pgh_created_at``.
    Bed existence is reconstructed from ``bed.add`` / ``bed.remove``, so those are
    pinned too.
    """

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        # Beds exist from well before every test range.
        self.bed_added_at = _aware(2025, 12, 1)

    # -- fixture helpers -----------------------------------------------------

    def _make_bed(self, *, shelter: Shelter | None = None, name: str = "Bed") -> Bed:
        bed: Bed = baker.make(Bed, shelter=shelter or self.shelter, name=name)
        BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").update(pgh_created_at=self.bed_added_at)
        return bed

    def _remove_bed(self, bed: Bed, *, at: datetime.datetime) -> None:
        bed_pk = bed.pk
        bed.delete()
        BedEvent.objects.filter(pgh_obj_id=bed_pk, pgh_label="bed.remove").update(pgh_created_at=at)

    def _stay(
        self,
        bed: Bed,
        *,
        events: list[tuple[ReservationStatusChoices, datetime.datetime]],
        created_as: ReservationStatusChoices | None = None,
        created_at: datetime.datetime | None = None,
    ) -> Reservation:
        """Create a reservation on ``bed`` and pin its event timeline.

        ``events`` is an ordered list of ``(status, when)`` transitions, each
        status unique within the reservation. The ``reservation.add`` event is
        pinned just before the first transition so ordering is consistent. Pass
        ``created_as`` to create the reservation directly in that status (no
        status_change, mirroring bulk/admin creation) pinned to ``created_at``.
        """
        if created_as is not None:
            reservation = Reservation.objects.create(bed=bed, status=created_as)
            ReservationEvent.objects.filter(pgh_obj_id=reservation.pk, pgh_label="reservation.add").update(
                pgh_created_at=created_at
            )
            return reservation

        assert events, "events must not be empty when created_as is None"

        reservation = Reservation.objects.create(bed=bed)
        for status, _when in events:
            reservation.status = status
            reservation.save()

        first_when = events[0][1]
        ReservationEvent.objects.filter(pgh_obj_id=reservation.pk, pgh_label="reservation.add").update(
            pgh_created_at=first_when - datetime.timedelta(seconds=1)
        )
        for status, when in events:
            ReservationEvent.objects.filter(
                pgh_obj_id=reservation.pk, pgh_label="reservation.status_change", status=status
            ).update(pgh_created_at=when)
        return reservation

    def _occupancy(self, start: datetime.datetime, end: datetime.datetime) -> dict[str, DailyOccupancyMetricsType]:
        from shelters.selectors import daily_occupancy

        rows = daily_occupancy(shelter=self.shelter, start=start, end=end)
        return {row.date.isoformat(): row for row in rows}

    @staticmethod
    def _utc(year: int, month: int, day: int, hour: int = 12) -> datetime.datetime:
        return _aware(year, month, day, hour)

    tz_la = ZoneInfo("America/Los_Angeles")

    def _dt_la(self, year: int, month: int, day: int) -> datetime.datetime:
        """LA-local midnight as a timezone-aware datetime."""
        return datetime.datetime(year, month, day, tzinfo=self.tz_la)

    def _dt_range(self, start_year: int, start_month: int, start_day: int, end_day: int) -> tuple:
        """Return LA-local ``(start, exclusive_end)`` for a month-constant range."""
        return (
            self._dt_la(start_year, start_month, start_day),
            self._dt_la(start_year, start_month, end_day + 1),
        )

    CI = ReservationStatusChoices.CHECKED_IN
    DONE = ReservationStatusChoices.COMPLETED
    CANCEL = ReservationStatusChoices.CANCELLED
    OVERDUE = ReservationStatusChoices.CHECK_IN_OVERDUE

    # -- tests ---------------------------------------------------------------

    def test_open_ended_stay_occupies_every_day(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])

        s, e = self._dt_range(2026, 1, 10, 12)
        rows = self._occupancy(s, e)

        for iso in ("2026-01-10", "2026-01-11", "2026-01-12"):
            self.assertEqual(rows[iso].occupied_count, 1)
            self.assertEqual(rows[iso].total_beds, 1)
            self.assertEqual(rows[iso].occupancy_pct, 100.0)

    def test_checkin_day_included_prior_day_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 11))])

        s, e = self._dt_range(2026, 1, 10, 12)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-10"].occupied_count, 0)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)
        self.assertEqual(rows["2026-01-12"].occupied_count, 1)

    def test_checkout_frees_bed_half_open(self) -> None:
        # COMPLETED exactly at LA-midnight starting 2026-01-12 (08:00 UTC, PST).
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.DONE, self._utc(2026, 1, 12, 8))])

        s, e = self._dt_range(2026, 1, 10, 13)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)
        self.assertEqual(rows["2026-01-12"].occupied_count, 0)
        self.assertEqual(rows["2026-01-13"].occupied_count, 0)

    def test_cancelled_after_checkin_stays_occupied_until_cancel(self) -> None:
        # A stay occupied days 10-12 then cancelled must not be erased from the
        # days it was genuinely occupied.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.CANCEL, self._utc(2026, 1, 13, 8))])

        s, e = self._dt_range(2026, 1, 10, 15)
        rows = self._occupancy(s, e)

        self.assertEqual([rows[d].occupied_count for d in sorted(rows)], [1, 1, 1, 0, 0, 0])

    def test_never_checked_in_never_occupied(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.OVERDUE, self._utc(2026, 1, 11))])

        s, e = self._dt_range(2026, 1, 10, 12)
        rows = self._occupancy(s, e)

        for row in rows.values():
            self.assertEqual(row.occupied_count, 0)
            self.assertEqual(row.total_beds, 1)

    def test_checked_in_then_overdue_frees_bed(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.OVERDUE, self._utc(2026, 1, 12, 8))])

        s, e = self._dt_range(2026, 1, 10, 13)
        rows = self._occupancy(s, e)

        self.assertEqual([rows[d].occupied_count for d in sorted(rows)], [1, 1, 0, 0])

    def test_created_directly_as_checked_in_is_counted(self) -> None:
        # No status_change event, mirroring bulk/admin creation that leaves
        # checked_in_at null. The reservation.add snapshot opens the interval.
        bed = self._make_bed()
        self._stay(bed, events=[], created_as=self.CI, created_at=self._utc(2026, 1, 10))

        s, e = self._dt_range(2026, 1, 10, 11)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)

    def test_total_beds_reflects_add_and_remove(self) -> None:
        self._make_bed(name="A")
        bed_b = self._make_bed(name="B")
        self._remove_bed(bed_b, at=self._utc(2026, 1, 13, 8))

        s, e = self._dt_range(2026, 1, 11, 14)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-11"].total_beds, 2)
        self.assertEqual(rows["2026-01-12"].total_beds, 2)
        self.assertEqual(rows["2026-01-13"].total_beds, 1)
        self.assertEqual(rows["2026-01-14"].total_beds, 1)

    def test_removed_bed_occupancy_retained_for_days_it_existed(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])
        self._remove_bed(bed, at=self._utc(2026, 1, 13, 8))

        s, e = self._dt_range(2026, 1, 10, 14)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-11"].occupied_count, 1)
        self.assertEqual(rows["2026-01-12"].occupied_count, 1)
        self.assertEqual(rows["2026-01-13"].total_beds, 0)
        for row in rows.values():
            self.assertLessEqual(row.occupied_count, row.total_beds)
            self.assertLessEqual(row.occupancy_pct, 100.0)

    def test_occupancy_pct_rounds_to_two_places(self) -> None:
        occupied_bed = self._make_bed(name="A")
        self._make_bed(name="B")
        self._make_bed(name="C")
        self._stay(occupied_bed, events=[(self.CI, self._utc(2026, 1, 5))])

        s, e = self._dt_range(2026, 1, 10, 10)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-10"].total_beds, 3)
        self.assertEqual(rows["2026-01-10"].occupancy_pct, 33.33)

    def test_no_beds_returns_zero_rows(self) -> None:
        s, e = self._dt_range(2026, 1, 10, 11)
        rows = self._occupancy(s, e)

        for row in rows.values():
            self.assertEqual(row.occupied_count, 0)
            self.assertEqual(row.total_beds, 0)
            self.assertEqual(row.occupancy_pct, 0.0)

    def test_other_shelter_reservations_excluded(self) -> None:
        other_bed = self._make_bed(shelter=self.other_shelter, name="Other")
        self._stay(other_bed, events=[(self.CI, self._utc(2026, 1, 5))])
        self._make_bed(name="Mine")

        s, e = self._dt_range(2026, 1, 10, 10)
        rows = self._occupancy(s, e)

        self.assertEqual(rows["2026-01-10"].total_beds, 1)
        self.assertEqual(rows["2026-01-10"].occupied_count, 0)

    def test_raises_when_end_before_start(self) -> None:
        with self.assertRaises(ValueError):
            self._occupancy(self._dt_la(2026, 1, 12), self._dt_la(2026, 1, 10))

    def test_rows_are_chronological_dates(self) -> None:
        self._make_bed()

        s, e = self._dt_range(2026, 1, 10, 13)
        rows = self._occupancy(s, e)

        self.assertEqual(list(rows), ["2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13"])


class AvgDaysToOccupancyTestCase(TestCase):
    """Tests for ``avg_days_to_occupancy``.

    Vacancy gaps are reconstructed from the reservation event stream, so fixtures
    create reservations, drive them through statuses and pin each event's
    ``pgh_created_at``. Beds are pinned via ``bed.add`` so they fall in scope.
    """

    CI = ReservationStatusChoices.CHECKED_IN
    DONE = ReservationStatusChoices.COMPLETED
    CANCEL = ReservationStatusChoices.CANCELLED

    tz_la = ZoneInfo("America/Los_Angeles")

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        self.bed_added_at = _aware(2025, 11, 1)

    # -- fixture helpers -----------------------------------------------------

    def _dt_la(self, year: int, month: int, day: int) -> datetime.datetime:
        """LA-local midnight as a timezone-aware datetime."""
        return datetime.datetime.combine(datetime.date(year, month, day), datetime.time.min, tzinfo=self.tz_la)

    def _make_bed(self, *, shelter: Shelter | None = None, name: str = "Bed") -> Bed:
        bed: Bed = baker.make(Bed, shelter=shelter or self.shelter, name=name)
        BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").update(pgh_created_at=self.bed_added_at)
        return bed

    def _stay(self, bed: Bed, *, events: list[tuple[ReservationStatusChoices, datetime.datetime]]) -> Reservation:
        """Create a reservation on ``bed`` and pin its event timeline.

        Each listed status must be unique within the reservation, and the
        reservation must not be left active while a later stay on the same bed is
        created (unique-active-reservation-per-bed).
        """
        assert events, "events must not be empty"

        reservation = Reservation.objects.create(bed=bed)
        for status, _when in events:
            reservation.status = status
            reservation.save()

        first_when = events[0][1]
        ReservationEvent.objects.filter(pgh_obj_id=reservation.pk, pgh_label="reservation.add").update(
            pgh_created_at=first_when - datetime.timedelta(seconds=1)
        )
        for status, when in events:
            ReservationEvent.objects.filter(
                pgh_obj_id=reservation.pk, pgh_label="reservation.status_change", status=status
            ).update(pgh_created_at=when)
        return reservation

    def _avg(self, start: datetime.datetime, end: datetime.datetime) -> float | None:
        from shelters.selectors import avg_days_to_occupancy

        return avg_days_to_occupancy(shelter=self.shelter, start=start, end=end)

    @staticmethod
    def _utc(year: int, month: int, day: int, hour: int = 12) -> datetime.datetime:
        return _aware(year, month, day, hour)

    # -- tests ---------------------------------------------------------------

    def test_single_gap(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 3.0)

    def test_multiple_gaps_averaged(self) -> None:
        bed_a = self._make_bed(name="A")
        self._stay(bed_a, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 5))])
        self._stay(bed_a, events=[(self.CI, self._utc(2026, 1, 7))])  # gap 2

        bed_b = self._make_bed(name="B")
        self._stay(bed_b, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 5))])
        self._stay(bed_b, events=[(self.CI, self._utc(2026, 1, 9))])  # gap 4

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 3.0)

    def test_fractional_gap_rounds(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10, 0))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10, 12))])  # 12h gap

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 0.5)

    def test_occupied_from_creation_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])

        self.assertIsNone(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)))

    def test_prior_vacancy_before_range_is_measured(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2025, 12, 15)), (self.DONE, self._utc(2025, 12, 20))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])  # gap 16 days, spans range start

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 16.0)

    def test_cancellation_opens_vacancy(self) -> None:
        # A stay ended by CANCELLED still frees the bed, so the next check-in has
        # a measurable gap.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.CANCEL, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 3.0)

    def test_cancelled_occupancy_not_absorbed(self) -> None:
        # The gap anchors to the most recent free (a cancellation), not an older
        # completed checkout.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 2))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 3)), (self.CANCEL, self._utc(2026, 1, 5))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8))])

        # Range covers only the third check-in: gap is 2026-01-08 - 2026-01-05.
        self.assertEqual(self._avg(self._dt_la(2026, 1, 7), self._dt_la(2026, 1, 10)), 3.0)

    def test_same_reservation_revert_skipped(self) -> None:
        bed = self._make_bed()
        reservation = Reservation.objects.create(bed=bed)
        for status, _when in [
            (self.CI, self._utc(2026, 1, 8)),
            (self.DONE, self._utc(2026, 1, 10)),
            (self.CI, self._utc(2026, 1, 13)),
        ]:
            reservation.status = status
            reservation.save()
        ReservationEvent.objects.filter(pgh_obj_id=reservation.pk, pgh_label="reservation.add").update(
            pgh_created_at=self._utc(2026, 1, 8) - datetime.timedelta(seconds=1)
        )
        checkins = list(
            ReservationEvent.objects.filter(
                pgh_obj_id=reservation.pk, pgh_label="reservation.status_change", status=self.CI
            ).order_by("pgh_id")
        )
        checkins[0].pgh_created_at = self._utc(2026, 1, 8)
        checkins[0].save(update_fields=["pgh_created_at"])
        checkins[1].pgh_created_at = self._utc(2026, 1, 13)
        checkins[1].save(update_fields=["pgh_created_at"])
        ReservationEvent.objects.filter(
            pgh_obj_id=reservation.pk, pgh_label="reservation.status_change", status=self.DONE
        ).update(pgh_created_at=self._utc(2026, 1, 10))

        self.assertIsNone(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)))

    def test_no_events_returns_none(self) -> None:
        self._make_bed()
        self.assertIsNone(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)))

    def test_other_shelter_excluded(self) -> None:
        bed = self._make_bed(shelter=self.other_shelter, name="Other")
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertIsNone(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)))

    def test_checkin_outside_range_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 2, 13))])  # after range

        self.assertIsNone(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)))

    def test_raises_when_end_before_start(self) -> None:
        with self.assertRaises(ValueError):
            self._avg(self._dt_la(2026, 1, 12), self._dt_la(2026, 1, 10))

    def test_checkin_at_range_start_boundary(self) -> None:
        """A check-in at the very start of the LA-local range is included."""
        bed = self._make_bed()
        # Stay 1: Jan 1–2 (noon UTC = ~4am LA, well inside LA day)
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 2))])
        # Stay 2: noon UTC Jan 5. LA Jan 5 00:00 = UTC 08:00, so noon UTC is
        # well within the LA day. We narrow the range to [Jan 5, Jan 5] — the
        # check-in at noon UTC falls in this single-day window.
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])

        result = self._avg(self._dt_la(2026, 1, 5), self._dt_la(2026, 1, 6))
        self.assertIsNotNone(result, "check-in at noon UTC within single LA day should contribute")

    def test_checkin_before_range_start_excluded(self) -> None:
        """A check-in whose UTC time falls before the LA-local range start is excluded."""
        bed = self._make_bed()
        # Stay 1: before range
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 3))])
        # Stay 2: check-in at Jan 4 00:00 UTC. LA Jan 5 starts at UTC 08:00
        # (PST), so this check-in is on LA Jan 4 — outside [Jan 5, Jan 31].
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 4, 0))])

        self.assertIsNone(self._avg(self._dt_la(2026, 1, 5), self._dt_la(2026, 2, 1)))

    def test_mixed_in_range_single_bed(self) -> None:
        """Only gaps whose check-in falls in-range contribute; others are ignored."""
        bed = self._make_bed()
        # Interval 1: before range, gap of 2 days to interval 2
        self._stay(bed, events=[(self.CI, self._utc(2025, 12, 28)), (self.DONE, self._utc(2025, 12, 30))])
        # Interval 2: check-in Jan 5 (in range), gap from Dec 30 = 6 days
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5)), (self.DONE, self._utc(2026, 1, 7))])
        # Interval 3: check-in Feb 5 (outside range), ignored
        self._stay(bed, events=[(self.CI, self._utc(2026, 2, 5))])

        # Range only covers interval 2's check-in → one gap of 6 days.
        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 6.0)

    def test_zero_gap(self) -> None:
        """A checkout and check-in at the same instant produce a zero-day gap."""
        bed = self._make_bed()
        same_moment = self._utc(2026, 1, 10, 12)
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, same_moment)])
        self._stay(bed, events=[(self.CI, same_moment)])

        self.assertEqual(self._avg(self._dt_la(2026, 1, 1), self._dt_la(2026, 2, 1)), 0.0)


class BedStatusCountsTestCase(TestCase):
    """Tests for ``report_bed_status_counts``.

    Status follows the priority chain:
    OUT_OF_SERVICE → OCCUPIED → RESERVED → IN_TURNAROUND → AVAILABLE

    Beds, reservations, maintenance_flag, and last_cleaned are all set up via
    pinned event timestamps so the selector can reconstruct historical state.
    """

    CI = ReservationStatusChoices.CHECKED_IN
    DONE = ReservationStatusChoices.COMPLETED
    CANCEL = ReservationStatusChoices.CANCELLED
    OVERDUE = ReservationStatusChoices.CHECK_IN_OVERDUE
    CONFIRMED = ReservationStatusChoices.CONFIRMED

    tz_la = ZoneInfo("America/Los_Angeles")

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")

    # -- fixture helpers -----------------------------------------------------

    def _dt_la(self, year: int, month: int, day: int) -> datetime.datetime:
        """LA-local midnight as a timezone-aware datetime."""
        return datetime.datetime(year, month, day, tzinfo=self.tz_la)

    def _make_bed(
        self,
        *,
        shelter: Shelter | None = None,
        name: str = "Bed",
        added_at: datetime.datetime | None = None,
    ) -> Bed:
        """Create a bed and optionally pin its ``bed.add`` event timestamp."""
        bed: Bed = baker.make(Bed, shelter=shelter or self.shelter, name=name)
        if added_at is not None:
            BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").update(pgh_created_at=added_at)
        return bed

    def _set_maintenance(self, bed: Bed, flag: bool, *, at: datetime.datetime) -> None:
        """Set *maintenance_flag* and pin the resulting ``bed.update`` event."""
        bed.maintenance_flag = flag
        bed.save()
        evt = BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.update", maintenance_flag=flag).latest(
            "pgh_created_at"
        )
        evt.pgh_created_at = at
        evt.save(update_fields=["pgh_created_at"])

    def _set_last_cleaned(self, bed: Bed, dt: datetime.datetime | None, *, at: datetime.datetime) -> None:
        """Set *last_cleaned* and pin the resulting ``bed.update`` event."""
        bed.last_cleaned = dt
        bed.save()
        evt = BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.update").latest("pgh_created_at")
        evt.pgh_created_at = at
        evt.save(update_fields=["pgh_created_at"])

    def _stay(
        self,
        bed: Bed,
        *,
        events: list[tuple[ReservationStatusChoices, datetime.datetime]],
    ) -> Reservation:
        """Create a reservation on *bed* and pin its event timeline.

        Each listed status must be unique within the reservation.
        """
        assert events, "events must not be empty"

        reservation = Reservation.objects.create(bed=bed)
        for status, _when in events:
            reservation.status = status
            reservation.save()

        first_when = events[0][1]
        ReservationEvent.objects.filter(pgh_obj_id=reservation.pk, pgh_label="reservation.add").update(
            pgh_created_at=first_when - datetime.timedelta(seconds=1)
        )
        for status, when in events:
            ReservationEvent.objects.filter(
                pgh_obj_id=reservation.pk, pgh_label="reservation.status_change", status=status
            ).update(pgh_created_at=when)
        return reservation

    def _counts(self, start: datetime.datetime, end: datetime.datetime) -> dict[datetime.date, DailyBedCounts]:
        rows = report_bed_status_counts(shelter=self.shelter, start=start, end=end)
        return {r.date: r for r in rows}

    @staticmethod
    def _utc(year: int, month: int, day: int, hour: int = 12) -> datetime.datetime:
        return _aware(year, month, day, hour)

    # -- tests ---------------------------------------------------------------

    def test_empty_shelter_all_zero(self) -> None:
        """A shelter with no beds returns zero counts for every day."""
        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        for day_data in counts.values():
            self.assertEqual(day_data.available, 0)
            self.assertEqual(day_data.occupied, 0)
            self.assertEqual(day_data.reserved, 0)
            self.assertEqual(day_data.out_of_service, 0)
            self.assertEqual(day_data.in_turnaround, 0)

    def test_single_bed_available(self) -> None:
        """A bed with no reservations is AVAILABLE every day."""
        self._make_bed(added_at=self._utc(2025, 12, 1))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        for day_data in counts.values():
            self.assertEqual(day_data.available, 1)
            self.assertEqual(day_data.occupied, 0)
            self.assertEqual(day_data.reserved, 0)

    def test_single_bed_occupied(self) -> None:
        """A bed with an open-ended CHECKED_IN stay is OCCUPIED."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        for day_data in counts.values():
            self.assertEqual(day_data.occupied, 1)
            self.assertEqual(day_data.available, 0)

    def test_checkin_day_included_prior_day_excluded(self) -> None:
        """The check-in day is counted as occupied; prior day is available."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 11))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].occupied, 1)

    def test_checkout_frees_bed(self) -> None:
        """After checkout, the bed returns to AVAILABLE."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.DONE, self._utc(2026, 1, 12, 8))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].available, 1)

    def test_out_of_service_overrides_occupied(self) -> None:
        """OUT_OF_SERVICE beats OCCUPIED in the priority chain."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])
        self._set_maintenance(bed, True, at=self._utc(2026, 1, 11))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].out_of_service, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].occupied, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].out_of_service, 1)

    def test_out_of_service_cleared_returns_to_occupied(self) -> None:
        """When maintenance_flag is unset, OCCUPIED resumes."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])
        self._set_maintenance(bed, True, at=self._utc(2026, 1, 11))
        self._set_maintenance(bed, False, at=self._utc(2026, 1, 12))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].out_of_service, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].occupied, 1)

    def test_reserved_before_checkin(self) -> None:
        """A bed is RESERVED when a CONFIRMED reservation exists before check-in."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CONFIRMED, self._utc(2026, 1, 10)), (self.CI, self._utc(2026, 1, 12))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].reserved, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].occupied, 1)

    def test_occupied_beats_reserved(self) -> None:
        """OCCUPIED takes priority over RESERVED.

        When a reservation transitions from CONFIRMED to CHECKED_IN, the bed
        moves from RESERVED to OCCUPIED at the moment of check-in.  At
        end-of-day on the check-in date the bed is OCCUPIED, not RESERVED.
        """
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CONFIRMED, self._utc(2026, 1, 10)), (self.CI, self._utc(2026, 1, 11))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].reserved, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].occupied, 1)

    def test_cancelled_reservation_frees_bed(self) -> None:
        """Cancelling a RESERVED reservation returns the bed to AVAILABLE."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.CONFIRMED, self._utc(2026, 1, 10)), (self.CANCEL, self._utc(2026, 1, 12))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].available, 1)

    def test_multiple_beds_mixed_statuses(self) -> None:
        """Three beds: one occupied, one available, one out of service."""
        bed_a = self._make_bed(name="A", added_at=self._utc(2025, 12, 1))
        self._stay(bed_a, events=[(self.CI, self._utc(2026, 1, 5))])

        self._make_bed(name="B", added_at=self._utc(2025, 12, 1))

        bed_c = self._make_bed(name="C", added_at=self._utc(2025, 12, 1))
        self._set_maintenance(bed_c, True, at=self._utc(2026, 1, 1))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 11))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].out_of_service, 1)
        total = (
            counts[datetime.date(2026, 1, 10)].available
            + counts[datetime.date(2026, 1, 10)].occupied
            + counts[datetime.date(2026, 1, 10)].reserved
            + counts[datetime.date(2026, 1, 10)].out_of_service
            + counts[datetime.date(2026, 1, 10)].in_turnaround
        )
        self.assertEqual(total, 3)

    def test_in_turnaround_after_checkout(self) -> None:
        """A bed with a COMPLETED checkout after last_cleaned is IN_TURNAROUND."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        # Set last_cleaned to Jan 8.
        self._set_last_cleaned(bed, self._utc(2026, 1, 8, 0), at=self._utc(2026, 1, 8, 0))
        # Create a completed stay: checked in Jan 9, checked out Jan 11.
        self._stay(
            bed,
            events=[(self.CI, self._utc(2026, 1, 9)), (self.DONE, self._utc(2026, 1, 11))],
        )
        # Pin the checked_out_at on the COMPLETED status_change event.
        ReservationEvent.objects.filter(
            pgh_obj_id__in=Reservation.objects.filter(bed=bed).values_list("pk", flat=True),
            pgh_label="reservation.status_change",
            status=self.DONE,
        ).update(checked_out_at=self._utc(2026, 1, 11))

        counts = self._counts(self._dt_la(2026, 1, 9), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 9)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].in_turnaround, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].in_turnaround, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].in_turnaround, 1)

    def test_in_turnaround_never_cleaned(self) -> None:
        """A bed with a completed checkout but no last_cleaned is still IN_TURNAROUND."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        # Create a completed stay without ever setting last_cleaned.
        self._stay(
            bed,
            events=[(self.CI, self._utc(2026, 1, 9)), (self.DONE, self._utc(2026, 1, 11))],
        )
        ReservationEvent.objects.filter(
            pgh_obj_id__in=Reservation.objects.filter(bed=bed).values_list("pk", flat=True),
            pgh_label="reservation.status_change",
            status=self.DONE,
        ).update(checked_out_at=self._utc(2026, 1, 11))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].occupied, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].in_turnaround, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].in_turnaround, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].in_turnaround, 1)

    def test_in_turnaround_cleared_by_last_cleaned(self) -> None:
        """Setting last_cleaned after the checkout clears IN_TURNAROUND."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._set_last_cleaned(bed, self._utc(2026, 1, 8, 0), at=self._utc(2026, 1, 8, 0))
        self._stay(
            bed,
            events=[(self.CI, self._utc(2026, 1, 9)), (self.DONE, self._utc(2026, 1, 11))],
        )
        ReservationEvent.objects.filter(
            pgh_obj_id__in=Reservation.objects.filter(bed=bed).values_list("pk", flat=True),
            pgh_label="reservation.status_change",
            status=self.DONE,
        ).update(checked_out_at=self._utc(2026, 1, 11))
        # Clean the bed after checkout on Jan 12 — clears turnaround.
        self._set_last_cleaned(bed, self._utc(2026, 1, 12, 0), at=self._utc(2026, 1, 12, 0))

        counts = self._counts(self._dt_la(2026, 1, 11), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 11)].in_turnaround, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].available, 1)

    def test_no_bed_added_yet_zero_counts(self) -> None:
        """A bed added after the range start appears only from its first day."""
        self._make_bed(added_at=self._utc(2026, 1, 12))

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 14))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].available, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].available, 0)
        self.assertEqual(counts[datetime.date(2026, 1, 12)].available, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 13)].available, 1)

    def test_raises_when_end_before_start(self) -> None:
        with self.assertRaises(ValueError):
            self._counts(self._dt_la(2026, 1, 12), self._dt_la(2026, 1, 10))

    def test_dates_in_chronological_order(self) -> None:
        self._make_bed(added_at=self._utc(2025, 12, 1))
        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 13))
        self.assertEqual(
            list(counts), [datetime.date(2026, 1, 10), datetime.date(2026, 1, 11), datetime.date(2026, 1, 12)]
        )

    def test_overdue_is_reserved(self) -> None:
        """CHECK_IN_OVERDUE is treated as RESERVED (not OCCUPIED)."""
        bed = self._make_bed(added_at=self._utc(2025, 12, 1))
        self._stay(bed, events=[(self.OVERDUE, self._utc(2026, 1, 10))])

        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 12))
        self.assertEqual(counts[datetime.date(2026, 1, 10)].reserved, 1)
        self.assertEqual(counts[datetime.date(2026, 1, 11)].reserved, 1)

    def test_other_shelter_excluded(self) -> None:
        """Beds and reservations from other shelters are not counted."""
        other_bed = self._make_bed(shelter=self.other_shelter, name="Other", added_at=self._utc(2025, 12, 1))
        self._stay(other_bed, events=[(self.CI, self._utc(2026, 1, 10))])

# Our shelter has no beds.
        counts = self._counts(self._dt_la(2026, 1, 10), self._dt_la(2026, 1, 12))
        for day_data in counts.values():
            self.assertEqual(day_data.occupied, 0)
            self.assertEqual(day_data.available, 0)


class BedStatusMetricTestCase(TestCase):
    """Tests for ``bed_status_metric``.

    Each test builds a precise event history by:
    1. Creating beds / reservations (which fires pghistory events with ``now()``).
    2. Back-dating specific events via ``.update(pgh_created_at=...)``.

    The selector uses end-of-day LA-local snapshots (via the caller's timezone),
    so test event timestamps are set well within any day to avoid LA/UTC boundary effects.
    """

    tz_la = ZoneInfo("America/Los_Angeles")

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        self.start = datetime.datetime(2026, 1, 1, tzinfo=self.tz_la)
        self.end = datetime.datetime(2026, 2, 1, tzinfo=self.tz_la)  # exclusive

    # ── helpers ──────────────────────────────────────────────────────────────

    def _dt_la(self, year: int, month: int, day: int) -> datetime.datetime:
        """LA-local midnight as a timezone-aware datetime."""
        return datetime.datetime(year, month, day, tzinfo=self.tz_la)

    def _make_bed(self, *, shelter: Shelter | None = None, name: str = "Bed") -> Bed:
        """Create a bed and return it (fires a ``bed.add`` event)."""
        return Bed.objects.create(shelter=shelter or self.shelter, name=name)

    def _set_bed_add_event_dt(self, bed: Bed, dt: datetime.datetime) -> None:
        """Pin the ``bed.add`` event for *bed* to *dt*."""
        BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.add").update(pgh_created_at=dt)

    def _set_maintenance(self, bed: Bed, flag: bool) -> None:
        """Toggle *bed* maintenance_flag, which fires a ``bed.maintenance_flag_change`` event."""
        bed.maintenance_flag = flag
        bed.save()

    def _set_maintenance_event_dt(self, bed: Bed, dt: datetime.datetime) -> None:
        """Pin all ``bed.maintenance_flag_change`` events for *bed* to *dt*."""
        BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.maintenance_flag_change").update(pgh_created_at=dt)

    def _delete_bed(self, bed: Bed) -> int:
        """Delete *bed* (fires ``bed.remove`` event).  Returns the former pk."""
        pk = bed.pk
        bed.delete()  # sets bed.pk = None
        return pk

    def _set_bed_remove_event_dt(self, bed_pk: int, dt: datetime.datetime) -> None:
        """Pin the ``bed.remove`` event for *bed_pk* to *dt*."""
        BedEvent.objects.filter(pgh_obj_id=bed_pk, pgh_label="bed.remove").update(pgh_created_at=dt)

    def _make_reservation(
        self,
        bed: Bed,
        *,
        initial_status: ReservationStatusChoices = ReservationStatusChoices.CONFIRMED,
    ) -> Reservation:
        """Create a reservation on *bed* with *initial_status*."""
        r = Reservation.objects.create(bed=bed)
        if r.status != initial_status:
            r.status = initial_status
            r.save()
        return r

    def _transition(self, reservation: Reservation, new_status: ReservationStatusChoices) -> None:
        """Transition *reservation* to *new_status* (fires ``reservation.status_change``)."""
        reservation.status = new_status
        reservation.save()

    def _set_res_event_dt(self, reservation: Reservation, dt: datetime.datetime, *, label: str | None = None) -> None:
        """Pin reservation events to *dt*.  If *label* is given, only that label is updated."""
        qs = ReservationEvent.objects.filter(pgh_obj_id=reservation.pk)
        if label:
            qs = qs.filter(pgh_label=label)
        qs.update(pgh_created_at=dt)

    def _call(
        self,
        *,
        start: datetime.datetime | None = None,
        end: datetime.datetime | None = None,
    ) -> list[DailyBedStatusMetricsType]:
        return bed_status_metric(
            shelter=self.shelter,
            start=start or self.start,
            end=end or self.end,
        )

    # ── basic status mapping ─────────────────────────────────────────────────

    def test_available_with_no_reservation(self) -> None:
        """A bed with no reservation is counted as available."""
        bed = self._make_bed()
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].available, 1)
        self.assertEqual(result[0].occupied, 0)
        self.assertEqual(result[0].reserved, 0)
        self.assertEqual(result[0].out_of_service, 0)

    def test_confirmed_reservation_counts_as_reserved(self) -> None:
        """A bed with a CONFIRMED reservation is counted as reserved."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].reserved, 1)
        self.assertEqual(result[0].available, 0)

    def test_checked_in_reservation_counts_as_occupied(self) -> None:
        """A bed with a CHECKED_IN reservation is counted as occupied."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECKED_IN)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].occupied, 1)
        self.assertEqual(result[0].reserved, 0)

    def test_overdue_reservation_counts_as_reserved(self) -> None:
        """A bed with a CHECK_IN_OVERDUE reservation is counted as reserved."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECK_IN_OVERDUE)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].reserved, 1)

    def test_maintenance_flag_counts_as_out_of_service(self) -> None:
        """A bed with maintenance_flag=True is counted as out_of_service."""
        bed = self._make_bed()
        self._set_maintenance(bed, True)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_maintenance_event_dt(bed, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].out_of_service, 1)
        self.assertEqual(result[0].available, 0)

    def test_maintenance_flag_wins_over_active_reservation(self) -> None:
        """maintenance_flag=True takes precedence over an active reservation."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_maintenance(bed, True)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))
        self._set_maintenance_event_dt(bed, _aware(2026, 1, 1, 2))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].out_of_service, 1)
        self.assertEqual(result[0].reserved, 0)
        self.assertEqual(result[0].occupied, 0)

    def test_cancelled_reservation_returns_bed_to_available(self) -> None:
        """After a CANCELLED transition the bed reverts to available."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CANCELLED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].available, 1)
        self.assertEqual(result[0].reserved, 0)

    def test_completed_reservation_returns_bed_to_available(self) -> None:
        """After a COMPLETED transition the bed reverts to available."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECKED_IN)
        self._transition(r, ReservationStatusChoices.COMPLETED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].available, 1)
        self.assertEqual(result[0].occupied, 0)

    # ── multi-day / cumulative state ─────────────────────────────────────────

    def test_multi_day_range_has_one_entry_per_day(self) -> None:
        """The result has exactly one entry per day in the range."""
        result = self._call(
            start=self._dt_la(2026, 1, 1),
            end=self._dt_la(2026, 1, 6),
        )
        self.assertEqual(len(result), 5)
        self.assertEqual(result[0].date, datetime.date(2026, 1, 1))
        self.assertEqual(result[4].date, datetime.date(2026, 1, 5))

    def test_cumulative_state_carries_across_days(self) -> None:
        """A reservation made on day 1 is still reflected on day 2."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 10))

        result = self._call(
            start=self._dt_la(2026, 1, 1),
            end=self._dt_la(2026, 1, 4),
        )

        for entry in result:
            self.assertEqual(entry.reserved, 1, f"Failed on {entry.date}")

    def test_status_change_on_day_2_reflected_from_day_2_onwards(self) -> None:
        """A checkout on day 2 shifts the bed from occupied → available starting day 2."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECKED_IN)
        self._transition(r, ReservationStatusChoices.COMPLETED)

        # reservation.add + first status_change → day 1
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        ReservationEvent.objects.filter(
            pgh_obj_id=r.pk, pgh_label__in=["reservation.add", "reservation.status_change"]
        ).order_by("pgh_created_at").first()  # type: ignore[union-attr]
        # Set all events to day 1, then override the COMPLETED transition to day 2
        self._set_res_event_dt(r, _aware(2026, 1, 1, 6))
        # Override only the COMPLETED status_change to day 2
        ReservationEvent.objects.filter(
            pgh_obj_id=r.pk,
            pgh_label="reservation.status_change",
            status=ReservationStatusChoices.COMPLETED,
        ).update(pgh_created_at=_aware(2026, 1, 2, 10))

        result = self._call(
            start=self._dt_la(2026, 1, 1),
            end=self._dt_la(2026, 1, 4),
        )

        self.assertEqual(result[0].occupied, 1, "Day 1 should be occupied")
        self.assertEqual(result[1].available, 1, "Day 2 should be available after checkout")
        self.assertEqual(result[2].available, 1, "Day 3 should still be available")

    # ── last-update-of-day semantics ─────────────────────────────────────────

    def test_multiple_status_changes_in_one_day_uses_final_state(self) -> None:
        """If a bed goes reserved → available → reserved in one day, counts as reserved."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CANCELLED)
        # new reservation on same bed
        r2 = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)

        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 6))  # first reservation events
        self._set_res_event_dt(r2, _aware(2026, 1, 1, 8))  # second reservation events (later)

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].reserved, 1)
        self.assertEqual(result[0].available, 0)

    # ── boundary conditions ──────────────────────────────────────────────────

    def test_events_exactly_on_start_date_are_included(self) -> None:
        """An event at midnight on start_date is captured in that day's count."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 0, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].reserved, 1)

    def test_events_on_end_date_are_included(self) -> None:
        """An event late on end_date (23:59) is captured."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 31, 23, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 31, 23, 59))

        result = self._call(start=self._dt_la(2026, 1, 31), end=self._dt_la(2026, 1, 32))

        self.assertEqual(result[0].reserved, 1)

    def test_events_after_end_date_are_excluded(self) -> None:
        """Events after end_date are not reflected in any day's count."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        # Bed existed before range; reservation added after range
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 2, 1, 0))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 32))

        for entry in result:
            self.assertEqual(entry.available, 1, f"Bed should be available on {entry.date}")

    def test_initial_state_from_events_before_range(self) -> None:
        """A reservation made before start_date still shows in the range."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2025, 12, 1, 0))
        self._set_res_event_dt(r, _aware(2025, 12, 15, 0))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 4))

        for entry in result:
            self.assertEqual(entry.reserved, 1, f"Bed should be reserved on {entry.date}")

    def test_raises_when_end_date_before_start_date(self) -> None:
        """Passing end_date < start_date raises ValueError."""
        with self.assertRaisesRegex(ValueError, "end must be on or after start"):
            bed_status_metric(
                shelter=self.shelter,
                start=self._dt_la(2026, 1, 31),
                end=self._dt_la(2026, 1, 2),
            )

    def test_single_day_range(self) -> None:
        """start == end (same LA day) returns exactly one entry."""
        result = self._call(
            start=self._dt_la(2026, 1, 15),
            end=self._dt_la(2026, 1, 16),
        )
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].date, datetime.date(2026, 1, 15))

    # ── isolation ────────────────────────────────────────────────────────────

    def test_other_shelter_beds_excluded(self) -> None:
        """Beds belonging to a different shelter are never counted."""
        other_bed = Bed.objects.create(shelter=self.other_shelter, name="Other-Bed")
        r = Reservation.objects.create(bed=other_bed)
        self._set_bed_add_event_dt(other_bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].available, 0)
        self.assertEqual(result[0].reserved, 0)

    def test_room_only_reservations_excluded_from_bed_counts(self) -> None:
        """Room-only reservations (bed_id IS NULL) do not affect per-bed counts."""
        room = baker.make(Room, shelter=self.shelter, name="Test-Room")
        r = Reservation.objects.create(room=room)
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 2))

        self.assertEqual(result[0].available, 0)
        self.assertEqual(result[0].occupied, 0)
        self.assertEqual(result[0].reserved, 0)
        self.assertEqual(result[0].out_of_service, 0)

    def test_no_beds_returns_all_zeros(self) -> None:
        """A shelter with no beds returns zero in every bucket for each day."""
        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 4))

        for entry in result:
            self.assertEqual(entry.available, 0)
            self.assertEqual(entry.occupied, 0)
            self.assertEqual(entry.reserved, 0)
            self.assertEqual(entry.out_of_service, 0)

    # ── bed lifecycle ────────────────────────────────────────────────────────

    def test_bed_added_mid_range_not_counted_before_add(self) -> None:
        """A bed added on day 3 is not counted on day 1 or 2."""
        bed = self._make_bed()
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 3, 10))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 6))

        self.assertEqual(result[0].available, 0, "Day 1: bed not yet added")
        self.assertEqual(result[1].available, 0, "Day 2: bed not yet added")
        self.assertEqual(result[2].available, 1, "Day 3: bed added")
        self.assertEqual(result[3].available, 1, "Day 4: bed still there")

    def test_bed_removed_mid_range_not_counted_after_removal(self) -> None:
        """A bed removed on day 2 no longer appears in counts from day 2 onwards."""
        bed = self._make_bed()
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))

        bed_pk = self._delete_bed(bed)
        self._set_bed_remove_event_dt(bed_pk, _aware(2026, 1, 2, 12))

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 5))

        self.assertEqual(result[0].available, 1, "Day 1: bed exists")
        self.assertEqual(result[1].available, 0, "Day 2: bed removed")
        self.assertEqual(result[2].available, 0, "Day 3: bed gone")

    # ── maintenance flag ─────────────────────────────────────────────────────

    def test_maintenance_flag_toggled_on_then_off(self) -> None:
        """Turning maintenance_flag off restores the bed to available."""
        bed = self._make_bed()
        self._set_maintenance(bed, True)
        self._set_maintenance(bed, False)

        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        # First maintenance change → day 1; second → day 2
        events = list(
            BedEvent.objects.filter(pgh_obj_id=bed.pk, pgh_label="bed.maintenance_flag_change").order_by(
                "pgh_created_at"
            )
        )
        events[0].pgh_created_at = _aware(2026, 1, 1, 6)
        events[0].save(update_fields=["pgh_created_at"])
        events[1].pgh_created_at = _aware(2026, 1, 2, 6)
        events[1].save(update_fields=["pgh_created_at"])

        result = self._call(start=self._dt_la(2026, 1, 1), end=self._dt_la(2026, 1, 4))

        self.assertEqual(result[0].out_of_service, 1, "Day 1: maintenance on")
        self.assertEqual(result[1].available, 1, "Day 2: maintenance off")
        self.assertEqual(result[2].available, 1, "Day 3: still available")

    # ── long date ranges ─────────────────────────────────────────────────────

    def test_supports_one_year_range(self) -> None:
        """The selector handles year-long date ranges without error."""
        bed = self._make_bed()
        self._set_bed_add_event_dt(bed, _aware(2025, 1, 1, 0))

        result = bed_status_metric(
            shelter=self.shelter,
            start=self._dt_la(2025, 1, 1),
            end=self._dt_la(2026, 1, 1),
        )

        self.assertEqual(len(result), 365)
        self.assertTrue(all(e.available == 1 for e in result))
