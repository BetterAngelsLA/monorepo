import datetime

from django.test import TestCase
from model_bakery import baker

# isort: split
from shelters.enums import ReservationStatusChoices
from shelters.models import (
    Bed,
    Reservation,
    Shelter,
)
from shelters.selectors import reservation_status_change_counts

ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]


class ReservationStatusChangeCountsTestCase(TestCase):
    """Tests for ``reservation_status_change_counts``."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        # An inclusive calendar-date range: Jan 1 through Feb 1, 2026.
        self.start = datetime.date(2026, 1, 1)
        self.end = datetime.date(2026, 2, 1)

    # -- helpers -------------------------------------------------------------

    def _make_reservation(self, statuses: list[ReservationStatusChoices], bed: Bed | None = None) -> Reservation:
        """Create a reservation on a fresh bed then apply each status in order.

        Each reservation gets its own bed to avoid the
        unique-active-reservation-per-bed constraint. Each ``save`` that changes
        ``status`` fires a ``reservation.status_change`` event via the pghistory
        trigger.
        """
        bed = bed or baker.make(Bed, shelter=self.shelter, name="Test-Bed")
        reservation = Reservation.objects.create(bed=bed)
        for status in statuses:
            reservation.status = status
            reservation.save()

        return reservation

    def _set_event_dates(self, reservation: Reservation, dt: datetime.datetime) -> None:
        """Pin all of a reservation's status-change events to ``dt`` (timezone-aware)."""
        ReservationEvent.objects.filter(
            pgh_obj_id=reservation.pk,
            pgh_label="reservation.status_change",
        ).update(pgh_created_at=dt)

    def _in_range(self) -> datetime.datetime:
        return datetime.datetime(2026, 1, 15, 12, 0, tzinfo=datetime.timezone.utc)

    # -- tests ---------------------------------------------------------------

    def test_counts_each_transition_type(self) -> None:
        """One reservation per status produces a count of 1 in each bucket."""
        overdue = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        cancelled = self._make_reservation([ReservationStatusChoices.CANCELLED])
        checked_in = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        for r in (overdue, cancelled, checked_in):
            self._set_event_dates(r, self._in_range())

        with self.assertNumQueries(1):
            result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)
        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_overdue_to_checked_in_transition(self) -> None:
        """A check_in_overdue -> checked_in transition is counted via pgh_diff."""
        reservation = self._make_reservation(
            [ReservationStatusChoices.CHECK_IN_OVERDUE, ReservationStatusChoices.CHECKED_IN],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_OVERDUE_TO_CHECKED_IN"], 1)
        # The same reservation also landed on checked_in, counted once there too.
        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

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

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_within_end_date_are_included(self) -> None:
        """An event late on the inclusive end date is counted."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(
            reservation,
            datetime.datetime(2026, 2, 1, 23, 0, tzinfo=datetime.timezone.utc),
        )

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start or after the inclusive end date are not counted."""
        before = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(
            before,
            datetime.datetime(2025, 12, 31, 12, 0, tzinfo=datetime.timezone.utc),
        )
        self._set_event_dates(
            after,
            datetime.datetime(2026, 2, 2, 0, 0, tzinfo=datetime.timezone.utc),
        )

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_other_shelter_events_excluded(self) -> None:
        """Events belonging to a different shelter are not counted."""
        other_bed = baker.make(Bed, shelter=self.other_shelter, name="Other-Bed")
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=other_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_returns_zero_when_end_date_before_start_date(self) -> None:
        """An end_date before start_date returns zero in every bucket."""
        result = reservation_status_change_counts(self.shelter.pk, self.end, self.start)

        self.assertEqual(
            result,
            {
                "STATUS_TO_CHECK_IN_OVERDUE": 0,
                "STATUS_TO_CANCELLED": 0,
                "STATUS_TO_CHECKED_IN": 0,
                "STATUS_OVERDUE_TO_CHECKED_IN": 0,
            },
        )

    def test_no_events_returns_zero_counts(self) -> None:
        """A shelter with no status changes returns zero in every bucket."""
        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(
            result,
            {
                "STATUS_TO_CHECK_IN_OVERDUE": 0,
                "STATUS_TO_CANCELLED": 0,
                "STATUS_TO_CHECKED_IN": 0,
                "STATUS_OVERDUE_TO_CHECKED_IN": 0,
            },
        )

    def test_counts_across_date_range(self) -> None:
        """Counts are aggregated across the whole date range."""
        checked_in = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        cancelled = self._make_reservation([ReservationStatusChoices.CANCELLED])
        self._set_event_dates(
            checked_in,
            datetime.datetime(2026, 1, 1, 12, 0, tzinfo=datetime.timezone.utc),
        )
        self._set_event_dates(
            cancelled,
            datetime.datetime(2026, 1, 2, 12, 0, tzinfo=datetime.timezone.utc),
        )

        result = reservation_status_change_counts(
            self.shelter.pk,
            datetime.date(2026, 1, 1),
            datetime.date(2026, 1, 3),
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)

    def test_counts_support_one_day_range(self) -> None:
        """A single-day range (start == end) includes events on that date."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        self._set_event_dates(
            reservation,
            datetime.datetime(2026, 1, 15, 23, 0, tzinfo=datetime.timezone.utc),
        )

        result = reservation_status_change_counts(
            self.shelter.pk,
            datetime.date(2026, 1, 15),
            datetime.date(2026, 1, 15),
        )
        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)


def _dt(y: int, m: int, d: int) -> datetime.datetime:
    """Shortcut: UTC datetime at noon on the given date."""
    return datetime.datetime(y, m, d, 12, 0, 0, tzinfo=datetime.timezone.utc)
