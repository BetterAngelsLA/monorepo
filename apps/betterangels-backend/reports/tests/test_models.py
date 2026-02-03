"""Tests for ScheduledReport model."""

import pytest
from accounts.models import Organization
from django.core.exceptions import ValidationError
from model_bakery import baker
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

    def test_get_recipient_list_various_separators(self) -> None:
        """Test parsing recipients with various separators (comma, semicolon, newline, space)."""
        org = baker.make(Organization)

        # Test cases with different separators
        scenarios = [
            "a@b.com,c@d.com",
            "a@b.com;c@d.com",
            "a@b.com c@d.com",
            "a@b.com\nc@d.com",
            "a@b.com, c@d.com; e@f.com\ng@h.com",
            "  a@b.com  ,  c@d.com  ",
        ]

        for recipients_str in scenarios:
            report = baker.make(
                ScheduledReport,
                organization=org,
                recipients=recipients_str,
            )
            recipients = report.get_recipient_list()
            assert len(recipients) >= 2
            assert "a@b.com" in recipients
            assert "c@d.com" in recipients

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
        """Test validation with day_of_month > 31."""
        org = baker.make(Organization)
        report = baker.prepare(
            ScheduledReport,
            organization=org,
            recipients="test@example.com",
            day_of_month=32,
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
