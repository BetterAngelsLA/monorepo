from datetime import UTC, date, datetime

import pytest
import time_machine
from accounts.models import Organization
from common.constants import OPERATING_TIME_ZONE
from model_bakery import baker
from reports.models import ScheduledReport
from reports.services import get_previous_month_range


@pytest.mark.django_db
class TestSchedulingLogic:
    """Test the set_next_run logic using relativedelta."""

    @pytest.mark.parametrize(
        "current_time, schedule_day, schedule_hour, expected_next_run",
        [
            # 1. Simple next month schedule (before scheduled time)
            (
                datetime(2023, 1, 15, 12, 0, 0, tzinfo=OPERATING_TIME_ZONE),
                10,
                9,
                datetime(2023, 2, 10, 9, 0, 0, tzinfo=OPERATING_TIME_ZONE),
            ),
            # 2. Schedule this month (before scheduled time)
            (
                datetime(2023, 1, 15, 8, 0, 0, tzinfo=OPERATING_TIME_ZONE),
                15,
                9,
                datetime(2023, 1, 15, 9, 0, 0, tzinfo=OPERATING_TIME_ZONE),
            ),
            # 3. End of month clamping (Jan 31 -> Feb 28)
            (
                datetime(2023, 1, 31, 10, 0, 0, tzinfo=OPERATING_TIME_ZONE),
                31,
                9,
                datetime(2023, 2, 28, 9, 0, 0, tzinfo=OPERATING_TIME_ZONE),
            ),
            # 4. Leap year clamping (Jan 31 -> Feb 29)
            (
                datetime(2024, 1, 31, 10, 0, 0, tzinfo=OPERATING_TIME_ZONE),
                31,
                9,
                datetime(2024, 2, 29, 9, 0, 0, tzinfo=OPERATING_TIME_ZONE),
            ),
            # 5. Short month to Long month (Feb 28 -> Mar 31)
            (
                datetime(2023, 2, 28, 10, 0, 0, tzinfo=OPERATING_TIME_ZONE),
                31,
                9,
                datetime(2023, 3, 31, 9, 0, 0, tzinfo=OPERATING_TIME_ZONE),
            ),
        ],
    )
    def test_next_run_calculation(
        self,
        current_time: datetime,
        schedule_day: int,
        schedule_hour: int,
        expected_next_run: datetime,
    ) -> None:
        """Test calculation of next_run_at based on different scenarios."""
        org = baker.make(Organization)

        with time_machine.travel(current_time):
            report = baker.make(
                ScheduledReport,
                organization=org,
                day_of_month=schedule_day,
                hour=schedule_hour,
                recipients="test@example.com",
            )

            assert report.next_run_at == expected_next_run

    def test_next_run_lands_on_local_midnight_not_utc_midnight(self) -> None:
        """A report due on the 1st at hour 0 fires at midnight locally.

        Placed on UTC's calendar instead, ``next_run_at`` is 00:00 UTC, which is
        5pm on the last day of the previous month in Los Angeles.
        """
        with time_machine.travel(datetime(2026, 8, 15, 12, 0, tzinfo=OPERATING_TIME_ZONE)):
            report = baker.make(ScheduledReport, organization=baker.make(Organization), day_of_month=1, hour=0)

        assert report.next_run_at is not None
        local = report.next_run_at.astimezone(OPERATING_TIME_ZONE)
        assert (local.year, local.month, local.day, local.hour) == (2026, 9, 1, 0)
        assert report.next_run_at.astimezone(UTC).hour == 7

    def test_the_due_date_yields_the_month_that_just_ended(self) -> None:
        """A schedule due on the 1st covers the month before it, read locally.

        Placed on UTC's calendar, next_run_at would be 00:00 UTC on the 1st, which
        is still the last day of the previous month locally — and the report would
        cover the month before the one that just ended, skipping a month.
        """
        with time_machine.travel(datetime(2026, 8, 15, 12, 0, tzinfo=OPERATING_TIME_ZONE)):
            report = baker.make(ScheduledReport, organization=baker.make(Organization), day_of_month=1, hour=0)

        assert report.next_run_at is not None
        due_locally = report.next_run_at.astimezone(OPERATING_TIME_ZONE).date()

        assert get_previous_month_range(as_of=due_locally) == (date(2026, 8, 1), date(2026, 8, 31))
