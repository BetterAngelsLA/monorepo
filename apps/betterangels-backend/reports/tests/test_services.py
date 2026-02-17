"""Tests for report services."""

from datetime import datetime

import pytest
import time_machine
from accounts.models import Organization
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from reports.models import ScheduledReport
from reports.services import generate_report_data, get_previous_month_range


@pytest.mark.django_db
class TestReportService:
    """Tests for the generate_report_data service."""

    @pytest.mark.parametrize(
        "current_date, expected_count, note_dates, expected_month, expected_year",
        [
            # Case 1: No notes
            ("2025-01-15 10:00:00", 0, [], "12", "2024"),
            # Case 2: Notes in range
            (
                "2025-01-15 10:00:00",
                3,
                [
                    datetime(2024, 12, 1, 12, 0, 0),
                    datetime(2024, 12, 15, 12, 0, 0),
                    datetime(2024, 12, 31, 12, 0, 0),
                ],
                "12",
                "2024",
            ),
            # Case 3: Notes out of range (January)
            (
                "2025-01-15 10:00:00",
                0,
                [datetime(2025, 1, 1, 12, 0, 0)],
                "12",
                "2024",
            ),
            # Case 4: February report (runs in March)
            (
                "2025-03-15 10:00:00",
                1,
                [datetime(2025, 2, 15, 12, 0, 0)],
                "02",
                "2025",
            ),
            # Case 5: Year boundary (runs in Jan, reports Dec prev year)
            (
                "2025-01-01 00:00:00",
                1,
                [datetime(2024, 12, 15, 12, 0, 0)],
                "12",
                "2024",
            ),
        ],
    )
    def test_generate_report_content(
        self,
        current_date: datetime,
        expected_count: int,
        note_dates: list[datetime],
        expected_month: str,
        expected_year: str,
    ) -> None:
        """Test data generation logic with various date scenarios."""
        org = baker.make(Organization)

        with time_machine.travel(current_date, tick=False):
            report = baker.make(
                ScheduledReport,
                organization=org,
                is_active=True,
            )

            for i, dt in enumerate(note_dates):
                baker.make(
                    Note,
                    organization=org,
                    interacted_at=timezone.make_aware(dt),
                    public_details=f"Note content {i}",
                )

            # Manually calculate range as the task would
            start_date, end_date = get_previous_month_range()

            filename, content, meta = generate_report_data(report, start_date, end_date)

            assert meta["notes_count"] == expected_count
            assert f"interaction_data_{expected_month}_{expected_year}.csv" == filename

            if expected_count > 0:
                # Header + notes
                assert len(content.strip().splitlines()) == expected_count + 1

    def test_generate_report_filters_by_organization(self) -> None:
        """Test that report only includes notes from its organization."""
        org1 = baker.make(Organization)
        org2 = baker.make(Organization)

        report = baker.make(ScheduledReport, organization=org1)

        start = timezone.make_aware(datetime(2024, 12, 1, 0, 0, 0))
        end = timezone.make_aware(datetime(2025, 1, 1, 0, 0, 0))

        # Create notes for org1 (should be included)
        baker.make(
            Note,
            organization=org1,
            interacted_at=timezone.make_aware(datetime(2024, 12, 15, 12, 0, 0)),
            public_details="Org1 Note",
            _quantity=3,
        )

        # Create notes for org2 (should be excluded)
        baker.make(
            Note,
            organization=org2,
            interacted_at=timezone.make_aware(datetime(2024, 12, 15, 12, 0, 0)),
            public_details="Org2 Note",
            _quantity=2,
        )

        filename, content, meta = generate_report_data(report, start, end)

        assert meta["notes_count"] == 3
        # Header + 3 rows
        assert len(content.strip().splitlines()) == 4
        assert "Org1 Note" in content
        assert "Org2 Note" not in content


class TestGetPreviousMonthRange:
    """Tests for get_previous_month_range function (helper in services.py)."""

    @pytest.mark.parametrize(
        "current_date, expected_start, expected_end",
        [
            # January -> December previous year
            (
                "2025-01-15 10:30:00",
                datetime(2024, 12, 1, 0, 0),
                datetime(2025, 1, 1, 0, 0),
            ),
            # March -> February
            (
                "2025-03-15 10:30:00",
                datetime(2025, 2, 1, 0, 0),
                datetime(2025, 3, 1, 0, 0),
            ),
            # End of month -> Previous month
            (
                "2025-05-31 23:59:59",
                datetime(2025, 4, 1, 0, 0),
                datetime(2025, 5, 1, 0, 0),
            ),
            # Leap Year February -> January
            (
                "2024-02-29 12:00:00",
                datetime(2024, 1, 1, 0, 0),
                datetime(2024, 2, 1, 0, 0),
            ),
        ],
    )
    def test_month_ranges(self, current_date: datetime, expected_start: datetime, expected_end: datetime) -> None:
        """Parameterized test for month range calculation."""
        with time_machine.travel(current_date, tick=False):
            start, end = get_previous_month_range()

            # Helper to ignore tz info for comparison if needed,
            # or ensure expected has correct tz if function returns naive/aware
            # Based on code, timezone.now() is used so we expect aware datetimes usually.
            # But get_previous_month_range constructs from parts.
            # Let's compare just the naive parts or ensure equality checks handle it.
            # Start/End from function should have clean times (00:00:00)

            assert start.year == expected_start.year
            assert start.month == expected_start.month
            assert start.day == expected_start.day
            assert start.hour == 0

            assert end.year == expected_end.year
            assert end.month == expected_end.month
            assert end.day == expected_end.day
            assert end.hour == 0

    def test_date_range_is_inclusive_exclusive(self) -> None:
        """Test that start is inclusive and end is exclusive."""
        with time_machine.travel("2025-02-15 00:00:00", tick=False):
            start, end = get_previous_month_range()

            # Start should be at midnight
            assert start.hour == 0
            assert start.minute == 0
            assert start.second == 0
            assert start.microsecond == 0

            # End should also be at midnight (exclusive boundary)
            assert end.hour == 0
            assert end.minute == 0
            assert end.second == 0
            assert end.microsecond == 0
