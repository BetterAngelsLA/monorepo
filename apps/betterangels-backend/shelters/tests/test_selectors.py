import datetime

from django.test import TestCase
from model_bakery import baker
from shelters.enums import BedStatusChoices
from shelters.models import Bed, BedEvent  # type: ignore[attr-defined]
from shelters.selectors import report_bed_status_counts
from shelters.tests.baker_recipes import shelter_recipe


def _dt(year: int, month: int, day: int) -> datetime.datetime:
    """Helper: build a UTC datetime at noon on the given date."""
    return datetime.datetime(year, month, day, 12, 0, 0, tzinfo=datetime.timezone.utc)


class ReportBedStatusCountsTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = shelter_recipe.make()

    def _backdate_events(self, bed: Bed, dt: datetime.datetime) -> None:
        """Move all BedEvents for this bed to the given datetime."""
        BedEvent.objects.filter(pgh_obj_id=bed.pk).update(pgh_created_at=dt)

    def test_single_day_counts(self) -> None:
        """Counts for a single day match the statuses of the beds."""
        day = datetime.date(2026, 1, 1)
        dt = _dt(2026, 1, 1)

        available = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        occupied = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.OCCUPIED)
        reserved = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.RESERVED)
        out_of_service = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.OUT_OF_SERVICE)

        for bed in [available, occupied, reserved, out_of_service]:
            self._backdate_events(bed, dt)

        result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["date"], "2026-01-01")
        self.assertEqual(result[0]["available"], 1)
        self.assertEqual(result[0]["occupied"], 1)
        self.assertEqual(result[0]["reserved"], 1)
        self.assertEqual(result[0]["out_of_service"], 1)

    def test_status_change_reflected_on_correct_day(self) -> None:
        """A bed's status change on day 2 is reflected from day 2 onwards."""
        day1 = datetime.date(2026, 1, 1)
        day2 = datetime.date(2026, 1, 2)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        # backdate the bed.add event to day 1
        self._backdate_events(bed, _dt(2026, 1, 1))

        # simulate a status change on day 2 by creating a BedEvent directly
        event = BedEvent.objects.create(
            pgh_obj=bed,
            pgh_label="bed.status_change",
            id=bed.pk,
            shelter=self.shelter,
            status=BedStatusChoices.OCCUPIED,
        )
        # auto_now_add ignores values passed to create(), so backdate after the fact
        BedEvent.objects.filter(pgh_id=event.pgh_id).update(pgh_created_at=_dt(2026, 1, 2))

        result = report_bed_status_counts(shelter=self.shelter, start_date=day1, end_date=day2)

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["available"], 1)
        self.assertEqual(result[0]["occupied"], 0)
        self.assertEqual(result[1]["available"], 0)
        self.assertEqual(result[1]["occupied"], 1)

    def test_removed_bed_not_counted(self) -> None:
        """A bed with a bed.remove event is excluded from the snapshot."""
        day = datetime.date(2026, 1, 1)

        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))

        # simulate deletion: add a bed.remove event
        event = BedEvent.objects.create(
            pgh_obj=bed,
            pgh_label="bed.remove",
            id=bed.pk,
            shelter=self.shelter,
            status=BedStatusChoices.AVAILABLE,
        )
        # must be after the bed.add (noon); use 13:00 so it becomes the most recent event
        BedEvent.objects.filter(pgh_id=event.pgh_id).update(
            pgh_created_at=datetime.datetime(2026, 1, 1, 13, 0, 0, tzinfo=datetime.timezone.utc)
        )

        result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self.assertEqual(result[0]["available"], 0)

    def test_other_shelter_beds_not_counted(self) -> None:
        """Beds belonging to a different shelter are not counted."""
        day = datetime.date(2026, 1, 1)

        other_shelter = shelter_recipe.make()
        bed = baker.make(Bed, shelter=other_shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2026, 1, 1))

        result = report_bed_status_counts(shelter=self.shelter, start_date=day, end_date=day)

        self.assertEqual(result[0]["available"], 0)

    def test_date_range_returns_one_entry_per_day(self) -> None:
        """Result has exactly one dict per day in the range."""
        start = datetime.date(2026, 1, 1)
        end = datetime.date(2026, 1, 7)

        result = report_bed_status_counts(shelter=self.shelter, start_date=start, end_date=end)

        self.assertEqual(len(result), 7)
        self.assertEqual(result[0]["date"], "2026-01-01")
        self.assertEqual(result[6]["date"], "2026-01-07")

    def test_bed_created_before_range_is_counted(self) -> None:
        """A bed created a year ago still appears in the snapshot."""
        bed = baker.make(Bed, shelter=self.shelter, status=BedStatusChoices.AVAILABLE)
        self._backdate_events(bed, _dt(2025, 1, 1))  # one year ago

        start = datetime.date(2026, 1, 1)
        end = datetime.date(2026, 1, 1)

        result = report_bed_status_counts(shelter=self.shelter, start_date=start, end_date=end)

        self.assertEqual(result[0]["available"], 1)
