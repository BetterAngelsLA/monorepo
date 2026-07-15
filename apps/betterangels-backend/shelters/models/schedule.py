"""Schedule model — per-day, per-type operating hours for shelters."""

import pghistory
from common.models import BaseModel
from django.db import models
from django.db.models import Case, ExpressionWrapper, F, Q, UniqueConstraint, Value, When
from django.db.models.functions import Cast, Coalesce, Extract, Mod, NullIf
from django_choices_field import TextChoicesField
from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices

from .lookups import Demographic
from .shelter import Shelter

DAILY_MINUTES = 24 * 60  # 1440

# ── Helpers ───────────────────────────────────────────────────────────────


def _time_to_minutes(time_field: str) -> ExpressionWrapper:
    """``EXTRACT(HOUR FROM time) * 60 + EXTRACT(MINUTE FROM time)`` as integer.

    PostgreSQL ``EXTRACT`` returns double precision, so every call is
    wrapped with ``Cast(..., IntegerField())`` and the final arithmetic
    is wrapped with ``ExpressionWrapper(output_field=IntegerField())``.

    .. note::

        Seconds and microseconds are **not** extracted — all schedule
        times are assumed to have zero seconds.  This is a model-level
        invariant that callers must uphold.
    """
    return ExpressionWrapper(
        Cast(Extract(F(time_field), "hour"), output_field=models.IntegerField()) * 60
        + Cast(Extract(F(time_field), "minute"), output_field=models.IntegerField()),
        output_field=models.IntegerField(),
    )


# ── Generated-column expressions ──────────────────────────────────────────


def _start_cycle_minutes_expression():
    """``GENERATED ALWAYS`` expression for ``start_cycle_minutes``.

    For day-specific schedules the value is a week-minute offset
    (``day_index * 1440 + start_minutes``, range 0–10079).
    For every-day schedules (``day=None``) the value is a daily-minute
    offset (range 0–1439).  NULL when ``start_time`` is NULL.
    """
    day_offset = Case(
        When(day="monday", then=Value(0 * DAILY_MINUTES)),
        When(day="tuesday", then=Value(1 * DAILY_MINUTES)),
        When(day="wednesday", then=Value(2 * DAILY_MINUTES)),
        When(day="thursday", then=Value(3 * DAILY_MINUTES)),
        When(day="friday", then=Value(4 * DAILY_MINUTES)),
        When(day="saturday", then=Value(5 * DAILY_MINUTES)),
        When(day="sunday", then=Value(6 * DAILY_MINUTES)),
        default=Value(0),
    )
    result = ExpressionWrapper(day_offset + _time_to_minutes("start_time"), output_field=models.IntegerField())
    return Case(
        When(Q(start_time__isnull=False), then=result),
        default=None,
    )


def _duration_minutes_expression():
    """``GENERATED ALWAYS`` expression for ``duration_minutes``.

    ``COALESCE(NULLIF((end_m − start_m + 1440) % 1440, 0), 1440)``

    Handles overnight schedules via modular arithmetic.  Falls back to
    1440 when start == end (24 h schedule).  NULL when either time is
    NULL.
    """
    raw = ExpressionWrapper(
        Mod(
            _time_to_minutes("end_time") - _time_to_minutes("start_time") + Value(DAILY_MINUTES),
            Value(DAILY_MINUTES),
        ),
        output_field=models.IntegerField(),
    )
    duration = ExpressionWrapper(
        Coalesce(NullIf(raw, Value(0)), Value(DAILY_MINUTES)),
        output_field=models.IntegerField(),
    )
    return Case(
        When(
            Q(start_time__isnull=False) & Q(end_time__isnull=False),
            then=duration,
        ),
        default=None,
    )


# ── Model ─────────────────────────────────────────────────────────────────


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

    # Generated cyclic-interval columns for branchless "is this schedule
    # active at a given datetime?" queries using modular arithmetic.
    # Both are STORED generated columns — the database keeps them in sync
    # with ``day``, ``start_time``, and ``end_time`` automatically.
    #
    # ``start_cycle_minutes`` is the offset in minutes from the start of
    # the cycle (midnight for every-day schedules, Monday 00:00 for
    # day-specific schedules).
    #
    # ``duration_minutes`` is the positive duration computed via
    # ``(end − start + 1440) % 1440``, handling overnight naturally.
    # Falls back to 1440 (24 h) when start == end.
    #
    # Both are NULL when the relevant time fields are NULL
    # (full-day schedule with no time window).
    start_cycle_minutes = models.GeneratedField(
        expression=_start_cycle_minutes_expression(),
        output_field=models.IntegerField(null=True),
        db_persist=True,
    )
    duration_minutes = models.GeneratedField(
        expression=_duration_minutes_expression(),
        output_field=models.IntegerField(null=True),
        db_persist=True,
    )

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
