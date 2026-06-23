"""Zero-cycle ``shelters_open_at`` query — importable by models, managers,
selectors, and filters without creating circular imports."""

import datetime
from typing import TYPE_CHECKING

from django.db.models import Exists, F, OuterRef, Q, QuerySet, Value
from django.db.models.functions import Mod
from django.db.models.lookups import LessThan
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices

if TYPE_CHECKING:
    from shelters.models import Shelter

WEEK_MINUTES = 7 * 24 * 60  # 10080
DAILY_MINUTES = 24 * 60  # 1440


def shelters_open_at(
    queryset: "QuerySet[Shelter]",
    *,
    dt: datetime.datetime,
    schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
) -> "QuerySet[Shelter]":
    """Return shelters whose *schedule_type* schedule says they are open at *dt*.

    The filter:
    1. Finds a non-exception schedule row matching the weekday + time window
       (respecting optional seasonal date bounds and overnight schedules).
    2. Excludes shelters that have an active exception covering *dt*
       (full-day or partial-day).

    Uses precomputed ``start_week_minutes`` / ``duration_minutes`` columns
    with modular arithmetic so that overnight schedules (e.g. 6 PM – 2 AM)
    and normal schedules (9 AM – 5 PM) are handled by the same branchless
    condition — no is_normal / is_overnight distinction needed.

    **How the modulo check works**

    Every schedule is represented as a cyclic interval
    ``[start_week_minutes, start_week_minutes + duration_minutes)`` on a
    10080-minute clock (Monday 00:00 = 0, Sunday 23:59 = 10079).  For a
    query at week-minute *q*, the condition

        ``(q − start + 10080) % 10080 < duration``

    is true exactly when *q* falls inside the interval.  Adding 10080
    before the modulo ensures the dividend is never negative.

    For every-day schedules (``day=None``) the interval is stored on a
    1440-minute daily clock instead.
    """
    from shelters.models import Schedule

    query_wm = dt.weekday() * DAILY_MINUTES + dt.hour * 60 + dt.minute
    query_dm = dt.hour * 60 + dt.minute
    date = dt.date()
    day_enum = DayOfWeekChoices.from_date(date)

    # Branchless time-window cover for both normal and overnight schedules.
    # Every-day schedules (day=None) use the daily clock; day-specific
    # schedules use the weekly clock.
    #
    # Start time is inclusive, end time is exclusive: a close time of
    # 15:00 means the shelter is closed at exactly 15:00.
    every_day_window = Q(
        day__isnull=True,
    ) & Q(
        LessThan(
            Mod(Value(query_dm) - F("start_week_minutes") + DAILY_MINUTES, DAILY_MINUTES),
            F("duration_minutes"),
        ),
    )
    day_specific_window = Q(
        day__isnull=False,
    ) & Q(
        LessThan(
            Mod(Value(query_wm) - F("start_week_minutes") + WEEK_MINUTES, WEEK_MINUTES),
            F("duration_minutes"),
        ),
    )
    timed_covers = every_day_window | day_specific_window

    # Full-day schedules (start_time IS NULL) match purely by day.
    full_day_covers = Q(start_time__isnull=True) & (Q(day__isnull=True) | Q(day=day_enum))

    covers = timed_covers | full_day_covers

    # Step 1: Use an Exists subquery so the join doesn't produce duplicate
    # shelter rows (avoiding the need for .distinct()).  All conditions bind
    # to a single Schedule row.
    is_open = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=False,
        ).filter(
            covers,
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    # Step 2: exclude shelters with an active exception covering *dt*.
    has_active_exception = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=True,
        ).filter(
            covers,
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    return queryset.filter(is_open).exclude(has_active_exception)
