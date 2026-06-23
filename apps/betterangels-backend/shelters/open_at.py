"""Zero-cycle ``shelters_open_at`` query — importable by models, managers,
selectors, and filters without creating circular imports."""

import datetime
from typing import TYPE_CHECKING

from django.db.models import Exists, F, OuterRef, Q, QuerySet
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices

if TYPE_CHECKING:
    from shelters.models import Shelter


def _time_and_day_condition(*, time: datetime.time, day: DayOfWeekChoices, yesterday: DayOfWeekChoices, include_full_day: bool = False) -> Q:
    """Build a Q object matching schedules whose time window covers *time*.

    Handles both normal schedules (``start_time <= end_time``) and overnight
    schedules (``start_time > end_time``, e.g. 6 PM – 2 AM).

    Normal schedules:
        ``start_time <= time <= end_time`` on the matching day.

    Overnight schedules:
        - ``time >= start_time`` on the schedule's ``day`` (same calendar day), or
        - ``time <= end_time`` on the next calendar day (``yesterday`` matches).

    When *include_full_day* is True, schedules with no times
    (``start_time IS NULL``) also match, which is useful for
    full-day exception checks.
    """
    is_normal = Q(start_time__lte=F("end_time"))
    is_overnight = Q(start_time__gt=F("end_time"))

    day_match = Q(day=None) | Q(day=day)
    yesterday_match = Q(day=None) | Q(day=yesterday)

    normal_window = is_normal & Q(start_time__lte=time, end_time__gte=time) & day_match

    overnight_same_day = is_overnight & Q(start_time__lte=time) & day_match
    overnight_next_day = is_overnight & Q(end_time__gte=time) & yesterday_match

    result = normal_window | overnight_same_day | overnight_next_day

    if include_full_day:
        result |= Q(start_time__isnull=True) & day_match

    return result


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
    """
    from shelters.models import Schedule

    day = DayOfWeekChoices.from_date(dt.date())
    yesterday = DayOfWeekChoices.from_date((dt - datetime.timedelta(days=1)).date())
    time = dt.time()
    date = dt.date()

    time_day = _time_and_day_condition(time=time, day=day, yesterday=yesterday)

    # Step 1: Use an Exists subquery so the join doesn't produce duplicate
    # shelter rows (avoiding the need for .distinct()).  All conditions bind
    # to a single Schedule row.
    is_open = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=False,
        ).filter(
            time_day,
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    # Step 2: exclude shelters with an active exception covering *dt*.
    #   - Full-day:  start_time IS NULL  → closed all day, must match the day.
    #   - Partial:   same time+day logic as above, including overnight.
    covers_now = _time_and_day_condition(time=time, day=day, yesterday=yesterday, include_full_day=True)
    has_active_exception = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=True,
        ).filter(
            covers_now,
            Q(start_date=None) | Q(start_date__lte=date),
            Q(end_date=None) | Q(end_date__gte=date),
        )
    )

    return queryset.filter(is_open).exclude(has_active_exception)
