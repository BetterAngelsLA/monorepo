"""Report-gathering selectors — historical data aggregation."""

import datetime
from collections import Counter
from itertools import takewhile
from typing import Any, TypedDict

import pghistory
from django.db.models import Count, OuterRef, Q, Subquery, TextField
from django.db.models.functions import Cast
from shelters.enums import BedStatusChoices


class DailyBedCounts(TypedDict):
    """A single day's bed status counts."""

    date: str
    available: int
    occupied: int
    reserved: int
    out_of_service: int


def report_bed_status_counts(
    *, shelter: Any, start_date: datetime.date, end_date: datetime.date
) -> list[DailyBedCounts]:
    """
    Returns daily bed status counts for each day in the range.

    Each BedEvent is valid from its ``pgh_created_at`` until the *next*
    event for the same bed (or forever if no next event).  A ``bed.remove``
    event ends the bed's lifecycle.  By annotating each event with its
    successor's timestamp we can answer "what was the status at the end of
    day X?" with a single query — no per-day round-trips, no DISTINCT ON.
    Later events for the same bed naturally overwrite earlier ones, so the
    returned counts reflect the state as of 23:59:59.999 on each day.

    TODO: Add demographic filtering once pghistory tracks M2M through tables.
    Bed.demographics is M2M and pghistory only tracks scalar fields so we cannot
    reconstruct historically accurate demographic membership from BedEvent
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    end_of_range = datetime.datetime.combine(end_date, datetime.time.max, tzinfo=datetime.timezone.utc)

    # Subquery: the *next* BedEvent (by pgh_created_at) for the same bed.
    #
    # NOTE: Uses ``__gt`` (strict greater-than).  If two events for the same
    # bed share the same ``pgh_created_at`` (e.g., from a single transaction),
    # one will be missed as a successor.  In practice pghistory generates
    # microsecond-precision timestamps sequentially, making this extremely
    # unlikely.
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

    def _counts(day: datetime.date) -> DailyBedCounts:
        eod = datetime.datetime.combine(day, datetime.time.max, tzinfo=datetime.timezone.utc)

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
