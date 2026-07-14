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
from shelters.selectors import bed_status_metric, reservation_status_change_counts
from shelters.types.reporting import DailyBedStatusMetricsType

BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]
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


class BedStatusMetricTestCase(TestCase):
    """Tests for ``bed_status_metric``.

    Each test builds a precise event history by:
    1. Creating beds / reservations (which fires pghistory events with ``now()``).
    2. Back-dating specific events via ``.update(pgh_created_at=...)``.

    The selector uses end-of-day LA-local snapshots (via ``report_date_range_to_utc``),
    so test event timestamps are set well within any day to avoid LA/UTC boundary effects.
    """

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        self.start_date = datetime.date(2026, 1, 1)
        self.end_date = datetime.date(2026, 1, 31)

    # ── helpers ──────────────────────────────────────────────────────────────

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
        start_date: datetime.date | None = None,
        end_date: datetime.date | None = None,
    ) -> list[DailyBedStatusMetricsType]:
        return bed_status_metric(
            shelter=self.shelter,
            start_date=start_date or self.start_date,
            end_date=end_date or self.end_date,
        )

    # ── basic status mapping ─────────────────────────────────────────────────

    def test_available_with_no_reservation(self) -> None:
        """A bed with no reservation is counted as available."""
        bed = self._make_bed()
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].reserved, 1)
        self.assertEqual(result[0].available, 0)

    def test_checked_in_reservation_counts_as_occupied(self) -> None:
        """A bed with a CHECKED_IN reservation is counted as occupied."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECKED_IN)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].occupied, 1)
        self.assertEqual(result[0].reserved, 0)

    def test_overdue_reservation_counts_as_reserved(self) -> None:
        """A bed with a CHECK_IN_OVERDUE reservation is counted as reserved."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._transition(r, ReservationStatusChoices.CHECK_IN_OVERDUE)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].reserved, 1)

    def test_maintenance_flag_counts_as_out_of_service(self) -> None:
        """A bed with maintenance_flag=True is counted as out_of_service."""
        bed = self._make_bed()
        self._set_maintenance(bed, True)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_maintenance_event_dt(bed, _aware(2026, 1, 1, 1))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].available, 1)
        self.assertEqual(result[0].occupied, 0)

    # ── multi-day / cumulative state ─────────────────────────────────────────

    def test_multi_day_range_has_one_entry_per_day(self) -> None:
        """The result has exactly one entry per day in the range."""
        result = self._call(
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 1, 5),
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
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 1, 3),
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
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 1, 3),
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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].reserved, 1)
        self.assertEqual(result[0].available, 0)

    # ── boundary conditions ──────────────────────────────────────────────────

    def test_events_exactly_on_start_date_are_included(self) -> None:
        """An event at midnight on start_date is captured in that day's count."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 1, 0, 1))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].reserved, 1)

    def test_events_on_end_date_are_included(self) -> None:
        """An event late on end_date (23:59) is captured."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 31, 23, 0))
        self._set_res_event_dt(r, _aware(2026, 1, 31, 23, 59))

        result = self._call(start_date=datetime.date(2026, 1, 31), end_date=datetime.date(2026, 1, 31))

        self.assertEqual(result[0].reserved, 1)

    def test_events_after_end_date_are_excluded(self) -> None:
        """Events after end_date are not reflected in any day's count."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        # Bed existed before range; reservation added after range
        self._set_bed_add_event_dt(bed, _aware(2026, 1, 1, 0))
        self._set_res_event_dt(r, _aware(2026, 2, 1, 0))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 31))

        for entry in result:
            self.assertEqual(entry.available, 1, f"Bed should be available on {entry.date}")

    def test_initial_state_from_events_before_range(self) -> None:
        """A reservation made before start_date still shows in the range."""
        bed = self._make_bed()
        r = self._make_reservation(bed, initial_status=ReservationStatusChoices.CONFIRMED)
        self._set_bed_add_event_dt(bed, _aware(2025, 12, 1, 0))
        self._set_res_event_dt(r, _aware(2025, 12, 15, 0))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 3))

        for entry in result:
            self.assertEqual(entry.reserved, 1, f"Bed should be reserved on {entry.date}")

    def test_raises_when_end_date_before_start_date(self) -> None:
        """Passing end_date < start_date raises ValueError."""
        with self.assertRaisesRegex(ValueError, "end_date must be on or after start_date"):
            bed_status_metric(
                shelter=self.shelter,
                start_date=datetime.date(2026, 1, 31),
                end_date=datetime.date(2026, 1, 1),
            )

    def test_single_day_range(self) -> None:
        """start_date == end_date returns exactly one entry."""
        result = self._call(
            start_date=datetime.date(2026, 1, 15),
            end_date=datetime.date(2026, 1, 15),
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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].available, 0)
        self.assertEqual(result[0].reserved, 0)

    def test_room_only_reservations_excluded_from_bed_counts(self) -> None:
        """Room-only reservations (bed_id IS NULL) do not affect per-bed counts."""
        room = baker.make(Room, shelter=self.shelter, name="Test-Room")
        r = Reservation.objects.create(room=room)
        self._set_res_event_dt(r, _aware(2026, 1, 1, 1))

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 1))

        self.assertEqual(result[0].available, 0)
        self.assertEqual(result[0].occupied, 0)
        self.assertEqual(result[0].reserved, 0)
        self.assertEqual(result[0].out_of_service, 0)

    def test_no_beds_returns_all_zeros(self) -> None:
        """A shelter with no beds returns zero in every bucket for each day."""
        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 3))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 5))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 4))

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

        result = self._call(start_date=datetime.date(2026, 1, 1), end_date=datetime.date(2026, 1, 3))

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
            start_date=datetime.date(2025, 1, 1),
            end_date=datetime.date(2025, 12, 31),
        )

        self.assertEqual(len(result), 365)
        self.assertTrue(all(e.available == 1 for e in result))
