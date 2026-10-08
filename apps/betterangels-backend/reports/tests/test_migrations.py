"""Tests for the data migration that rebases ``next_run_at`` onto the site zone."""

import importlib
from datetime import UTC, datetime

import pytest
import time_machine
from django.apps import apps
from model_bakery import baker
from reports.models import ScheduledReport

reschedule = importlib.import_module("reports.migrations.0002_report_schedule_local_time").reschedule_active_reports

# 2026-09-01 02:00 UTC = 2026-08-31 19:00 PT: the evening when the old UTC
# schedule has already fired and the new local-midnight run has not.
DEPLOY_IN_THE_WINDOW = datetime(2026, 9, 1, 2, 0, tzinfo=UTC)


@pytest.mark.django_db
class TestRescheduleActiveReports:
    def test_future_run_keeps_its_month_and_moves_to_local_midnight(self) -> None:
        """A run that was already sent is not re-armed by the wall-clock rebase.

        Stored at 2026-10-01 00:00 UTC (= Sep 30 17:00 PT); recomputing from
        ``now`` alone would move it back to Sep 1 00:00 PT and send the month a
        second time.
        """
        report = baker.make(
            ScheduledReport,
            day_of_month=1,
            hour=0,
            next_run_at=datetime(2026, 10, 1, 0, 0, tzinfo=UTC),
        )

        with time_machine.travel(DEPLOY_IN_THE_WINDOW):
            reschedule(apps, None)

        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 10, 1, 7, 0, tzinfo=UTC)

    def test_overdue_run_stays_due_for_the_dispatcher(self) -> None:
        """An unprocessed due run is delivered late, not silently skipped."""
        report = baker.make(
            ScheduledReport,
            day_of_month=1,
            hour=0,
            next_run_at=datetime(2026, 9, 1, 0, 0, tzinfo=UTC),
        )

        with time_machine.travel(datetime(2026, 9, 3, 2, 0, tzinfo=UTC)):
            reschedule(apps, None)

        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 9, 1, 7, 0, tzinfo=UTC)

    def test_run_already_on_local_midnight_is_left_where_it_is(self) -> None:
        """Re-running the migration is a no-op for values it already rebased."""
        report = baker.make(
            ScheduledReport,
            day_of_month=1,
            hour=0,
            next_run_at=datetime(2026, 10, 1, 7, 0, tzinfo=UTC),
        )

        with time_machine.travel(datetime(2026, 9, 15, 2, 0, tzinfo=UTC)):
            reschedule(apps, None)

        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 10, 1, 7, 0, tzinfo=UTC)

    def test_inactive_reports_are_left_alone(self) -> None:
        report = baker.make(
            ScheduledReport,
            day_of_month=1,
            hour=0,
            is_active=False,
            next_run_at=datetime(2026, 10, 1, 0, 0, tzinfo=UTC),
        )

        with time_machine.travel(DEPLOY_IN_THE_WINDOW):
            reschedule(apps, None)

        report.refresh_from_db()
        assert report.next_run_at == datetime(2026, 10, 1, 0, 0, tzinfo=UTC)
