"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

import datetime
from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, Q, QuerySet
from organizations.models import Organization
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices, StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter


def shelter_list(queryset: "QuerySet[Shelter]") -> "QuerySet[Shelter]":
    """Filter to shelters approved for public display."""
    return queryset.filter(status=StatusChoices.APPROVED)


def admin_shelter_list(queryset: "QuerySet[Shelter]", *, user: "User") -> "QuerySet[Shelter]":
    """Filter to shelters whose organization the *user* belongs to."""
    user_orgs = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
    return queryset.filter(Exists(user_orgs))


def shelters_open_at(
    queryset: "QuerySet[Shelter]",
    *,
    dt: datetime.datetime,
    schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
) -> "QuerySet[Shelter]":
    """Return shelters whose *schedule_type* schedule says they are open at *dt*.

    The filter:
    1. Finds a non-exception schedule row matching the weekday + time window.
    2. Respects optional ``start_date`` / ``end_date`` bounds (seasonal schedules).
    3. Excludes shelters that have an active *closed exception* covering ``dt.date()``.
    """
    day = DayOfWeekChoices.from_date(dt.date())
    time = dt.time()
    date = dt.date()

    # Step 1: shelters with a matching regular (non-exception) schedule row.
    # day=NULL means "every day", so match both the specific weekday and NULL.
    day_match = Q(schedules__day=day) | Q(schedules__day__isnull=True)
    open_filter = Q(
        day_match,
        schedules__schedule_type=schedule_type,
        schedules__is_exception=False,
        schedules__start_time__lte=time,
        schedules__end_time__gte=time,
    )

    # Step 2: respect seasonal date bounds
    date_filter = Q(
        Q(schedules__start_date__isnull=True) | Q(schedules__start_date__lte=date),
        Q(schedules__end_date__isnull=True) | Q(schedules__end_date__gte=date),
    )

    # Step 3: shelters with a closed exception active on this date.
    # Use an Exists subquery so all conditions bind to a *single* Schedule
    # row.  A plain ``exclude(schedules__…)`` over a multi-valued reverse FK
    # can cross-match fields from different rows and incorrectly drop shelters.
    from shelters.models import Schedule

    has_closed_exception = Exists(
        Schedule.objects.filter(
            shelter=OuterRef("pk"),
            schedule_type=schedule_type,
            is_exception=True,
            start_time__isnull=True,
        ).filter(
            Q(day=day) | Q(day__isnull=True),
            Q(start_date__isnull=True) | Q(start_date__lte=date),
            Q(end_date__isnull=True) | Q(end_date__gte=date),
        )
    )

    return queryset.filter(open_filter & date_filter).exclude(has_closed_exception).distinct()
