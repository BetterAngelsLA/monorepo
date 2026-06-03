"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

import datetime
from collections import Counter
from typing import TYPE_CHECKING, Any

from django.db.models import Exists, OuterRef, Q, QuerySet, Subquery
from organizations.models import Organization
from shelters.enums import BedStatusChoices, DayOfWeekChoices, ScheduleTypeChoices, StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from django.contrib.auth.base_user import AbstractBaseUser
    from django.contrib.auth.models import AnonymousUser
    from shelters.models import Shelter


def report_bed_status_counts(
    *, shelter: "Shelter", start_date: datetime.date, end_date: datetime.date
) -> list[dict[str, Any]]:
    """
    Returns daily bed status counts for each day in the range
    TODO: Add demographic filtering once pghistory tracks M2M through tables.
    Bed.demographics is M2M and pghistory only tracks scalar fields so we cannot
    reconstruct historically accurate demographic membership from BedEvent
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    res = []
    curr = start_date

    while curr <= end_date:
        end_of_day = datetime.datetime.combine(curr, datetime.time.max, tzinfo=datetime.timezone.utc)

        latest_event_ids = (
            BedEvent.objects.filter(shelter_id=shelter.pk, pgh_created_at__lte=end_of_day)
            .order_by("pgh_obj_id", "-pgh_created_at")
            .distinct("pgh_obj_id")
            .values("pgh_id")
        )
        snapshot = BedEvent.objects.filter(pgh_id__in=Subquery(latest_event_ids)).exclude(pgh_label="bed.remove")
        counts = Counter(snapshot.values_list("status", flat=True))

        res.append(
            {
                "date": curr.isoformat(),
                "available": counts.get(BedStatusChoices.AVAILABLE, 0),
                "occupied": counts.get(BedStatusChoices.OCCUPIED, 0),
                "reserved": counts.get(BedStatusChoices.RESERVED, 0),
                "out_of_service": counts.get(BedStatusChoices.OUT_OF_SERVICE, 0),
            }
        )

        curr += datetime.timedelta(days=1)
    return res


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
