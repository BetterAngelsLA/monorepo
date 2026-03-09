"""Schedule model — per-day, per-type operating hours for shelters."""

import pghistory
from common.models import BaseModel
from django.db import models
from django.db.models import UniqueConstraint
from django_choices_field import TextChoicesField
from shelters.enums import ConditionChoices, DayOfWeekChoices, ScheduleTypeChoices

from .lookups import Demographic
from .shelter import Shelter


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
