from datetime import datetime, timezone

import pytest
import time_machine
from accounts.models import Organization
from model_bakery import baker
from reports.models import ScheduledReport


@pytest.mark.django_db
class TestSchedulingLogic:
    """Test the set_next_run logic using relativedelta."""

    @pytest.mark.parametrize(
        "current_time, schedule_day, schedule_hour, expected_next_run",
        [
            # 1. Simple next month schedule (before scheduled time)
            (
                datetime(2023, 1, 15, 12, 0, 0, tzinfo=timezone.utc),
                10,
                9,
                datetime(2023, 2, 10, 9, 0, 0, tzinfo=timezone.utc),
            ),
            # 2. Schedule this month (before scheduled time)
            (
                datetime(2023, 1, 15, 8, 0, 0, tzinfo=timezone.utc),
                15,
                9,
                datetime(2023, 1, 15, 9, 0, 0, tzinfo=timezone.utc),
            ),
            # 3. End of month clamping (Jan 31 -> Feb 28)
            (
                datetime(2023, 1, 31, 10, 0, 0, tzinfo=timezone.utc),
                31,
                9,
                datetime(2023, 2, 28, 9, 0, 0, tzinfo=timezone.utc),
            ),
            # 4. Leap year clamping (Jan 31 -> Feb 29)
            (
                datetime(2024, 1, 31, 10, 0, 0, tzinfo=timezone.utc),
                31,
                9,
                datetime(2024, 2, 29, 9, 0, 0, tzinfo=timezone.utc),
            ),
            # 5. Short month to Long month (Feb 28 -> Mar 31)
            (
                datetime(2023, 2, 28, 10, 0, 0, tzinfo=timezone.utc),
                31,
                9,
                datetime(2023, 3, 31, 9, 0, 0, tzinfo=timezone.utc),
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
