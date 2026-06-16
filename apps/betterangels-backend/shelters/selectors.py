"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

import datetime
from collections import Counter
from itertools import takewhile
from typing import TYPE_CHECKING, Any

import pghistory
from django.db.models import Count, Exists, OuterRef, Q, QuerySet, Subquery, TextField
from django.db.models.functions import Cast
from organizations.models import Organization
from shelters.enums import BedStatusChoices, DayOfWeekChoices, ScheduleTypeChoices, StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from django.contrib.auth.base_user import AbstractBaseUser
    from django.contrib.auth.models import AnonymousUser
    from shelters.models import Bed, Room, Shelter


def report_bed_status_counts(
    *, shelter: "Shelter", start_date: datetime.date, end_date: datetime.date
) -> list[dict[str, Any]]:
    """
    Returns daily bed status counts for each day in the range.

    Each BedEvent is valid from its ``pgh_created_at`` until the *next*
    event for the same bed (or forever if no next event).  A ``bed.remove``
    event ends the bed's lifecycle.  By annotating each event with its
    successor's timestamp we can answer "what was the status on day X?"
    with a single query — no per-day round-trips, no DISTINCT ON.

    TODO: Add demographic filtering once pghistory tracks M2M through tables.
    Bed.demographics is M2M and pghistory only tracks scalar fields so we cannot
    reconstruct historically accurate demographic membership from BedEvent
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    end_of_range = datetime.datetime.combine(end_date, datetime.time.max, tzinfo=datetime.timezone.utc)

    # Subquery: the *next* BedEvent (by pgh_created_at) for the same bed.
    next_event_subq = (
        BedEvent.objects.filter(
            pgh_obj_id=OuterRef("pgh_obj_id"),
            pgh_created_at__gt=OuterRef("pgh_created_at"),
        )
        .order_by("pgh_created_at")
        .values("pgh_created_at")[:1]
    )

    # One query: all events up to end_of_range, annotated with successor timestamp,
    # sorted chronologically so the inner loop can break early.
    events = list(
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_created_at__lte=end_of_range,
        )
        .exclude(pgh_label="bed.remove")
        .annotate(next_event_at=Subquery(next_event_subq))
        .order_by("pgh_created_at")
        .values("pgh_obj_id", "status", "pgh_created_at", "next_event_at")
    )

    n_days = (end_date - start_date).days + 1

    def _counts(day: datetime.date) -> dict[str, Any]:
        eod = datetime.datetime.combine(day, datetime.time.max, tzinfo=datetime.timezone.utc)

        # Dict comprehension over chronologically sorted events: takewhile
        # limits to events <= end_of_day; later events for the same bed
        # naturally overwrite earlier ones.
        counts = Counter(
            e["status"]
            for e in takewhile(lambda e: e["pgh_created_at"] <= eod, events)
            if e["next_event_at"] is None or e["next_event_at"] > eod
        )

        return {
            "date": day.isoformat(),
            "available": counts.get(BedStatusChoices.AVAILABLE, 0),
            "occupied": counts.get(BedStatusChoices.OCCUPIED, 0),
            "reserved": counts.get(BedStatusChoices.RESERVED, 0),
            "out_of_service": counts.get(BedStatusChoices.OUT_OF_SERVICE, 0),
        }

    return [_counts(start_date + datetime.timedelta(days=n)) for n in range(n_days)]


def shelter_list(
    queryset: "QuerySet[Shelter]", *, user: "AbstractBaseUser | AnonymousUser | None" = None
) -> "QuerySet[Shelter]":
    """Filter to shelters approved for public display.

    If the user has the ``view_private_shelter`` permission, private shelters
    are included.  Otherwise only public (``is_private=False``) shelters are
    returned.
    """
    from shelters.models import Shelter

    queryset = queryset.filter(status=StatusChoices.APPROVED)
    if user and user.is_authenticated and hasattr(user, "has_perm") and user.has_perm(Shelter.perms.VIEW_PRIVATE):
        return queryset
    return queryset.filter(is_private=False)


def admin_shelter_list(
    queryset: "QuerySet[Shelter]",
    *,
    user: "User",
    organization_id: str | None = None,
) -> "QuerySet[Shelter]":
    """Filter to shelters in *organization_id* that *user* belongs to.

    ``organization_id`` is required — the ``HasOrgPerm`` extension on
    the query ensures a header org is always present.
    """
    return queryset.filter(
        organization_id=organization_id,
        organization__in=Organization.objects.filter(pk=organization_id, users=user),
    )


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


def admin_room_list(queryset: "QuerySet[Room]", *, user: "User") -> "QuerySet[Room]":
    from shelters.models import Shelter

    return queryset.filter(shelter__in=admin_shelter_list(Shelter.objects.all(), user=user))


def room_get(*, user: "User", room_id: int | str) -> "Room":
    from shelters.models import Room

    return admin_room_list(Room.objects.select_related("shelter"), user=user).get(pk=room_id)


def admin_bed_list(queryset: "QuerySet[Bed]", *, user: "User") -> "QuerySet[Bed]":
    from shelters.models import Shelter

    return queryset.filter(shelter__in=admin_shelter_list(Shelter.objects.all(), user=user))


def bed_get(*, user: "User", bed_id: int | str) -> "Bed":
    from shelters.models import Bed

    return admin_bed_list(Bed.objects.select_related("shelter"), user=user).get(pk=bed_id)


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
    start_date: datetime.datetime,
    end_date: datetime.datetime,
) -> dict[str, int]:
    """
    Count how many reservations changed to given statuses for a shelter in a date range.

    Each reservation is counted once per status.
    """
    from shelters.models import Reservation

    events = pghistory.models.Events.objects.filter(
        pgh_obj_id__in=Reservation.objects.filter(shelter_id=shelter_id)
        .annotate(pk_text=Cast("pk", TextField()))
        .values("pk_text"),
        pgh_label="reservation.status_change",
        pgh_created_at__gte=start_date,
        pgh_created_at__lt=end_date,
    )

    return events.aggregate(
        STATUS_TO_CHECK_IN_OVERDUE=Count(
            "pgh_obj_id",
            distinct=True,
            filter=Q(pgh_data__status="check_in_overdue"),
        ),
        STATUS_TO_CANCELLED=Count("pgh_obj_id", distinct=True, filter=Q(pgh_data__status="cancelled")),
        STATUS_TO_CHECKED_IN=Count("pgh_obj_id", distinct=True, filter=Q(pgh_data__status="checked_in")),
        STATUS_OVERDUE_TO_CHECKED_IN=Count(
            "pgh_obj_id",
            distinct=True,
            filter=Q(pgh_diff__status__0="check_in_overdue", pgh_diff__status__1="checked_in"),
        ),
    )
