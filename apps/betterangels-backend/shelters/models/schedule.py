"""Schedule model — per-day, per-type operating hours for shelters."""

import datetime

import pghistory
from common.models import BaseModel
from django.db import models
from django.db.models import UniqueConstraint
from django_choices_field import TextChoicesField
from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices

from .lookups import Demographic
from .shelter import Shelter

WEEK_MINUTES = 7 * 24 * 60  # 10080
DAILY_MINUTES = 24 * 60  # 1440


def _minutes_since_midnight(t: "datetime.time | None") -> int | None:
    """Convert a time to minutes since midnight (0–1439)."""
    if t is None:
        return None
    return t.hour * 60 + t.minute


def _duration_minutes(start_time, end_time) -> int | None:
    """Compute positive duration in minutes, handling overnight schedules.

    For overnight schedules (e.g. 6 PM – 2 AM), the modulo naturally
    produces the correct positive duration without branching.
    Returns None when either time is None.
    """
    start_m = _minutes_since_midnight(start_time)
    end_m = _minutes_since_midnight(end_time)
    if start_m is None or end_m is None:
        return None
    duration = (end_m - start_m) % DAILY_MINUTES
    return duration if duration != 0 else DAILY_MINUTES


def _start_week_minutes(day, start_time) -> int | None:
    """Compute week-minute offset for the schedule start.

    Returns ``day_index * 1440 + start_minutes`` for day-specific schedules,
    or ``start_minutes`` for every-day (day=None) schedules.
    Returns None when start_time is None.
    """
    start_m = _minutes_since_midnight(start_time)
    if start_m is None:
        return None
    if day is None:
        return start_m
    day_index = list(DayOfWeekChoices).index(day)
    return day_index * DAILY_MINUTES + start_m


@pghistory.track(
    pghistory.InsertEvent("shelter.schedule.add"),
    pghistory.UpdateEvent("shelter.schedule.update"),
    pghistory.DeleteEvent("shelter.schedule.remove"),
)
class Schedule(BaseModel):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="schedules")
    schedule_type = TextChoicesField(choices_enum=ScheduleTypeChoices, default=ScheduleTypeChoices.OPERATING)
    day = TextChoicesField(
        choices_enum=DayOfWeekChoices,
        null=True,
        blank=True,
        help_text="Day of week. Leave blank for date-range entries that apply every day.",
    )
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    # Precomputed cyclic-interval columns for branchless "is this schedule
    # active at a given datetime?" queries using modular arithmetic.
    #
    # ``start_week_minutes`` is the week-minute offset (0–10079) for
    # day-specific schedules, or the daily-minute offset (0–1439) for
    # every-day (day=None) schedules.  Null when ``start_time`` is null
    # (full-day schedule with no time window).
    #
    # ``duration_minutes`` is the positive duration in minutes, computed
    # via ``(end_m - start_m) % 1440`` so that overnight schedules
    # (e.g. 18:00–02:00 → 480 min) are represented identically to normal
    # schedules.  Null when either time is null.
    start_week_minutes = models.IntegerField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)

    # Date range — use both for a range, or set start_date == end_date for a single date
    start_date = models.DateField(
        null=True, blank=True, help_text="Start of date range (or the single date for one-day overrides)."
    )
    end_date = models.DateField(
        null=True, blank=True, help_text="End of date range. Leave blank if same as start date."
    )

    # Condition-triggered (weather, emergencies)
    condition = TextChoicesField(choices_enum=ConditionChoices, null=True, blank=True)

    # Demographic-scoped hours (e.g. women-only access windows)
    demographic = models.ForeignKey(
        Demographic, on_delete=models.SET_NULL, null=True, blank=True, related_name="schedules"
    )

    # Holiday / exception overrides
    is_exception = models.BooleanField(default=False, blank=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["shelter", "schedule_type", "day", "start_time", "start_date"],
                name="unique_schedule_per_shelter_type_day_time_date",
                nulls_distinct=False,
            ),
        ]
        ordering = ["is_exception", "schedule_type", "day", "start_time"]

    def save(self, *args: object, **kwargs: object) -> None:
        """Auto-populate ``start_week_minutes`` and ``duration_minutes``."""
        self.start_week_minutes = _start_week_minutes(self.day, self.start_time)
        self.duration_minutes = _duration_minutes(self.start_time, self.end_time)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        if self.is_exception:
            date_part = ""
            if self.start_date and self.end_date and self.start_date == self.end_date:
                date_part = str(self.start_date)
            elif self.start_date:
                date_part = f"{self.start_date} \u2013 {self.end_date or '?'}"
            else:
                date_part = "(no dates)"
            time_part = (
                f" {self.start_time.strftime('%I:%M%p')}\u2013{self.end_time.strftime('%I:%M%p')}"
                if self.start_time and self.end_time
                else " Closed all day"
            )
            return f"{self.shelter.name} - {self.get_schedule_type_display()} - Exception {date_part}{time_part}"

        day_part = self.get_day_display() if self.day else "Every day"
        label = f"{self.shelter.name} - {self.get_schedule_type_display()} - {day_part}"
        if self.start_time and self.end_time:
            return f"{label} ({self.start_time.strftime('%I:%M%p')}-{self.end_time.strftime('%I:%M%p')})"
        return label
