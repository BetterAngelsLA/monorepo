"""Tests for Celery tasks."""

from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock, call, patch

import pytest
import time_machine
from django.utils import timezone
from model_bakery import baker
from post_office.models import Email

from accounts.models import Organization, OrganizationProfile, OrgTypeChoices
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
                    call(due_now.pk, due_at=due_now.next_run_at),
                    call(missed.pk, due_at=missed.next_run_at),
                ],
                any_order=True,
            )


@pytest.mark.django_db
class TestSendScheduledReportTask:
    """Tests for the send_scheduled_report Celery task orchestration."""

    @pytest.fixture(autouse=True)
    def _use_in_memory_storage(self, settings):  # type: ignore[no-untyped-def]
        """Use in-memory storage so email attachments don't hit S3."""
        settings.STORAGES = {"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}}

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
        """Test that recipients are correctly parsed with mixed separators."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com; bob@example.com\ncharlie@example.com",
            is_active=True,
        )

        # We don't need to check content, just that email goes to right people.
        # But we need real content generation to pass the check, or we mock it.
        # Let's mock it for speed/isolation.
        with patch("reports.tasks.generate_report_data") as mock_gen:
            mock_gen.return_value = ("a.csv", "data", {})

            result = send_scheduled_report.apply(args=(report.pk,)).get()

            expected_recipients = {"alice@example.com", "bob@example.com", "charlie@example.com"}
            assert set(result["recipients"]) == expected_recipients

            email = Email.objects.latest("id")
            assert set(email.to) == expected_recipients

    def test_a_late_run_still_reports_the_month_its_schedule_was_due_after(self) -> None:
        """When the job runs must not decide what it contains.

        A schedule due 1 September but retried on 2 October has to email August.
        Taken from the clock instead it emails September, with a September subject,
        and August is never sent at all.
        """
        report = baker.make(
            ScheduledReport,
            organization=baker.make(Organization),
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),  # 1 September 00:00 in Los Angeles
        )

        with time_machine.travel("2026-10-02 12:00:00", tick=False):
            with patch("reports.tasks.generate_report_data") as mock_gen:
                mock_gen.return_value = ("a.csv", "data", {})

                result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["subject"] == "Subject 08/2026"
        assert mock_gen.call_args.args[1:] == (date(2026, 8, 1), date(2026, 8, 31))

        # Rescheduled from the run just serviced, not from "now".  Anchored on the
        # clock it would jump to November, and September's run — due 1 October —
        # would never be dispatched at all.
        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 10, 1, 7, 0, tzinfo=UTC)

    def test_a_run_that_fails_to_generate_does_not_lose_the_period(self) -> None:
        """Content errors return before the claim, so the dispatcher retries.

        The claim is the only thing that marks a period serviced; if it ran before
        generation, a transient generation failure would burn the month silently.
        """
        report = baker.make(
            ScheduledReport,
            organization=baker.make(Organization),
            recipients="test@example.com",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),
        )

        with patch("reports.tasks.generate_report_data", side_effect=ValueError("bad config")):
            result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["status"] == "error"
        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 9, 1, 7, 0, tzinfo=UTC)
        assert report.last_sent_at is None

    def test_a_duplicate_dispatch_does_not_advance_the_schedule_twice(self) -> None:
        """The claim is conditional on the row still sitting at the due instant.

        Sequential dispatches exercise the guard; this asserts the *basis* of it —
        that the second claim matches no row once the first has moved it, which is
        what makes the advance safe between workers rather than just between calls.
        """
        report = baker.make(
            ScheduledReport,
            organization=baker.make(Organization),
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),
        )
        due_at = report.next_run_at
        assert due_at is not None

        with (
            patch("reports.tasks.generate_report_data") as mock_gen,
            patch("reports.tasks.send_report_email") as mock_send_email,
        ):
            mock_gen.return_value = ("a.csv", "data", {})
            first = send_scheduled_report.apply(args=(report.pk,), kwargs={"due_at": due_at}).get()
            second = send_scheduled_report.apply(args=(report.pk,), kwargs={"due_at": due_at}).get()

        assert first["status"] == "success"
        assert second["status"] == "skipped"
        assert mock_send_email.call_count == 1
        report.refresh_from_db()
        # Advanced by exactly one period, not two.
        assert report.next_run_at == datetime(2026, 10, 1, 7, 0, tzinfo=UTC)

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
            # Due 1 January 2025, locally — the run this send is servicing.
            next_run_at=datetime(2025, 1, 1, 8, 0, tzinfo=UTC),
        )

        with (
            patch("reports.tasks.generate_report_data") as mock_gen,
            patch("reports.tasks.send_report_email") as mock_send_email,
        ):
            mock_gen.return_value = ("a.csv", "data", {})

            result = send_scheduled_report.apply(args=(report.pk,)).get()

        assert result["subject"] == "Subject 12/2024"

        # Verify send_report_email received correctly formatted template values
        mock_send_email.assert_called_once()
        call_args = mock_send_email.call_args
        assert call_args.kwargs["subject"] == "Subject 12/2024"
        # month and year are positional args [3] and [4]
        assert call_args.args[3] == "12"
        assert call_args.args[4] == "2024"

    def test_a_second_dispatch_for_the_same_period_is_discarded(self) -> None:
        """Two dispatches for one due instant must email that period once.

        The dispatcher handed both the same due instant.  The first send advances
        ``next_run_at``; the second reads the advanced schedule, which is what used to
        move its period a month forward and email September alongside August.
        """
        report = baker.make(
            ScheduledReport,
            organization=baker.make(Organization),
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),  # 1 September 00:00 in Los Angeles
        )
        due_at = report.next_run_at
        assert due_at is not None

        with (
            patch("reports.tasks.generate_report_data") as mock_gen,
            patch("reports.tasks.send_report_email") as mock_send_email,
        ):
            mock_gen.return_value = ("a.csv", "data", {})

            first = send_scheduled_report.apply(args=(report.pk,), kwargs={"due_at": due_at}).get()
            second = send_scheduled_report.apply(args=(report.pk,), kwargs={"due_at": due_at}).get()

        assert first["subject"] == "Subject 08/2026"
        # The duplicate is discarded rather than re-sent for the month after.
        assert second["status"] == "skipped"
        assert mock_send_email.call_count == 1

    def test_a_stale_dispatch_cannot_move_the_period_forward(self) -> None:
        """A task drained after the schedule advanced still reports the month it was due after.

        The message carries the due instant read at dispatch time, so the value the
        task finds on the row cannot rewrite the period it covers.
        """
        report = baker.make(
            ScheduledReport,
            organization=baker.make(Organization),
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),
        )
        due_at = report.next_run_at
        assert due_at is not None

        # Another run serviced the schedule while this message sat in the broker.
        report.next_run_at = datetime(2026, 10, 1, 7, 0, tzinfo=UTC)
        report.save(update_fields=["next_run_at"])

        with (
            patch("reports.tasks.generate_report_data") as mock_gen,
            patch("reports.tasks.send_report_email") as mock_send_email,
        ):
            mock_gen.return_value = ("a.csv", "data", {})

            result = send_scheduled_report.apply(args=(report.pk,), kwargs={"due_at": due_at}).get()

        # The claim is what skips, and it sits after generation but before the send.
        assert result["status"] == "skipped"
        mock_send_email.assert_not_called()
        assert Email.objects.count() == 0
        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 10, 1, 7, 0, tzinfo=UTC)

    def test_a_send_uses_the_organizations_calendar_not_the_sites(self, settings) -> None:  # type: ignore[no-untyped-def]
        """One due instant is a different period for an org that runs a day ahead.

        2026-09-01 07:00 UTC is 1 September in Los Angeles but 16:00 on 31 August
        in Tokyo, so the month it reports on is not the same.  Reading the site's
        calendar would send a Tokyo org a month that has not finished yet.
        """
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="Asia/Tokyo",
        )
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            subject_template="Subject {month}/{year}",
            is_active=True,
            next_run_at=datetime(2026, 9, 1, 7, 0, tzinfo=UTC),
        )

        with (
            patch("reports.tasks.generate_report_data") as mock_gen,
            patch("reports.tasks.send_report_email"),
        ):
            mock_gen.return_value = ("a.csv", "data", {})
            result = send_scheduled_report.apply(args=(report.pk,)).get()

        # August, because on the org's calendar the run was due on 31 August.
        assert result["subject"] == "Subject 08/2026"
        assert mock_gen.call_args.args[1:] == (date(2026, 8, 1), date(2026, 8, 31))

        # Rescheduled from the run just serviced, on the org's calendar: the next
        # Tokyo midnight on the 1st, which is 30 September UTC.
        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 9, 30, 15, 0, tzinfo=UTC)
