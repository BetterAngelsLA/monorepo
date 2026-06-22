"""Zero-cycle ``shelters_open_at`` query — importable by models, managers,
selectors, and filters without creating circular imports."""

import datetime
from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, Q, QuerySet
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices

if TYPE_CHECKING:
    from shelters.models import Shelter


def shelters_open_at(
    queryset: "QuerySet[Shelter]",
    *,
    dt: datetime.datetime,
    schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
) -> "QuerySet[Shelter]":
    """Return shelters whose *schedule_type* schedule says they are open at *dt*.

    The filter:
    1. Finds a non-exception schedule row matching the weekday + time window
       (respecting optional seasonal date bounds).
    2. Excludes shelters that have an active exception covering *dt*
       (full-day or partial-day).
    """
    from shelters.models import Schedule

    day = DayOfWeekChoices.from_date(dt.date())
    time = dt.time()
    date = dt.date()

    # Step 1: Use an Exists subquery so the join doesn't produce duplicate
    # shelter rows (avoiding the need for .distinct()).  All conditions bind
    # to a single Schedule row.
    is_open = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=False,
            start_time__lte=time,
            end_time__gte=time,
        ).filter(
            Q(day=None) | Q(day=day),
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    # Step 2: exclude shelters with an active exception covering *dt*.
    #   - Full-day:  start_time IS NULL  → closed all day.
    #   - Partial:   start_time <= time AND end_time >= time  → closed now.
    covers_now = Q(start_time__isnull=True) | Q(start_time__lte=time, end_time__gte=time)
    has_active_exception = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=True,
        ).filter(
            covers_now,
            Q(day=None) | Q(day=day),
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    return queryset.filter(is_open).exclude(has_active_exception)
