"""Tests for report services."""

from datetime import UTC, date, datetime
from zoneinfo import ZoneInfo

import pytest
import time_machine
from accounts.models import OrgTypeChoices, Organization, OrganizationProfile
from django.utils import timezone
from model_bakery import baker
from notes.models import Note
from pytest_django.fixtures import SettingsWrapper
from reports.calendar import report_calendar_time_zone
from reports.models import ScheduledReport
from reports.selectors import report_default_date_range
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
            start_date, end_date = get_previous_month_range(as_of=timezone.localdate())

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
    """Report ranges are cut on the active calendar's days, not UTC's.

    Every case below asserts a boundary that only exists west of UTC, so the site
    calendar is pinned rather than inherited from the environment's ``TIME_ZONE``.
    """

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

    def test_csv_row_is_labeled_with_the_date_it_was_filtered_on(self) -> None:
        """The exported date must match the boundary the note was filtered on."""
        org = baker.make(Organization)
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 1, 0, tzinfo=UTC))

        _, content, _ = generate_report_data(report, date(2025, 1, 1), date(2025, 1, 31))

        assert "01/31/2025" in content
        assert "02/01/2025" not in content


@pytest.mark.django_db
class TestCalendarBelongsToTheOrganization:
    """The calendar a period is cut on is the organization's, not the deployment's.

    Stored rather than read from ``settings`` at call time: the setting is a
    stand-in for a single operating region, and moving it silently redefines every
    period the organization has ever reported on.
    """

    def test_the_orgs_calendar_wins_over_the_sites(self, settings: SettingsWrapper) -> None:
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="Asia/Tokyo",
        )

        assert report_calendar_time_zone(org) == ZoneInfo("Asia/Tokyo")

    def test_an_org_that_has_not_named_one_falls_back_to_the_site(self, settings: SettingsWrapper) -> None:
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)

        assert report_calendar_time_zone(org) == ZoneInfo("America/Los_Angeles")

    def test_a_boundary_is_cut_on_the_orgs_calendar_not_the_sites(self, settings: SettingsWrapper) -> None:
        """An org a day ahead of the site still reports its own month.

        2025-02-01 05:30 UTC is 31 January in Los Angeles but 1 February in Tokyo,
        so an org on Tokyo's calendar cannot have that note in its January report.
        """
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="Asia/Tokyo",
        )
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 5, 30, tzinfo=UTC))

        _, content, meta = generate_report_data(report, date(2025, 1, 1), date(2025, 1, 31))

        assert meta["notes_count"] == 0
        assert "02/01/2025" not in content

    def test_the_row_label_follows_the_orgs_calendar(self, settings: SettingsWrapper) -> None:
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="Asia/Tokyo",
        )
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 5, 30, tzinfo=UTC))

        _, content, meta = generate_report_data(report, date(2025, 2, 1), date(2025, 2, 28))

        assert meta["notes_count"] == 1
        assert "02/01/2025" in content

    def test_the_default_range_is_the_current_month_on_the_orgs_calendar(self, settings: SettingsWrapper) -> None:
        """Nothing else asserts the value this returns — the GraphQL default depends on it.

        The site sits on a calendar a day behind, so the two disagree about which
        month "today" is at this instant.
        """
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="Asia/Tokyo",
        )

        # 2026-08-31 16:00 UTC is still August in Los Angeles, already September in Tokyo.
        with time_machine.travel("2026-08-31 16:00:00", tick=False):
            assert report_default_date_range(org=org) == (date(2026, 9, 1), date(2026, 9, 30))

        with time_machine.travel("2026-08-31 06:00:00", tick=False):
            assert report_default_date_range(org=org) == (date(2026, 8, 1), date(2026, 8, 31))

    def test_an_unusable_stored_zone_falls_back_instead_of_raising(self, settings: SettingsWrapper) -> None:
        """A bad value cannot be stored through the admin, but can through the ORM.

        ``validate_iana_time_zone`` runs only via ``full_clean``, so a data import or
        raw SQL can leave a name ``zoneinfo`` cannot resolve.  Raising here would 500
        the summary, the export and the scheduled email for that org every time.
        """
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        profile = baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="America/Los_Angeles",
        )
        # Bypasses the validator, which is the only way this reaches the database.
        OrganizationProfile.objects.filter(pk=profile.pk).update(time_zone="Not/AZone")
        # The org instance still holds the pre-update profile; drop it so the
        # resolver actually re-reads the row.
        org._state.fields_cache.clear()

        assert report_calendar_time_zone(org) == ZoneInfo("America/Los_Angeles")

    def test_an_unusable_stored_zone_does_not_break_a_report(self, settings: SettingsWrapper) -> None:
        """The fallback has to reach the report itself, not just the resolver."""
        settings.TIME_ZONE = "America/Los_Angeles"
        org = baker.make(Organization)
        profile = baker.make(
            OrganizationProfile,
            organization=org,
            org_types=[OrgTypeChoices.OUTREACH],
            time_zone="America/Los_Angeles",
        )
        OrganizationProfile.objects.filter(pk=profile.pk).update(time_zone="Not/AZone")
        org._state.fields_cache.clear()
        report = baker.make(ScheduledReport, organization=org)
        baker.make(Note, organization=org, interacted_at=datetime(2025, 2, 1, 1, 0, tzinfo=UTC))

        _, _, meta = generate_report_data(report, date(2025, 1, 1), date(2025, 1, 31))

        assert meta["notes_count"] == 1
