import datetime
from unittest import skip

from django.test import TestCase
from django.utils import timezone
from model_bakery import baker

# isort: split
from shelters.enums import BedStatusChoices, ReservationStatusChoices
from shelters.models import (Bed, BedEvent,  # type: ignore[attr-defined]
                             Reservation, Shelter)
from shelters.selectors import (report_bed_status_counts,
                                reservation_status_change_counts)
from shelters.tests.baker_recipes import shelter_recipe

ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]


class ReservationStatusChangeCountsTestCase(TestCase):
    """Tests for ``reservation_status_change_counts``."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        # A range comfortably inside the one-year look-back window.
        self.start = timezone.make_aware(datetime.datetime(2026, 1, 1))
        self.end = timezone.make_aware(datetime.datetime(2026, 2, 1))

    # -- helpers -------------------------------------------------------------

    def _make_reservation(self, statuses: list[ReservationStatusChoices], bed: Bed | None=None) -> Reservation:
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
        return timezone.make_aware(datetime.datetime(2026, 1, 15, 12, 0))

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

    def test_events_before_end_datetime_are_included(self) -> None:
        """An event before the exclusive end datetime is counted."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(
            reservation,
            timezone.make_aware(datetime.datetime(2026, 1, 31, 23, 0)),
        )

        result = reservation_status_change_counts(self.shelter.pk, self.start, self.end)

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start or at the exclusive end datetime are not counted."""
        before = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(
            before,
            timezone.make_aware(datetime.datetime(2025, 12, 31, 12, 0)),
        )
        self._set_event_dates(
            after,
            timezone.make_aware(datetime.datetime(2026, 2, 1, 0, 0)),
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
        """An end_datetime before start_datetime returns zero in every bucket."""
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
        """Counts are aggregated across the whole datetime range."""
        checked_in = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        cancelled = self._make_reservation([ReservationStatusChoices.CANCELLED])
        self._set_event_dates(
            checked_in,
            timezone.make_aware(datetime.datetime(2026, 1, 1, 12, 0)),
        )
        self._set_event_dates(
            cancelled,
            timezone.make_aware(datetime.datetime(2026, 1, 2, 12, 0)),
        )

        result = reservation_status_change_counts(
            self.shelter.pk,
            timezone.make_aware(datetime.datetime(2026, 1, 1)),
            timezone.make_aware(datetime.datetime(2026, 1, 3)),
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)

    def test_counts_support_one_day_datetime_range(self) -> None:
        """A one-day datetime range includes events on that date."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        self._set_event_dates(
            reservation,
            timezone.make_aware(datetime.datetime(2026, 1, 15, 23, 0)),
        )

        result = reservation_status_change_counts(
            self.shelter.pk,
            timezone.make_aware(datetime.datetime(2026, 1, 15)),
            timezone.make_aware(datetime.datetime(2026, 1, 16)),
        )
        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)


def _dt(y: int, m: int, d: int) -> datetime.datetime:
    """Shortcut: UTC datetime at noon on the given date."""
    return datetime.datetime(y, m, d, 12, 0, 0, tzinfo=datetime.timezone.utc)


_STATUS_KEYS = ("available", "occupied", "reserved", "out_of_service")


@skip("status removed from Bed and Room")
class ReportBedStatusCountsTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = shelter_recipe.make()

    # -- helpers ---------------------------------------------------------------

    def _backdate_events(self, bed: Bed, dt: datetime.datetime) -> None:
        """Move all BedEvents for this bed to the given datetime."""
        BedEvent.objects.filter(pgh_obj_id=bed.pk).update(pgh_created_at=dt)

    def _add_event(self, bed: Bed, label: str, status: str, dt: datetime.datetime) -> None:
        """Create a BedEvent with a specific pgh_created_at.

        pgh_created_at has auto_now_add so we call update() after create().
        """
        event = BedEvent.objects.create(
            pgh_obj=bed,
            pgh_label=label,
            id=bed.pk,
            shelter=self.shelter,
            status=status,
        )
        BedEvent.objects.filter(pgh_id=event.pgh_id).update(pgh_created_at=dt)

    def _assert_result(self, result: list[dict], expected: list[dict]) -> None:
        """Assert result matches expected list of {date, available, occupied, ...}."""
        self.assertEqual(len(result), len(expected))
        for i, exp in enumerate(expected):
            self.assertEqual(result[i]["date"], exp["date"])
            for key in _STATUS_KEYS:
                self.assertEqual(result[i][key], exp.get(key, 0), f"day {exp['date']} {key}")

    # -- tests -----------------------------------------------------------------

    def test_single_day_counts(self) -> None:
        day = datetime.date(2026, 1, 1)
        dt = _dt(2026, 1, 1)

        available = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        occupied = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.OCCUPIED)
        reserved = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.RESERVED)
        out_of_service = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.OUT_OF_SERVICE)

        for bed in [available, occupied, reserved, out_of_service]:
            self._backdate_events(bed, dt)

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self._assert_result(
            result,
            [
                {
                    "date": "2026-01-01",
                    "available": 1,
                    "occupied": 1,
                    "reserved": 1,
                    "out_of_service": 1,
                },
            ],
        )

    def test_status_change_reflected_on_correct_day(self) -> None:
        day1, day2 = datetime.date(2026, 1, 1), datetime.date(2026, 1, 2)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))
        self._add_event(bed, "bed.status_change", BedStatusChoices.OCCUPIED, _dt(2026, 1, 2))

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day1, end_date=day2)

        self._assert_result(
            result,
            [
                {"date": "2026-01-01", "available": 1, "occupied": 0},
                {"date": "2026-01-02", "available": 0, "occupied": 1},
            ],
        )

    def test_removed_bed_not_counted(self) -> None:
        day = datetime.date(2026, 1, 1)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))
        # bed.add at noon; bed.remove at 13:00 — remove becomes latest event
        self._add_event(
            bed,
            "bed.remove",
            BedStatusChoices.AVAILABLE,
            datetime.datetime(2026, 1, 1, 13, 0, 0, tzinfo=datetime.timezone.utc),
        )

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self._assert_result(result, [{"date": "2026-01-01"}])

    def test_other_shelter_beds_not_counted(self) -> None:
        day = datetime.date(2026, 1, 1)

        other_shelter = shelter_recipe.make()
        bed = baker.make(Bed, shelter=other_shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self._assert_result(result, [{"date": "2026-01-01"}])

    def test_date_range_returns_one_entry_per_day(self) -> None:
        start, end = datetime.date(2026, 1, 1), datetime.date(2026, 1, 7)

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=start, end_date=end)

        self.assertEqual(len(result), 7)
        self.assertEqual(result[0]["date"], "2026-01-01")
        self.assertEqual(result[6]["date"], "2026-01-07")

    def test_bed_created_before_range_is_counted(self) -> None:
        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2025, 1, 1))

        day = datetime.date(2026, 1, 1)

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self._assert_result(result, [{"date": "2026-01-01", "available": 1}])

    def test_multiple_status_changes(self) -> None:
        """A bed changing status multiple times reflects each day correctly."""
        day1, day3 = datetime.date(2026, 1, 1), datetime.date(2026, 1, 3)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))
        self._add_event(bed, "bed.status_change", BedStatusChoices.OCCUPIED, _dt(2026, 1, 2))
        self._add_event(bed, "bed.status_change", BedStatusChoices.OUT_OF_SERVICE, _dt(2026, 1, 3))

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day1, end_date=day3)

        self._assert_result(
            result,
            [
                {
                    "date": "2026-01-01",
                    "available": 1,
                    "occupied": 0,
                    "out_of_service": 0,
                },
                {
                    "date": "2026-01-02",
                    "available": 0,
                    "occupied": 1,
                    "out_of_service": 0,
                },
                {
                    "date": "2026-01-03",
                    "available": 0,
                    "occupied": 0,
                    "out_of_service": 1,
                },
            ],
        )

    def test_bed_created_mid_range_not_counted_before(self) -> None:
        """A bed that didn't exist on earlier days is 0 before its creation."""
        day1, day3 = datetime.date(2026, 1, 1), datetime.date(2026, 1, 3)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 2))  # created on day 2

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day1, end_date=day3)

        self._assert_result(
            result,
            [
                {"date": "2026-01-01", "available": 0},
                {"date": "2026-01-02", "available": 1},
                {"date": "2026-01-03", "available": 1},
            ],
        )

    def test_empty_shelter_returns_all_zeros(self) -> None:
        """A shelter with no beds returns zero counts for every day."""
        start, end = datetime.date(2026, 1, 1), datetime.date(2026, 1, 3)

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=start, end_date=end)

        self._assert_result(
            result,
            [
                {"date": "2026-01-01"},
                {"date": "2026-01-02"},
                {"date": "2026-01-03"},
            ],
        )

    def test_bed_removed_before_range_not_counted(self) -> None:
        """A bed removed before the query range starts is excluded."""
        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2025, 12, 1))
        self._add_event(bed, "bed.remove", BedStatusChoices.AVAILABLE, _dt(2025, 12, 2))

        day = datetime.date(2026, 1, 1)

        with self.assertNumQueries(1):
            result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self._assert_result(result, [{"date": "2026-01-01"}])
