"""Tests for Celery tasks."""

from datetime import timedelta
from unittest.mock import MagicMock, call, patch

import pytest
import time_machine
from accounts.models import Organization
from django.utils import timezone
from model_bakery import baker
from post_office.models import Email
from reports.models import ScheduledReport
from reports.tasks import process_scheduled_reports, send_scheduled_report


@pytest.mark.django_db
class TestProcessScheduledReportsTask:
    """Tests for the process_scheduled_reports task."""

    @time_machine.travel("2025-01-15 10:30:00", tick=False)
    def test_dispatcher_finds_due_reports(self) -> None:
        """Test that the dispatcher finds reports that are due."""
        org = baker.make(Organization)
        now = timezone.now()

        # 1. Report due now (next_run_at <= now)
        due_now = baker.make(
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
        missed = baker.make(
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

        with patch("reports.tasks.send_scheduled_report") as mock_send:
            result = process_scheduled_reports.apply().get()

            # We expect "Due Now" and "Missed Yesterday" to be queued.
            assert "Queued 2 reports" in result

            assert mock_send.delay.call_count == 2
            mock_send.delay.assert_has_calls(
                [
                    call(due_now.pk),
                    call(missed.pk),
                ],
                any_order=True,
            )


@pytest.mark.django_db
class TestSendScheduledReportTask:
    """Tests for the send_scheduled_report Celery task orchestration."""

    def test_report_not_found(self) -> None:
        """Test task with non-existent report ID."""
        result = send_scheduled_report.apply(args=(99999,)).get()

        assert result["status"] == "error"
        assert "not found" in result["message"].lower()

    @patch("reports.tasks.generate_report_data")
    def test_send_report_success_flow(self, mock_generate: MagicMock) -> None:
        """Test that task calls generator and sends email."""
        # Setup mock return
        mock_generate.return_value = ("test.csv", "header,row1", {"notes_count": 5})

        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            subject_template="Subject",
            is_active=True,
            last_sent_at=None,
        )

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "success"
        assert result["notes_count"] == 5

        # Verify generator was called
        assert mock_generate.call_count == 1

        # Verify DB update
        report.refresh_from_db()
        assert report.last_sent_at is not None

        # Verify Email sent
        email = Email.objects.latest("id")
        assert email.to == ["test@example.com"]
        attachment = email.attachments.first()
        assert attachment.name == "test.csv"
        assert attachment.file.read().decode("utf-8") == "header,row1"

    @patch("reports.tasks.generate_report_data")
    def test_send_report_no_content_error(self, mock_generate: MagicMock) -> None:
        """Test handling when generator returns empty content."""
        # Simulate empty content
        mock_generate.return_value = ("test.csv", "", {})

        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "error"
        assert "No content" in result["message"]

        # Verify NO email sent
        assert Email.objects.count() == 0

    @patch("reports.tasks.generate_report_data")
    def test_send_report_generator_error(self, mock_generate: MagicMock) -> None:
        """Test handling when generator raises ValueError."""
        mock_generate.side_effect = ValueError("Invalid config")

        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)

        result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "error"
        assert "Invalid config" in result["message"]

    def test_send_report_recipient_list(self) -> None:
        """Test that recipients are correctly parsed."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com, bob@example.com",
            is_active=True,
        )

        # We don't need to check content, just that email goes to right people.
        # But we need real content generation to pass the check, or we mock it.
        # Let's mock it for speed/isolation.
        with patch("reports.tasks.generate_report_data") as mock_gen:
            mock_gen.return_value = ("a.csv", "data", {})

            result = send_scheduled_report.apply(args=(report.pk,)).get()

            assert set(result["recipients"]) == {"alice@example.com", "bob@example.com"}

            email = Email.objects.latest("id")
            assert set(email.to) == {"alice@example.com", "bob@example.com"}

    def test_send_report_templates(self) -> None:
        """Test subject and email body template formatting."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            email_body="Body {month}/{year}",
            is_active=True,
        )

        with time_machine.travel("2025-01-15 00:00:00", tick=False):
            # We mock generation again
            with patch("reports.tasks.generate_report_data") as mock_gen:
                mock_gen.return_value = ("a.csv", "data", {})

                result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["subject"] == "Subject 12/2024"

        email = Email.objects.latest("id")
        assert email.subject == "Subject 12/2024"
        assert email.message == "Body 12/2024"
