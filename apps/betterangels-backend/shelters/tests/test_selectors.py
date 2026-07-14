import datetime

from django.test import TestCase
from django.utils import timezone
from model_bakery import baker

# isort: split
from shelters.enums import ReservationStatusChoices
from shelters.models import (
    Bed,
    Reservation,
    Room,
    Shelter,
)
from shelters.selectors import reservation_status_change_counts
from shelters.types.reporting import DailyOccupancyMetricsType

ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]
BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]


def _aware(y: int, m: int, d: int, hh: int = 12, mm: int = 0) -> datetime.datetime:
    return timezone.make_aware(datetime.datetime(y, m, d, hh, mm))


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
        # A typical month-long window for status-change events.
        self.start_date = datetime.date(2026, 1, 1)
        self.end_date = datetime.date(2026, 1, 31)

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
            result = reservation_status_change_counts(
                shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
            )

        self.assertEqual(result.check_in_overdue, 1)
        self.assertEqual(result.cancelled, 1)
        self.assertEqual(result.checked_in, 1)

    def test_overdue_to_checked_in_transition(self) -> None:
        """A check_in_overdue -> checked_in transition is counted via pgh_diff."""
        reservation = self._make_reservation(
            [ReservationStatusChoices.CHECK_IN_OVERDUE, ReservationStatusChoices.CHECKED_IN],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

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

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result.checked_in, 1)

    def test_events_on_end_date_are_included(self) -> None:
        """An event late on the end_date (which is inclusive) is counted."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(reservation, _aware(2026, 1, 31, 23, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result.checked_in, 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start_date or after end_date are not counted."""
        before = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(before, _aware(2025, 12, 31, 23, 0))
        # 2026-02-01 12:00 UTC is 2026-02-01 04:00 in LA, i.e. after the Jan-31
        # end date once the range is interpreted LA-local.
        self._set_event_dates(after, _aware(2026, 2, 1, 12, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result.checked_in, 0)

    def test_other_shelter_events_excluded(self) -> None:
        """Events belonging to a different shelter are not counted."""
        other_bed = baker.make(Bed, shelter=self.other_shelter, name="Other-Bed")
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=other_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result.checked_in, 0)

    def test_room_only_reservation_is_counted(self) -> None:
        """A reservation attached to a room (no bed) is picked up via the room FK path."""
        room = baker.make(Room, shelter=self.shelter, name="Test-Room")
        reservation = Reservation.objects.create(room=room)
        reservation.status = ReservationStatusChoices.CHECKED_IN
        reservation.save()
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result.checked_in, 1)

    def test_raises_when_end_date_before_start_date(self) -> None:
        """An end_date before start_date is a programmer error."""
        with self.assertRaisesRegex(ValueError, "end_date must be on or after start_date"):
            reservation_status_change_counts(shelter=self.shelter, start_date=self.end_date, end_date=self.start_date)

    def test_no_events_returns_zero_counts(self) -> None:
        """A shelter with no status changes returns zero in every bucket."""
        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

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

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 1, 2),
        )

        self.assertEqual(result.checked_in, 1)
        self.assertEqual(result.cancelled, 1)

    def test_counts_support_one_day_range(self) -> None:
        """A range where start_date == end_date includes that day."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        self._set_event_dates(reservation, _aware(2026, 1, 15, 23, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2026, 1, 15),
            end_date=datetime.date(2026, 1, 15),
        )

        self.assertEqual(result.check_in_overdue, 1)

    def test_supports_one_year_range(self) -> None:
        """The selector supports year-long date ranges (SDB acceptance criterion)."""
        in_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        before_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(in_window, _aware(2025, 6, 15))
        self._set_event_dates(before_window, _aware(2024, 12, 31))

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2025, 1, 1),
            end_date=datetime.date(2025, 12, 31),
        )

        self.assertEqual(result.checked_in, 1)


class ReportDateRangeToUtcTestCase(TestCase):
    """Tests for the shared ``report_date_range_to_utc`` helper."""

    def test_converts_inclusive_la_range_to_half_open_utc_window(self) -> None:
        from shelters.selectors.reports import report_date_range_to_utc

        start_utc, end_utc = report_date_range_to_utc(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31))

        # LA is UTC-8 (PST) in January, so LA-midnight is 08:00 UTC.
        self.assertEqual(start_utc, datetime.datetime(2026, 1, 1, 8, 0, tzinfo=datetime.timezone.utc))
        # End is the start of the day after end_date in LA (half-open).
        self.assertEqual(end_utc, datetime.datetime(2026, 2, 1, 8, 0, tzinfo=datetime.timezone.utc))

    def test_raises_when_end_before_start(self) -> None:
        from shelters.selectors.reports import report_date_range_to_utc

        with self.assertRaisesRegex(ValueError, "end_date must be on or after start_date"):
            report_date_range_to_utc(datetime.date(2026, 1, 2), datetime.date(2026, 1, 1))

    def test_allows_multi_year_past_range(self) -> None:
        from shelters.selectors.reports import report_date_range_to_utc

        # No cap on how far back a range spans; the natural limit is data.
        start_utc, end_utc = report_date_range_to_utc(datetime.date(2020, 1, 1), datetime.date(2026, 1, 1))

        self.assertLess(start_utc, end_utc)


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

    def _occupancy(self, start: datetime.date, end: datetime.date) -> dict[str, DailyOccupancyMetricsType]:
        from shelters.selectors import daily_occupancy

        rows = daily_occupancy(shelter=self.shelter, start_date=start, end_date=end)
        return {row.date.isoformat(): row for row in rows}

    @staticmethod
    def _utc(year: int, month: int, day: int, hour: int = 12) -> datetime.datetime:
        return _aware(year, month, day, hour)

    CI = ReservationStatusChoices.CHECKED_IN
    DONE = ReservationStatusChoices.COMPLETED
    CANCEL = ReservationStatusChoices.CANCELLED
    OVERDUE = ReservationStatusChoices.CHECK_IN_OVERDUE

    # -- tests ---------------------------------------------------------------

    def test_open_ended_stay_occupies_every_day(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 12))

        for iso in ("2026-01-10", "2026-01-11", "2026-01-12"):
            self.assertEqual(rows[iso].occupied_count, 1)
            self.assertEqual(rows[iso].total_beds, 1)
            self.assertEqual(rows[iso].occupancy_pct, 100.0)

    def test_checkin_day_included_prior_day_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 11))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 12))

        self.assertEqual(rows["2026-01-10"].occupied_count, 0)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)
        self.assertEqual(rows["2026-01-12"].occupied_count, 1)

    def test_checkout_frees_bed_half_open(self) -> None:
        # COMPLETED exactly at LA-midnight starting 2026-01-12 (08:00 UTC, PST).
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.DONE, self._utc(2026, 1, 12, 8))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 13))

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)
        self.assertEqual(rows["2026-01-12"].occupied_count, 0)
        self.assertEqual(rows["2026-01-13"].occupied_count, 0)

    def test_cancelled_after_checkin_stays_occupied_until_cancel(self) -> None:
        # A stay occupied days 10-12 then cancelled must not be erased from the
        # days it was genuinely occupied.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.CANCEL, self._utc(2026, 1, 13, 8))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 15))

        self.assertEqual([rows[d].occupied_count for d in sorted(rows)], [1, 1, 1, 0, 0, 0])

    def test_never_checked_in_never_occupied(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.OVERDUE, self._utc(2026, 1, 11))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 12))

        for row in rows.values():
            self.assertEqual(row.occupied_count, 0)
            self.assertEqual(row.total_beds, 1)

    def test_checked_in_then_overdue_frees_bed(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10)), (self.OVERDUE, self._utc(2026, 1, 12, 8))])

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 13))

        self.assertEqual([rows[d].occupied_count for d in sorted(rows)], [1, 1, 0, 0])

    def test_created_directly_as_checked_in_is_counted(self) -> None:
        # No status_change event, mirroring bulk/admin creation that leaves
        # checked_in_at null. The reservation.add snapshot opens the interval.
        bed = self._make_bed()
        self._stay(bed, events=[], created_as=self.CI, created_at=self._utc(2026, 1, 10))

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 11))

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-11"].occupied_count, 1)

    def test_total_beds_reflects_add_and_remove(self) -> None:
        self._make_bed(name="A")
        bed_b = self._make_bed(name="B")
        self._remove_bed(bed_b, at=self._utc(2026, 1, 13, 8))

        rows = self._occupancy(datetime.date(2026, 1, 11), datetime.date(2026, 1, 14))

        self.assertEqual(rows["2026-01-11"].total_beds, 2)
        self.assertEqual(rows["2026-01-12"].total_beds, 2)
        self.assertEqual(rows["2026-01-13"].total_beds, 1)
        self.assertEqual(rows["2026-01-14"].total_beds, 1)

    def test_removed_bed_occupancy_retained_for_days_it_existed(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])
        self._remove_bed(bed, at=self._utc(2026, 1, 13, 8))

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 14))

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

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 10))

        self.assertEqual(rows["2026-01-10"].occupied_count, 1)
        self.assertEqual(rows["2026-01-10"].total_beds, 3)
        self.assertEqual(rows["2026-01-10"].occupancy_pct, 33.33)

    def test_no_beds_returns_zero_rows(self) -> None:
        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 11))

        for row in rows.values():
            self.assertEqual(row.occupied_count, 0)
            self.assertEqual(row.total_beds, 0)
            self.assertEqual(row.occupancy_pct, 0.0)

    def test_other_shelter_reservations_excluded(self) -> None:
        other_bed = self._make_bed(shelter=self.other_shelter, name="Other")
        self._stay(other_bed, events=[(self.CI, self._utc(2026, 1, 5))])
        self._make_bed(name="Mine")

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 10))

        self.assertEqual(rows["2026-01-10"].total_beds, 1)
        self.assertEqual(rows["2026-01-10"].occupied_count, 0)

    def test_raises_when_end_before_start(self) -> None:
        with self.assertRaises(ValueError):
            self._occupancy(datetime.date(2026, 1, 12), datetime.date(2026, 1, 10))

    def test_rows_are_chronological_dates(self) -> None:
        self._make_bed()

        rows = self._occupancy(datetime.date(2026, 1, 10), datetime.date(2026, 1, 13))

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

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        self.bed_added_at = _aware(2025, 11, 1)

    # -- fixture helpers -----------------------------------------------------

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

    def _avg(self, start: datetime.date, end: datetime.date) -> float | None:
        from shelters.selectors import avg_days_to_occupancy

        return avg_days_to_occupancy(shelter=self.shelter, start_date=start, end_date=end)

    @staticmethod
    def _utc(year: int, month: int, day: int, hour: int = 12) -> datetime.datetime:
        return _aware(year, month, day, hour)

    # -- tests ---------------------------------------------------------------

    def test_single_gap(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertEqual(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)), 3.0)

    def test_multiple_gaps_averaged(self) -> None:
        bed_a = self._make_bed(name="A")
        self._stay(bed_a, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 5))])
        self._stay(bed_a, events=[(self.CI, self._utc(2026, 1, 7))])  # gap 2

        bed_b = self._make_bed(name="B")
        self._stay(bed_b, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 5))])
        self._stay(bed_b, events=[(self.CI, self._utc(2026, 1, 9))])  # gap 4

        self.assertEqual(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)), 3.0)

    def test_fractional_gap_rounds(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10, 0))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10, 12))])  # 12h gap

        self.assertEqual(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)), 0.5)

    def test_occupied_from_creation_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 10))])

        self.assertIsNone(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)))

    def test_prior_vacancy_before_range_is_measured(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2025, 12, 15)), (self.DONE, self._utc(2025, 12, 20))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 5))])  # gap 16 days, spans range start

        self.assertEqual(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)), 16.0)

    def test_cancellation_opens_vacancy(self) -> None:
        # A stay ended by CANCELLED still frees the bed, so the next check-in has
        # a measurable gap.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.CANCEL, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertEqual(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)), 3.0)

    def test_cancelled_occupancy_not_absorbed(self) -> None:
        # The gap anchors to the most recent free (a cancellation), not an older
        # completed checkout.
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 1)), (self.DONE, self._utc(2026, 1, 2))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 3)), (self.CANCEL, self._utc(2026, 1, 5))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8))])

        # Range covers only the third check-in: gap is 2026-01-08 - 2026-01-05.
        self.assertEqual(self._avg(datetime.date(2026, 1, 7), datetime.date(2026, 1, 9)), 3.0)

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

        self.assertIsNone(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)))

    def test_no_events_returns_none(self) -> None:
        self._make_bed()
        self.assertIsNone(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)))

    def test_other_shelter_excluded(self) -> None:
        bed = self._make_bed(shelter=self.other_shelter, name="Other")
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 13))])

        self.assertIsNone(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)))

    def test_checkin_outside_range_excluded(self) -> None:
        bed = self._make_bed()
        self._stay(bed, events=[(self.CI, self._utc(2026, 1, 8)), (self.DONE, self._utc(2026, 1, 10))])
        self._stay(bed, events=[(self.CI, self._utc(2026, 2, 13))])  # after range

        self.assertIsNone(self._avg(datetime.date(2026, 1, 1), datetime.date(2026, 1, 31)))

    def test_raises_when_end_before_start(self) -> None:
        with self.assertRaises(ValueError):
            self._avg(datetime.date(2026, 1, 12), datetime.date(2026, 1, 10))
