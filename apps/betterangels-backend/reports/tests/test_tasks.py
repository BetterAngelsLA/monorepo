"""Tests for Celery tasks."""

from datetime import datetime, timedelta

import pytest
import time_machine
from accounts.models import Organization
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from reports.models import ScheduledReport
from reports.tasks import (
    get_previous_month_range,
    process_scheduled_reports,
    send_scheduled_report,
)


@pytest.mark.django_db
class TestProcessScheduledReportsTask:
    """Tests for the process_scheduled_reports task."""

    @time_machine.travel("2025-01-15 10:30:00", tick=False)
    def test_dispatcher_finds_due_reports(self) -> None:
        """Test that the dispatcher finds reports that are due."""
        org = baker.make(Organization)
        now = timezone.now()

        # 1. Report due now (next_run_at <= now)
        baker.make(
            ScheduledReport,
            name="Due Now",
            organization=org,
            recipients="test@example.com",
            is_active=True,
            next_run_at=now - timedelta(minutes=1),
        )

        # 2. Report due later (next_run_at > now)
        baker.make(
            ScheduledReport,
            name="Future",
            organization=org,
            is_active=True,
            next_run_at=now + timedelta(hours=1),
        )

        # 3. Report due yesterday (Catch-up)
        baker.make(
            ScheduledReport,
            name="Missed Yesterday",
            organization=org,
            is_active=True,
            next_run_at=now - timedelta(days=1),
        )

        # 4. Inactive report (even if due)
        baker.make(
            ScheduledReport,
            name="Inactive",
            organization=org,
            is_active=False,
            next_run_at=now - timedelta(minutes=1),
        )

        # We need to mock the delay call to count invocations
        # Since process_scheduled_reports is a shared_task, calling .apply() executes it synchronously.
        # We check the return string which counts queued reports.

        result = process_scheduled_reports.apply().get()

        # We expect "Due Now" and "Missed Yesterday" to be queued.
        assert "Queued 2 reports" in result


@pytest.mark.django_db
class TestSendScheduledReportTask:
    """Tests for the send_scheduled_report Celery task."""

    def test_report_not_found(self) -> None:
        """Test task with non-existent report ID."""
        result = send_scheduled_report.apply(args=(99999,)).get()

        assert result["status"] == "error"
        assert "not found" in result["message"].lower()

    @time_machine.travel("2025-01-15 10:00:00", tick=False)
    def test_send_report_with_no_notes(self) -> None:
        """Test sending a report when there are no notes for the period."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            is_active=True,
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["notes_count"] == 0
        assert result["month"] == "12"
        assert result["year"] == "2024"

    @time_machine.travel("2025-01-15 10:00:00", tick=False)
    def test_send_report_with_notes_in_range(self) -> None:
        """Test sending a report with notes in the previous month."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            subject_template="Report for {month}/{year}",
            is_active=True,
        )

        # Create notes in December 2024 (previous month)
        for day in [1, 15, 31]:
            baker.make(
                Note,
                organization=org,
                interacted_at=timezone.make_aware(datetime(2024, 12, day, 12, 0, 0)),
            )

        # Create notes in January 2025 (current month - should be excluded)
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 1, 1, 12, 0, 0)),
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["notes_count"] == 3
        assert result["month"] == "12"
        assert result["year"] == "2024"
        assert result["subject"] == "Report for 12/2024"

    @time_machine.travel("2025-01-15 10:00:00", tick=False)
    def test_send_report_filters_by_organization(self) -> None:
        """Test that report only includes notes from its organization."""
        org1 = baker.make(Organization)
        org2 = baker.make(Organization)

        report = baker.make(
            ScheduledReport,
            organization=org1,
            recipients="test@example.com",
            is_active=True,
        )

        # Create notes for org1 (should be included)
        baker.make(
            Note,
            organization=org1,
            interacted_at=timezone.make_aware(datetime(2024, 12, 15, 12, 0, 0)),
            _quantity=3,
        )

        # Create notes for org2 (should be excluded)
        baker.make(
            Note,
            organization=org2,
            interacted_at=timezone.make_aware(datetime(2024, 12, 15, 12, 0, 0)),
            _quantity=2,
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["notes_count"] == 3

    @time_machine.travel("2025-03-15 10:00:00", tick=False)
    def test_send_report_february_date_range(self) -> None:
        """Test date range calculation for February."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            is_active=True,
        )

        # Create notes in February 2025
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2025, 2, 15, 12, 0, 0)),
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["month"] == "02"
        assert result["year"] == "2025"

    def test_send_report_updates_last_sent_at(self) -> None:
        """Test that last_sent_at is updated after sending."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            is_active=True,
            last_sent_at=None,
        )

        assert report.last_sent_at is None

        send_scheduled_report.apply(args=(report.pk,)).get()

        report.refresh_from_db()
        assert report.last_sent_at is not None

    def test_send_report_recipient_list(self) -> None:
        """Test that recipients are correctly parsed."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com, bob@example.com, charlie@example.com",
            is_active=True,
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert len(result["recipients"]) == 3
        assert "alice@example.com" in result["recipients"]
        assert "bob@example.com" in result["recipients"]
        assert "charlie@example.com" in result["recipients"]

    def test_send_report_subject_template(self) -> None:
        """Test that subject template is correctly formatted."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            subject_template="Custom Report for {month}/{year}",
            is_active=True,
        )

        with time_machine.travel("2025-01-15 00:00:00", tick=False):
            result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["subject"] == "Custom Report for 12/2024"

    def test_send_report_email_body_template(self) -> None:
        """Test that email body template includes month/year."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            email_body="Data for {month}/{year} attached.",
            is_active=True,
        )

        # Task should succeed (email body is used internally)
        with time_machine.travel("2025-01-15 00:00:00", tick=False):
            result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"

    @time_machine.travel("2025-01-01 00:00:00", tick=False)
    def test_send_report_year_boundary(self) -> None:
        """Test report at year boundary (January should get December of previous year)."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            is_active=True,
        )

        # Create note in December 2024
        baker.make(
            Note,
            organization=org,
            interacted_at=timezone.make_aware(datetime(2024, 12, 15, 12, 0, 0)),
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["month"] == "12"
        assert result["year"] == "2024"

    def test_send_report_returns_correct_info(self) -> None:
        """Test that task returns all expected information."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            is_active=True,
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert "status" in result
        assert "report_id" in result
        assert "report_name" in result
        assert "notes_count" in result
        assert "recipients" in result
        assert "subject" in result
        assert "month" in result
        assert "year" in result

        assert result["report_id"] == report.pk
        assert result["report_name"] == "Test Report"


class TestGetPreviousMonthRange:
    """Tests for get_previous_month_range function (helper in tasks.py)."""

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
