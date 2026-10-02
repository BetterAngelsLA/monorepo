from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

import pytest
import time_machine
from accounts.models import Organization
from django.utils import timezone
from model_bakery import baker
from reports.models import ScheduledReport
from reports.services import get_previous_month_range

# Schedules are placed on the site's calendar, whichever that is, so the cases
# below stay correct under any TIME_ZONE.
SITE_TZ = timezone.get_default_timezone()


@pytest.mark.django_db
class TestSchedulingLogic:
    """Test the set_next_run logic using relativedelta."""

    @pytest.mark.parametrize(
        "current_time, schedule_day, schedule_hour, expected_next_run",
        [
            # 1. Simple next month schedule (before scheduled time)
            (
                datetime(2023, 1, 15, 12, 0, 0, tzinfo=SITE_TZ),
                10,
                9,
                datetime(2023, 2, 10, 9, 0, 0, tzinfo=SITE_TZ),
            ),
            # 2. Schedule this month (before scheduled time)
            (
                datetime(2023, 1, 15, 8, 0, 0, tzinfo=SITE_TZ),
                15,
                9,
                datetime(2023, 1, 15, 9, 0, 0, tzinfo=SITE_TZ),
            ),
            # 3. End of month clamping (Jan 31 -> Feb 28)
            (
                datetime(2023, 1, 31, 10, 0, 0, tzinfo=SITE_TZ),
                31,
                9,
                datetime(2023, 2, 28, 9, 0, 0, tzinfo=SITE_TZ),
            ),
            # 4. Leap year clamping (Jan 31 -> Feb 29)
            (
                datetime(2024, 1, 31, 10, 0, 0, tzinfo=SITE_TZ),
                31,
                9,
                datetime(2024, 2, 29, 9, 0, 0, tzinfo=SITE_TZ),
            ),
            # 5. Short month to Long month (Feb 28 -> Mar 31)
            (
                datetime(2023, 2, 28, 10, 0, 0, tzinfo=SITE_TZ),
                31,
                9,
                datetime(2023, 3, 31, 9, 0, 0, tzinfo=SITE_TZ),
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
        the evening of the last day of the previous month locally.
        """
        with time_machine.travel(datetime(2026, 8, 15, 12, 0, tzinfo=SITE_TZ)):
            report = baker.make(ScheduledReport, organization=baker.make(Organization), day_of_month=1, hour=0)

        assert report.next_run_at is not None
        local = report.next_run_at.astimezone(SITE_TZ)
        assert (local.year, local.month, local.day, local.hour) == (2026, 9, 1, 0)

    def test_the_due_date_yields_the_month_that_just_ended(self) -> None:
        """A schedule due on the 1st covers the month before it, read locally.

        Placed on UTC's calendar, next_run_at would be 00:00 UTC on the 1st, which
        is still the last day of the previous month locally — and the report would
        cover the month before the one that just ended, skipping a month.
        """
        with time_machine.travel(datetime(2026, 8, 15, 12, 0, tzinfo=SITE_TZ)):
            report = baker.make(ScheduledReport, organization=baker.make(Organization), day_of_month=1, hour=0)

        assert report.next_run_at is not None
        due_locally = report.next_run_at.astimezone(SITE_TZ).date()

        assert get_previous_month_range(as_of=due_locally) == (date(2026, 8, 1), date(2026, 8, 31))

    def test_the_schedule_ignores_the_timezone_of_whoever_saved_it(self) -> None:
        """``hour`` is read on the site's calendar, not the browsing admin's.

        ``set_next_run`` runs both from an admin save and from Celery after a
        send.  Following the active zone would let a report set to 8am by a
        remote admin drift to 8am here on its first reschedule.
        """
        org = baker.make(Organization)

        with time_machine.travel(datetime(2026, 8, 15, 12, 0, tzinfo=UTC)):
            with timezone.override(ZoneInfo("Australia/Sydney")):
                saved_remotely = baker.make(ScheduledReport, organization=org, day_of_month=1, hour=8)
            saved_by_the_server = baker.make(ScheduledReport, organization=org, day_of_month=1, hour=8)

        assert saved_remotely.next_run_at == saved_by_the_server.next_run_at
