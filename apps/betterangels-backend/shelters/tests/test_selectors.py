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

ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]


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
