"""Tests for schedule manager."""

import pytest
from redbeat import RedBeatSchedulerEntry  # type: ignore[import-untyped]
from reports.utils.schedule_manager import ScheduleManager


class TestScheduleManager:
    """Tests for the ScheduleManager class."""

    def setup_method(self) -> None:
        """Set up test fixtures."""
        self.manager = ScheduleManager()
        self.test_report_ids: list[int] = []

    def teardown_method(self) -> None:
        """Clean up test schedules."""
        for report_id in self.test_report_ids:
            try:
                schedule_name = self.manager.get_schedule_name(report_id)
                entry = RedBeatSchedulerEntry.from_key(schedule_name)
                entry.delete()
            except KeyError:
                pass

    def test_get_schedule_name(self) -> None:
        """Test generating a schedule name."""
        name = self.manager.get_schedule_name(123)
        assert name == "scheduled-report-123"

    def test_get_schedule_name_with_custom_prefix(self) -> None:
        """Test generating a schedule name with custom prefix."""
        manager = ScheduleManager(schedule_prefix="custom-prefix")
        name = manager.get_schedule_name(456)
        assert name == "custom-prefix-456"

    def test_create_schedule(self) -> None:
        """Test creating a new schedule."""
        report_id = 999
        self.test_report_ids.append(report_id)

        entry = self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=12,
            day_of_month=15,
        )

        assert entry.name == "scheduled-report-999"
        assert entry.task == "reports.tasks.send_scheduled_report"
        assert entry.args == (999,)
        assert entry.schedule.hour == {12}
        assert entry.schedule.day_of_month == {15}

    def test_update_existing_schedule(self) -> None:
        """Test updating an existing schedule."""
        report_id = 1000
        self.test_report_ids.append(report_id)

        # Create initial schedule
        self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=0,
            day_of_month=1,
        )

        # Update schedule
        entry = self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=18,
            day_of_month=28,
        )

        assert entry.schedule.hour == {18}
        assert entry.schedule.day_of_month == {28}

    def test_remove_schedule_exists(self) -> None:
        """Test removing an existing schedule."""
        report_id = 1001
        self.test_report_ids.append(report_id)

        # Create schedule
        self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=0,
            day_of_month=1,
        )

        # Remove schedule
        result = self.manager.remove_schedule(report_id)

        assert result is True

        # Verify it's gone
        with pytest.raises(KeyError):
            schedule_name = self.manager.get_schedule_name(report_id)
            RedBeatSchedulerEntry.from_key(schedule_name)

    def test_remove_schedule_not_exists(self) -> None:
        """Test removing a non-existent schedule."""
        report_id = 9999
        result = self.manager.remove_schedule(report_id)
        assert result is False

    def test_schedule_exists_true(self) -> None:
        """Test checking if a schedule exists when it does."""
        report_id = 1002
        self.test_report_ids.append(report_id)

        # Create schedule
        self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=0,
            day_of_month=1,
        )

        assert self.manager.schedule_exists(report_id) is True

    def test_schedule_exists_false(self) -> None:
        """Test checking if a schedule exists when it doesn't."""
        report_id = 9998
        assert self.manager.schedule_exists(report_id) is False

    def test_get_schedule_exists(self) -> None:
        """Test getting an existing schedule."""
        report_id = 1003
        self.test_report_ids.append(report_id)

        # Create schedule
        self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=8,
            day_of_month=10,
        )

        entry = self.manager.get_schedule(report_id)

        assert entry is not None
        assert entry.name == "scheduled-report-1003"
        assert entry.task == "reports.tasks.send_scheduled_report"

    def test_get_schedule_not_exists(self) -> None:
        """Test getting a non-existent schedule."""
        report_id = 9997
        entry = self.manager.get_schedule(report_id)
        assert entry is None

    def test_create_with_custom_args(self) -> None:
        """Test creating a schedule with custom task arguments."""
        report_id = 1004
        self.test_report_ids.append(report_id)

        custom_args = (report_id, "extra_arg")

        entry = self.manager.create_or_update_schedule(
            report_id=report_id,
            task_name="reports.tasks.send_scheduled_report",
            hour=0,
            day_of_month=1,
            task_args=custom_args,
        )

        assert entry.args == custom_args
