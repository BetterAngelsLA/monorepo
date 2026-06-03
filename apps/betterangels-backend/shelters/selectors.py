"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

from datetime import datetime, timedelta
from time import timezone
from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, Q, QuerySet
from organizations.models import Organization
from shelters.enums import DayOfWeekChoices, ScheduleTypeChoices, StatusChoices
from pghistory.Models import Events

if TYPE_CHECKING:
    from accounts.models import User
    from django.contrib.auth.base_user import AbstractBaseUser
    from django.contrib.auth.models import AnonymousUser
    from shelters.models import Shelter

def shelter_list(
    queryset: "QuerySet[Shelter]", *, user: "AbstractBaseUser | AnonymousUser | None" = None
) -> "QuerySet[Shelter]":
    """Filter to shelters approved for public display.

    If the user has the ``view_private_shelter`` permission (granted via the
    Caseworker group template), private shelters are included.  Otherwise only
    public (``is_private=False``) shelters are returned.
    """
    from shelters.models import Shelter

    queryset = queryset.filter(status=StatusChoices.APPROVED)
    if user and user.is_authenticated and hasattr(user, "has_perm") and user.has_perm(Shelter.perms.VIEW_PRIVATE):
        return queryset
    return queryset.filter(is_private=False)


def admin_shelter_list(queryset: "QuerySet[Shelter]", *, user: "User") -> "QuerySet[Shelter]":
    """Filter to shelters whose organization the *user* belongs to."""
    user_orgs = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
    return queryset.filter(Exists(user_orgs))


def shelter_get(*, user: "User", shelter_id: int | str) -> "Shelter":
    """Return the shelter if it exists and the user belongs to its organization.

    Uses ``admin_shelter_list`` as the base queryset so the org-membership
    check is defined in one place.

    Raises:
        ``Shelter.DoesNotExist`` when the shelter is not found or the user
        does not belong to its organization.
    """
    from shelters.models import Shelter

    return admin_shelter_list(Shelter.objects.all(), user=user).get(pk=shelter_id)


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
    day = DayOfWeekChoices.from_date(dt.date())
    time = dt.time()
    date = dt.date()

    # Step 1: Use an Exists subquery so the join doesn't produce duplicate
    # shelter rows (avoiding the need for .distinct()).  All conditions bind
    # to a single Schedule row.
    from shelters.models import Schedule

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


def reservation_status_change_counts(
        shelter_id: int,
        start_date: datetime.date,
        end_date: datetime.date,
) -> dict[str, int]:
    """
      Count how many reservations changed to given statuses for a shelter in a date range (end_date inclusive).

      Each reservation is counted once per status.
    """
    now = timezone.now()
    furthest_date = now.replace(year=now.year-1)
    if start_date < furthest_date.date() or end_date < furthest_date.date():
        return {}

    from shelters.models import Reservation

    reservations = Reservation.objects.filter(shelter_id=shelter_id)

    events = (
        Events.objects.tracks(reservations)
        .filter(
            pgh_label="reservation.status_change",
            pgh_created_at__gte=start_date,
            pgh_created_at__lt=end_date + timedelta(days=1)
        )
    )

    return {
        "STATUS_TO_CHECK_IN_OVERDUE": events.filter(status="check_in_overdue").values("pgh_obj_id").distinct().count(),
        "STATUS_TO_CANCELLED": events.filter(status="cancelled").values("pgh_obj_id").distinct().count(),
        "STATUS_TO_CHECKED_IN": events.filter(status="checked_in").values("pgh_obj_id").distinct().count(),
        "STATUS_OVERDUE_TO_CHECKED_IN": events.filter(pgh_diff__status__0="check_in_overdue", pgh_diff__status__1="checked_in").values("pgh_obj_id").distinct().count(),
    }
