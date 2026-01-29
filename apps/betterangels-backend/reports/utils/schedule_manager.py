"""Schedule management utilities for RedBeat integration."""

from typing import Optional

from celery.schedules import crontab
from redbeat import RedBeatSchedulerEntry  # type: ignore[import-untyped]


class ScheduleManager:
    """Manages Celery Beat schedule entries using RedBeat."""

    def __init__(self, schedule_prefix: str = "scheduled-report"):
        """
        Initialize the schedule manager.

        Args:
            schedule_prefix: Prefix for schedule names (default: "scheduled-report")
        """
        self.schedule_prefix = schedule_prefix

    def get_schedule_name(self, report_id: int) -> str:
        """
        Generate a unique schedule name for a report.

        Args:
            report_id: The ID of the report

        Returns:
            A unique schedule name string
        """
        return f"{self.schedule_prefix}-{report_id}"

    def _get_schedule_entry(self, report_id: int) -> Optional[RedBeatSchedulerEntry]:
        """
        Helper method to get a schedule entry, returning None if not found.

        Args:
            report_id: The ID of the report

        Returns:
            The RedBeatSchedulerEntry if it exists, None otherwise
        """
        schedule_name = self.get_schedule_name(report_id)
        try:
            return RedBeatSchedulerEntry.from_key(schedule_name)
        except KeyError:
            return None

    def create_or_update_schedule(
        self,
        report_id: int,
        task_name: str,
        hour: int,
        day_of_month: int,
        task_args: Optional[tuple] = None,
    ) -> RedBeatSchedulerEntry:
        """
        Create or update a Celery Beat schedule entry.

        Args:
            report_id: The ID of the report
            task_name: The full task name (e.g., "reports.tasks.send_scheduled_report")
            hour: Hour of day to run (0-23)
            day_of_month: Day of month to run (1-31)
            task_args: Optional tuple of arguments to pass to the task

        Returns:
            The created or updated RedBeatSchedulerEntry
        """
        schedule_name = self.get_schedule_name(report_id)
        schedule = crontab(hour=hour, day_of_month=day_of_month)

        entry = RedBeatSchedulerEntry(
            name=schedule_name,
            task=task_name,
            schedule=schedule,
            args=task_args or (report_id,),
            app=None,
        )
        entry.save()
        return entry

    def remove_schedule(self, report_id: int) -> bool:
        """
        Remove a Celery Beat schedule entry.

        Args:
            report_id: The ID of the report

        Returns:
            True if the schedule was removed, False if it didn't exist
        """
        entry = self._get_schedule_entry(report_id)
        if entry:
            entry.delete()
            return True
        return False

    def schedule_exists(self, report_id: int) -> bool:
        """
        Check if a schedule entry exists for a report.

        Args:
            report_id: The ID of the report

        Returns:
            True if the schedule exists, False otherwise
        """
        return self._get_schedule_entry(report_id) is not None

    def get_schedule(self, report_id: int) -> Optional[RedBeatSchedulerEntry]:
        """
        Get the schedule entry for a report.

        Args:
            report_id: The ID of the report

        Returns:
            The RedBeatSchedulerEntry if it exists, None otherwise
        """
        return self._get_schedule_entry(report_id)
