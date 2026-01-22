"""Utility functions for report generation."""

from datetime import datetime, timedelta

from django.utils import timezone


def get_previous_month_range() -> tuple[datetime, datetime]:
    """
    Calculate the date range for the previous month.

    Returns:
        A tuple of (start_date, end_date) for the previous month,
        where start_date is inclusive and end_date is exclusive.

    Example:
        If today is 2025-01-15, returns:
        (2024-12-01 00:00:00, 2025-01-01 00:00:00)
    """
    now = timezone.now()
    first_day_current = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    first_day_previous = (first_day_current - timedelta(days=1)).replace(day=1)
    return (first_day_previous, first_day_current)


def format_report_filename(
    prefix: str,
    month: int,
    year: int,
    extension: str = "csv",
) -> str:
    """
    Format a standardized filename for a report.

    Args:
        prefix: The prefix for the filename (e.g., "interaction_data")
        month: The month number (1-12)
        year: The year (e.g., 2025)
        extension: The file extension (default: "csv")

    Returns:
        A formatted filename string

    Example:
        format_report_filename("interaction_data", 12, 2025)
        # Returns: "interaction_data_12_2025.csv"
    """
    return f"{prefix}_{month:02d}_{year}.{extension}"
