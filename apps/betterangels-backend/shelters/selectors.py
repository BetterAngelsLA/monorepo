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

    # Step 1: shelters with a matching regular (non-exception) schedule row
    open_filter = Q(
        schedules__schedule_type=schedule_type,
        schedules__day=day,
        schedules__is_closed=False,
        schedules__is_exception=False,
        schedules__open_time__lte=time,
        schedules__close_time__gte=time,
    )

    # Step 2: respect seasonal date bounds
    date_filter = Q(
        Q(schedules__start_date__isnull=True) | Q(schedules__start_date__lte=date),
        Q(schedules__end_date__isnull=True) | Q(schedules__end_date__gte=date),
    )

    # Step 3: shelters with a closed exception active on this date
    exception_closed = Q(
        schedules__schedule_type=schedule_type,
        schedules__is_exception=True,
        schedules__is_closed=True,
        schedules__start_date__lte=date,
        schedules__end_date__gte=date,
    )

    return queryset.filter(open_filter & date_filter).exclude(exception_closed).distinct()
