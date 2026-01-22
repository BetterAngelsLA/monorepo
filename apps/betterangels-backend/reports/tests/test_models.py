"""Tests for ScheduledReport model."""

import pytest
from accounts.models import Organization
from django.core.exceptions import ValidationError
from model_bakery import baker
from redbeat import RedBeatSchedulerEntry  # type: ignore[import-untyped]
from reports.models import ScheduledReport


@pytest.mark.django_db
class TestScheduledReportModel:
    """Tests for the ScheduledReport model."""

    def test_create_scheduled_report(self) -> None:
        """Test creating a basic scheduled report."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=1,
            hour=0,
        )

        assert report.name == "Test Report"
        assert report.organization == org
        assert report.frequency == ScheduledReport.Frequency.MONTHLY
        assert report.is_active is True

    def test_string_representation(self) -> None:
        """Test the __str__ method."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            name="Monthly Report",
            organization=org,
            frequency=ScheduledReport.Frequency.MONTHLY,
            recipients="test@example.com",
        )

        assert str(report) == "Monthly Report (Monthly)"

    def test_get_recipient_list(self) -> None:
        """Test parsing recipients into a list."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com, bob@example.com, charlie@example.com",
        )

        recipients = report.get_recipient_list()
        assert len(recipients) == 3
        assert "alice@example.com" in recipients
        assert "bob@example.com" in recipients
        assert "charlie@example.com" in recipients

    def test_get_recipient_list_with_whitespace(self) -> None:
        """Test parsing recipients with irregular whitespace."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="  alice@example.com  ,bob@example.com,  charlie@example.com  ",
        )

        recipients = report.get_recipient_list()
        assert len(recipients) == 3
        assert all(email == email.strip() for email in recipients)

    def test_validate_email_list_valid(self) -> None:
        """Test validation with valid email addresses."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com, bob@example.com",
        )

        # Should not raise
        report.full_clean()

    def test_validate_email_list_invalid(self) -> None:
        """Test validation with invalid email addresses."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="alice@example.com, invalid-email, bob@example.com",
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "recipients" in exc_info.value.message_dict

    def test_validate_email_list_empty(self) -> None:
        """Test validation with empty recipients."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="",
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "recipients" in exc_info.value.message_dict

    def test_validate_day_of_month_too_low(self) -> None:
        """Test validation with day_of_month < 1."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            day_of_month=0,
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "day_of_month" in exc_info.value.message_dict

    def test_validate_day_of_month_too_high(self) -> None:
        """Test validation with day_of_month > 28."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            day_of_month=29,
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "day_of_month" in exc_info.value.message_dict

    def test_validate_hour_too_low(self) -> None:
        """Test validation with hour < 0."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            hour=-1,
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "hour" in exc_info.value.message_dict

    def test_validate_hour_too_high(self) -> None:
        """Test validation with hour > 23."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            hour=24,
        )

        with pytest.raises(ValidationError) as exc_info:
            report.full_clean()

        assert "hour" in exc_info.value.message_dict

    def test_get_schedule_name(self) -> None:
        """Test the _get_schedule_name method."""
        org = baker.make(Organization)
        report = baker.make(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
        )

        schedule_name = report._get_schedule_name()
        assert schedule_name == f"scheduled-report-{report.pk}"

    def test_save_creates_celery_schedule(self) -> None:
        """Test that saving an active report creates a Celery Beat schedule."""
        org = baker.make(Organization)
        report = ScheduledReport(
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=1,
            hour=0,
            is_active=True,
        )
        report.save()

        # Check that the schedule was created
        schedule_name = report._get_schedule_name()
        entry = RedBeatSchedulerEntry.from_key(schedule_name)

        assert entry.name == schedule_name
        assert entry.task == "reports.tasks.send_scheduled_report"
        assert entry.args == (report.pk,)

        # Clean up
        entry.delete()

    def test_save_inactive_removes_celery_schedule(self) -> None:
        """Test that saving an inactive report removes the Celery Beat schedule."""
        org = baker.make(Organization)
        report = ScheduledReport(
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=1,
            hour=0,
            is_active=True,
        )
        report.save()

        # Verify schedule exists
        schedule_name = report._get_schedule_name()
        entry = RedBeatSchedulerEntry.from_key(schedule_name)
        assert entry is not None

        # Deactivate report
        report.is_active = False
        report.save()

        # Check that schedule was removed
        with pytest.raises(KeyError):
            RedBeatSchedulerEntry.from_key(schedule_name)

    def test_delete_removes_celery_schedule(self) -> None:
        """Test that deleting a report removes the Celery Beat schedule."""
        org = baker.make(Organization)
        report = ScheduledReport(
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=1,
            hour=0,
            is_active=True,
        )
        report.save()

        schedule_name = report._get_schedule_name()

        # Verify schedule exists
        entry = RedBeatSchedulerEntry.from_key(schedule_name)
        assert entry is not None

        # Delete report
        report.delete()

        # Check that schedule was removed
        with pytest.raises(KeyError):
            RedBeatSchedulerEntry.from_key(schedule_name)

    def test_update_schedule_changes_time(self) -> None:
        """Test that updating a report updates the Celery Beat schedule."""
        org = baker.make(Organization)
        report = ScheduledReport(
            name="Test Report",
            organization=org,
            recipients="test@example.com",
            frequency=ScheduledReport.Frequency.MONTHLY,
            day_of_month=1,
            hour=0,
            is_active=True,
        )
        report.save()

        schedule_name = report._get_schedule_name()
        entry = RedBeatSchedulerEntry.from_key(schedule_name)
        original_schedule = entry.schedule

        # Update report
        report.day_of_month = 15
        report.hour = 12
        report.save()

        # Check that schedule was updated
        entry = RedBeatSchedulerEntry.from_key(schedule_name)
        updated_schedule = entry.schedule

        assert updated_schedule != original_schedule
        assert entry.schedule.hour == {12}
        assert entry.schedule.day_of_month == {15}

        # Clean up
        report.delete()
