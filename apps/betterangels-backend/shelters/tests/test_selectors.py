import datetime

from django.test import TestCase
from django.utils import timezone
from model_bakery import baker

# isort: split
from shelters.enums import DemographicChoices, ReservationStatusChoices
from shelters.models import (
    Bed,
    Demographic,
    Reservation,
    Room,
    Shelter,
)
from shelters.selectors import MAX_REPORT_RANGE_DAYS, reservation_status_change_counts

ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]


def _aware(y: int, m: int, d: int, hh: int = 12, mm: int = 0) -> datetime.datetime:
    return timezone.make_aware(datetime.datetime(y, m, d, hh, mm))


class ReservationStatusChangeCountsTestCase(TestCase):
    """Tests for ``reservation_status_change_counts``.

    The selector targets the *Reservations* metric of the shelter-occupancy
    report: counts of reservations whose status changed to OVERDUE,
    CANCELLED, CHECKED_IN, or transitioned from OVERDUE -> CHECKED_IN,
    optionally scoped by bed/room demographic.
    """

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.other_shelter = Shelter.objects.create(name="Other Shelter")
        # A typical month-long window inside the one-year look-back.
        self.start_date = datetime.date(2026, 1, 1)
        self.end_date = datetime.date(2026, 1, 31)

    # -- helpers -------------------------------------------------------------

    def _make_reservation(
        self,
        statuses: list[ReservationStatusChoices],
        *,
        bed: Bed | None = None,
        room: Room | None = None,
    ) -> Reservation:
        """Create a reservation on a fresh bed (unless one is supplied) then
        apply each status in order.

        Each reservation gets its own bed to satisfy the
        unique-active-reservation-per-bed constraint.  Every ``save`` that
        changes ``status`` fires a ``reservation.status_change`` event via
        the pghistory trigger.
        """
        bed = bed or baker.make(Bed, shelter=self.shelter, name="Test-Bed")
        reservation = Reservation.objects.create(bed=bed, room=room)
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

    def _get_demographic(self, choice: DemographicChoices) -> Demographic:
        demo, _ = Demographic.objects.get_or_create(name=choice.value)
        return demo

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

        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)
        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_overdue_to_checked_in_transition(self) -> None:
        """A check_in_overdue -> checked_in transition is counted via pgh_diff."""
        reservation = self._make_reservation(
            [ReservationStatusChoices.CHECK_IN_OVERDUE, ReservationStatusChoices.CHECKED_IN],
        )
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

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

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_on_end_date_are_included(self) -> None:
        """An event late on the end_date (which is inclusive) is counted."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(reservation, _aware(2026, 1, 31, 23, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_events_outside_range_excluded(self) -> None:
        """Events before start_date or after end_date are not counted."""
        before = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        after = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(before, _aware(2025, 12, 31, 23, 0))
        self._set_event_dates(after, _aware(2026, 2, 1, 0, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_other_shelter_events_excluded(self) -> None:
        """Events belonging to a different shelter are not counted."""
        other_bed = baker.make(Bed, shelter=self.other_shelter, name="Other-Bed")
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=other_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_raises_when_end_date_before_start_date(self) -> None:
        """An end_date before start_date is a programmer error."""
        with self.assertRaisesRegex(ValueError, "end_date must be on or after start_date"):
            reservation_status_change_counts(shelter=self.shelter, start_date=self.end_date, end_date=self.start_date)

    def test_raises_when_range_exceeds_one_year(self) -> None:
        """The selector rejects ranges longer than the one-year look-back."""
        long_end = self.start_date + datetime.timedelta(days=MAX_REPORT_RANGE_DAYS + 1)
        with self.assertRaisesRegex(ValueError, "Date range cannot exceed"):
            reservation_status_change_counts(shelter=self.shelter, start_date=self.start_date, end_date=long_end)

    def test_no_events_returns_zero_counts(self) -> None:
        """A shelter with no status changes returns zero in every bucket."""
        result = reservation_status_change_counts(
            shelter=self.shelter, start_date=self.start_date, end_date=self.end_date
        )

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
        self._set_event_dates(checked_in, _aware(2026, 1, 1))
        self._set_event_dates(cancelled, _aware(2026, 1, 2))

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 1, 2),
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)
        self.assertEqual(result["STATUS_TO_CANCELLED"], 1)

    def test_counts_support_one_day_range(self) -> None:
        """A range where start_date == end_date includes that day."""
        reservation = self._make_reservation([ReservationStatusChoices.CHECK_IN_OVERDUE])
        self._set_event_dates(reservation, _aware(2026, 1, 15, 23, 0))

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2026, 1, 15),
            end_date=datetime.date(2026, 1, 15),
        )

        self.assertEqual(result["STATUS_TO_CHECK_IN_OVERDUE"], 1)

    def test_supports_one_year_range(self) -> None:
        """Ranges up to one year in the past are supported (acceptance criterion)."""
        in_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        before_window = self._make_reservation([ReservationStatusChoices.CHECKED_IN])
        self._set_event_dates(in_window, _aware(2025, 6, 15))
        self._set_event_dates(before_window, _aware(2024, 12, 31))

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=datetime.date(2025, 1, 1),
            end_date=datetime.date(2025, 12, 31),
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    # -- demographic filtering ----------------------------------------------

    def test_demographics_filter_includes_matching_bed(self) -> None:
        """When demographics filter is set, reservations whose bed serves a
        matching demographic are counted."""
        seniors_bed = baker.make(Bed, shelter=self.shelter, name="Seniors-Bed")
        seniors_bed.demographics.add(self._get_demographic(DemographicChoices.SENIORS))

        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=seniors_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.SENIORS],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_demographics_filter_excludes_non_matching_bed(self) -> None:
        """Reservations whose bed/room does not serve any of the requested
        demographics are excluded."""
        families_bed = baker.make(Bed, shelter=self.shelter, name="Families-Bed")
        families_bed.demographics.add(self._get_demographic(DemographicChoices.FAMILIES))

        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=families_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.SINGLE_MEN],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 0)

    def test_demographics_filter_matches_via_room_when_bed_absent(self) -> None:
        """Room-only reservations match when the room serves a requested demographic."""
        room = baker.make(Room, shelter=self.shelter, name="Tay-Room")
        room.demographics.add(self._get_demographic(DemographicChoices.TAY_TEEN))

        # Skip the helper so we can create a room-only reservation (bed=None).
        reservation = Reservation.objects.create(room=room)
        reservation.status = ReservationStatusChoices.CHECKED_IN
        reservation.save()
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.TAY_TEEN],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_demographics_filter_accepts_string_values(self) -> None:
        """Raw string values are accepted alongside ``DemographicChoices`` members."""
        seniors_bed = baker.make(Bed, shelter=self.shelter, name="Seniors-Bed")
        seniors_bed.demographics.add(self._get_demographic(DemographicChoices.SENIORS))

        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=seniors_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=["seniors"],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_demographics_filter_unions_multiple_choices(self) -> None:
        """A multi-demographic filter matches reservations serving *any* of them."""
        seniors_bed = baker.make(Bed, shelter=self.shelter, name="Seniors-Bed")
        seniors_bed.demographics.add(self._get_demographic(DemographicChoices.SENIORS))

        veterans_bed = baker.make(Bed, shelter=self.shelter, name="Vets-Bed")
        veterans_bed.demographics.add(self._get_demographic(DemographicChoices.SINGLE_MEN))

        ignored_bed = baker.make(Bed, shelter=self.shelter, name="Families-Bed")
        ignored_bed.demographics.add(self._get_demographic(DemographicChoices.FAMILIES))

        for bed in (seniors_bed, veterans_bed, ignored_bed):
            res = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=bed)
            self._set_event_dates(res, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.SENIORS, DemographicChoices.SINGLE_MEN],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 2)

    def test_demographics_filter_does_not_double_count(self) -> None:
        """A bed tagged with multiple matching demographics is still counted once."""
        bed = baker.make(Bed, shelter=self.shelter, name="Multi-Bed")
        bed.demographics.add(
            self._get_demographic(DemographicChoices.SENIORS),
            self._get_demographic(DemographicChoices.SINGLE_MEN),
        )

        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.SENIORS, DemographicChoices.SINGLE_MEN],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_demographics_all_disables_filter(self) -> None:
        """``DemographicChoices.ALL`` is treated as 'no narrowing'."""
        any_bed = baker.make(Bed, shelter=self.shelter, name="Any-Bed")
        # Intentionally no demographics on the bed.

        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=any_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[DemographicChoices.ALL],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)

    def test_empty_demographics_list_disables_filter(self) -> None:
        """An empty iterable means 'no filter', matching ``None``."""
        any_bed = baker.make(Bed, shelter=self.shelter, name="Any-Bed")
        reservation = self._make_reservation([ReservationStatusChoices.CHECKED_IN], bed=any_bed)
        self._set_event_dates(reservation, self._in_range())

        result = reservation_status_change_counts(
            shelter=self.shelter,
            start_date=self.start_date,
            end_date=self.end_date,
            demographics=[],
        )

        self.assertEqual(result["STATUS_TO_CHECKED_IN"], 1)
