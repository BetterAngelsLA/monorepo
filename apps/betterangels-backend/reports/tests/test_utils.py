"""Tests for report utility functions."""

import time_machine
from reports.utils.report_utils import format_report_filename, get_previous_month_range


class TestGetPreviousMonthRange:
    """Tests for get_previous_month_range function."""

    @time_machine.travel("2025-01-15 10:30:00", tick=False)
    def test_january_returns_december(self) -> None:
        """Test that January returns December of previous year."""
        start, end = get_previous_month_range()

        assert start.year == 2024
        assert start.month == 12
        assert start.day == 1
        assert start.hour == 0

        assert end.year == 2025
        assert end.month == 1
        assert end.day == 1
        assert end.hour == 0

    @time_machine.travel("2025-03-15 10:30:00", tick=False)
    def test_march_returns_february(self) -> None:
        """Test that March returns February."""
        start, end = get_previous_month_range()

        assert start.year == 2025
        assert start.month == 2
        assert start.day == 1

        assert end.year == 2025
        assert end.month == 3
        assert end.day == 1

    @time_machine.travel("2025-05-31 23:59:59", tick=False)
    def test_end_of_month_returns_april(self) -> None:
        """Test that end of May returns April."""
        start, end = get_previous_month_range()

        assert start.year == 2025
        assert start.month == 4
        assert start.day == 1

        assert end.year == 2025
        assert end.month == 5
        assert end.day == 1

    @time_machine.travel("2024-02-29 12:00:00", tick=False)
    def test_leap_year_february(self) -> None:
        """Test leap year February returns January."""
        start, end = get_previous_month_range()

        assert start.year == 2024
        assert start.month == 1
        assert start.day == 1

        assert end.year == 2024
        assert end.month == 2
        assert end.day == 1

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


class TestFormatReportFilename:
    """Tests for format_report_filename function."""

    def test_basic_filename(self) -> None:
        """Test basic filename formatting."""
        result = format_report_filename("interaction_data", 12, 2025)
        assert result == "interaction_data_12_2025.csv"

    def test_single_digit_month_padded(self) -> None:
        """Test that single-digit months are zero-padded."""
        result = format_report_filename("interaction_data", 1, 2025)
        assert result == "interaction_data_01_2025.csv"

    def test_custom_extension(self) -> None:
        """Test with custom extension."""
        result = format_report_filename("report", 6, 2025, extension="xlsx")
        assert result == "report_06_2025.xlsx"

    def test_different_prefix(self) -> None:
        """Test with different prefix."""
        result = format_report_filename("monthly_summary", 12, 2025)
        assert result == "monthly_summary_12_2025.csv"
