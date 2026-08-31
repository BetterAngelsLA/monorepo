"""Tests for report services."""

from datetime import UTC, date, datetime

import pytest
import time_machine
from accounts.models import Organization
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from reports.models import ScheduledReport
from reports.selectors import local_today
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
            # Case 5: Year boundary (runs in Jan, reports Dec prev year).
            # 08:00 UTC is midnight in Los Angeles, so this is genuinely January there.
            (
                "2025-01-01 08:00:00",
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
            start_date, end_date = get_previous_month_range(as_of=local_today())

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

        start = date(2024, 12, 1)
        end = date(2024, 12, 31)

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
        "as_of, expected_start, expected_end",
        [
            # January -> December previous year
            (date(2025, 1, 15), date(2024, 12, 1), date(2024, 12, 31)),
            # March -> February
            (date(2025, 3, 15), date(2025, 2, 1), date(2025, 2, 28)),
            # End of month -> previous month
            (date(2025, 5, 31), date(2025, 4, 1), date(2025, 4, 30)),
            # Leap year February -> January
            (date(2024, 2, 29), date(2024, 1, 1), date(2024, 1, 31)),
        ],
    )
    def test_month_ranges(self, as_of: date, expected_start: date, expected_end: date) -> None:
        """Parameterized test for month range calculation."""
        assert get_previous_month_range(as_of=as_of) == (expected_start, expected_end)

    def test_both_bounds_are_inclusive(self) -> None:
        """The range covers the whole previous month, first day through last."""
        assert get_previous_month_range(as_of=date(2025, 2, 15)) == (date(2025, 1, 1), date(2025, 1, 31))


@pytest.mark.django_db
class TestReportTimeZoneBoundaries:
    """Report ranges are cut on the operating time zone's calendar days, not UTC's."""

    def test_late_evening_note_counts_in_the_month_it_was_logged(self) -> None:
        """A note at 5pm on 31 January in Los Angeles belongs to January, not February."""
        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)
        # 2025-02-01 01:00 UTC is 2025-01-31 17:00 in Los Angeles.
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 1, 0, tzinfo=UTC))

        _, _, meta = generate_report_data(report, date(2025, 1, 1), date(2025, 1, 31))

        assert meta["notes_count"] == 1

    def test_that_note_is_excluded_from_the_following_month(self) -> None:
        """The same note must not also be counted in February."""
        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 1, 0, tzinfo=UTC))

        _, _, meta = generate_report_data(report, date(2025, 2, 1), date(2025, 2, 28))

        assert meta["notes_count"] == 0

    def test_csv_row_is_labelled_with_the_date_it_was_filtered_on(self) -> None:
        """The exported date must match the boundary the note was filtered on."""
        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 1, 0, tzinfo=UTC))

        _, content, _ = generate_report_data(report, date(2025, 1, 1), date(2025, 1, 31))

        assert "01/31/2025" in content
        assert "02/01/2025" not in content
