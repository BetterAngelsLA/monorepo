"""Shelter open-at query — determines which shelters are open at a given datetime."""

import datetime
from typing import TYPE_CHECKING, Sequence

from django.db.models import Case, DateField, Exists, F, IntegerField, OuterRef, Q, QuerySet, Value, When
from django.db.models.functions import Mod
from django.db.models.lookups import LessThan

from shelters.constants import DAILY_MINUTES, WEEK_MINUTES
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices

if TYPE_CHECKING:
    from shelters.models import Shelter


def shelters_open_at(
    queryset: "QuerySet[Shelter]",
    *,
    dt: datetime.datetime,
    schedule_types: Sequence[ScheduleTypeChoices],
) -> "QuerySet[Shelter]":
    """Return shelters whose schedule says they are open at *dt* in ANY of *schedule_types*.

    The filter:
    1. Finds a non-exception schedule row matching the weekday + time window
       (respecting optional seasonal date bounds and overnight schedules).
    2. Excludes shelters that have an active exception covering *dt*
       (full-day or partial-day).

    When multiple ``schedule_types`` are supplied, the shelter is included if it
    is open under **any** of the given types (union). Exceptions apply per-type:
    a partial-day exception for INTAKE does not affect the OPERATING window.

    Uses precomputed ``start_cycle_minutes`` / ``duration_minutes`` columns
    with modular arithmetic so that overnight schedules (e.g. 6 PM – 2 AM)
    and normal schedules (9 AM – 5 PM) are handled by the same branchless
    condition — no is_normal / is_overnight distinction needed.

    **How the modulo check works**

    Every schedule is represented as a cyclic interval
    ``[start_cycle_minutes, start_cycle_minutes + duration_minutes)`` on a
    10080-minute clock (Monday 00:00 = 0, Sunday 23:59 = 10079).  For a
    query at week-minute *q*, the condition

        ``(q − start + 10080) % 10080 < duration``

    is true exactly when *q* falls inside the interval.  Adding 10080
    before the modulo ensures the dividend is never negative.

    For every-day schedules (``day=None``) the interval is stored on a
    1440-minute daily clock instead.

    **Date bounds follow the shift's start**

    ``start_date`` / ``end_date`` and exception dates bound the day the window
    *starts*: a Monday 20:30-07:30 shift is Monday's for its whole length, so
    Tuesday 02:00 is checked against Monday's date. ``shift_date`` below is that
    date — today, or yesterday when the after-midnight tail is being queried.

    .. note::

        Start time is **inclusive**, end time is **exclusive**.
        A close time of 15:00 means the shelter is closed *at* 15:00.
    """
    from shelters.models import Schedule

    # Python's weekday() returns Monday=0, matching the model's day_offset
    # Case (Monday=0, …, Sunday=6).
    query_wm = dt.weekday() * DAILY_MINUTES + dt.hour * 60 + dt.minute
    query_dm = dt.hour * 60 + dt.minute
    date = dt.date()
    day_enum = DayOfWeekChoices.from_date(date)

    # Branchless time-window cover for both normal and overnight schedules.
    # Every-day schedules (day=None) use the daily clock; day-specific
    # schedules use the weekly clock.
    every_day_window = Q(
        day__isnull=True,
    ) & Q(
        LessThan(
            Mod(Value(query_dm) - F("start_cycle_minutes") + DAILY_MINUTES, DAILY_MINUTES),
            F("duration_minutes"),
        ),
    )
    day_specific_window = Q(
        day__isnull=False,
    ) & Q(
        LessThan(
            Mod(Value(query_wm) - F("start_cycle_minutes") + WEEK_MINUTES, WEEK_MINUTES),
            F("duration_minutes"),
        ),
    )
    timed_covers = every_day_window | day_specific_window

    # Full-day schedules (start_time IS NULL) match purely by day.
    full_day_covers = Q(start_time__isnull=True) & (Q(day__isnull=True) | Q(day=day_enum))

    covers = timed_covers | full_day_covers

    # A window belongs to the day it starts: a Monday 20:30-07:30 shift is
    # Monday's for its whole length. Seasonal bounds and exception dates must
    # therefore be checked against the shift's start date, not the query date,
    # or the after-midnight tail is evaluated against the wrong day.
    #
    # ``elapsed_minutes`` is how long ago the current shift started (0-1439 on
    # the clock the row uses). If that is longer than the minutes elapsed today,
    # the start crossed midnight and the shift belongs to yesterday.
    elapsed_minutes = Case(
        When(
            day__isnull=True,
            then=Mod(Value(query_dm) - F("start_cycle_minutes") + DAILY_MINUTES, DAILY_MINUTES),
        ),
        default=Mod(Value(query_wm) - F("start_cycle_minutes") + WEEK_MINUTES, WEEK_MINUTES),
        output_field=IntegerField(),
    )
    shift_date = Case(
        When(
            LessThan(Value(query_dm), elapsed_minutes),
            then=Value(date - datetime.timedelta(days=1)),
        ),
        default=Value(date),
        output_field=DateField(),
    )
    shift_date_bounds = [
        Q(start_date=None) | Q(start_date__lte=shift_date),
        Q(end_date=None) | Q(end_date__gte=shift_date),
    ]

    # For each requested schedule type independently:
    #   - The shelter must have a non-exception schedule row of that type
    #     covering *dt*.
    #   - The shelter must NOT have an active exception of that type
    #     covering *dt*.
    # The shelter is included in the final result if it is "open" under ANY
    # of the requested schedule types (union / OR).  An empty iterable
    # results in ``Q()``, which is a no-op filter.
    open_condition = Q()
    for schedule_type in schedule_types:
        is_open = Exists(
            Schedule.objects.filter(
                shelter=OuterRef("pk"),
                schedule_type=schedule_type,
                is_exception=False,
            ).filter(
                covers,
                *shift_date_bounds,
            )
        )

        has_active_exception = Exists(
            Schedule.objects.filter(
                shelter=OuterRef("pk"),
                schedule_type=schedule_type,
                is_exception=True,
            ).filter(
                covers,
                *shift_date_bounds,
            )
        )

        open_condition |= is_open & ~has_active_exception

    return queryset.filter(open_condition)
