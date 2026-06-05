import datetime

from django.test import TestCase
from django.utils import timezone
from shelters.enums import ReservationStatusChoices
from shelters.models import Reservation, Shelter
from shelters.selectors import reservation_status_change_counts

ReservationEvent = Reservation.pgh_event_model


class ReservationStatusChangeCountsTestCase(TestCase):
    """Tests for ``reservation_status_change_counts``."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        # A range comfortably inside the one-year look-back window (today is 2026-06-04).
        self.start = datetime.date(2026, 1, 1)
        self.end = datetime.date(2026, 1, 31)

    # -- helpers -------------------------------------------------------------

    def _make_reservation(self, shelter: Shelter, statuses: list[str]) -> Reservation:
        """Create a reservation (defaults to CONFIRMED) then apply each status in order.

        Each ``save`` that changes ``status`` fires a ``reservation.status_change``
        event via the pghistory trigger.
        """
        reservation = Reservation.objects.create(shelter=shelter)
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
        return timezone.make_aware(datetime.datetime(2026, 1, 15, 12, 0))

    # -- tests ---------------------------------------------------------------

    def test_counts_each_transition_type(self) -> None:
        """One reservation per status produces a count of 1 in each bucket."""
        overdue = self._make_reservation(self.shelter, [ReservationStatusChoices.CHECK_IN_OVERDUE])
        cancelled = self._make_reservation(self.shelter, [ReservationStatusChoices.CANCELLED])
        checked_in = self._make_reservation(self.shelter, [ReservationStatusChoices.CHECKED_IN])
        for r in (overdue, cancelled, checked_in):
            self._set_event_dates(r, self._in_range())

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)
        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_overdue_to_checked_in_transition(self) -> None:
        """A check_in_overdue -> checked_in transition is counted via pgh_diff."""
        reservation = self._make_reservation(
            self.shelter,
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
            self.shelter,
            [
                ReservationStatusChoices.CHECKED_IN,
                ReservationStatusChoices.CANCELLED,
                ReservationStatusChoices.CHECKED_IN,
            ],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_end_date_is_inclusive(self) -> None:
        """An event late on end_date is still counted (end inclusive)."""
        reservation = self._make_reservation(self.shelter, [ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(reservation, timezone.make_aware(datetime.datetime(2026, 1, 31, 23, 0)))

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start or after end are not counted."""
        before = self._make_reservation(self.shelter, [ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation(self.shelter, [ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(before, timezone.make_aware(datetime.datetime(2025, 12, 31, 12, 0)))
        self._set_event_dates(after, timezone.make_aware(datetime.datetime(2026, 2, 1, 0, 0)))

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_other_shelter_events_excluded(self) -> None:
        """Events belonging to a different shelter are not counted."""
        reservation = self._make_reservation(self.other_shelter, [ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_returns_empty_when_start_date_beyond_lookback(self) -> None:
        """A start_date older than one year short-circuits to an empty dict."""
        old_start = timezone.now().date() - datetime.timedelta(days=400)

        result = reservation_status_change_counts(self.shelter.pk, old_start, self.end)

        self.assertEqual(result, {})

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
