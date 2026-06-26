"""Report-gathering selectors — historical data aggregation."""

import datetime
from collections import Counter
from itertools import takewhile
from typing import TYPE_CHECKING, Any, Iterable, TypedDict

import pghistory
from django.db.models import Count, OuterRef, Q, Subquery, TextField
from django.db.models.functions import Cast
from shelters.enums import BedStatusChoices, DemographicChoices

if TYPE_CHECKING:
    from shelters.models import Shelter


MAX_REPORT_RANGE_DAYS = 366  # one (leap) year, inclusive of both endpoints


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


class ReservationStatusChangeCounts(TypedDict):
    """Reservation status-change counts over a date range.

    Each key counts the number of *distinct* reservations whose
    ``status`` transitioned to the indicated value within the window.
    ``STATUS_OVERDUE_TO_CHECKED_IN`` is a narrower bucket: it only counts
    transitions whose previous status was ``CHECK_IN_OVERDUE`` (sourced
    from pghistory's ``pgh_diff`` payload).
    """

    STATUS_TO_CHECK_IN_OVERDUE: int
    STATUS_TO_CANCELLED: int
    STATUS_TO_CHECKED_IN: int
    STATUS_OVERDUE_TO_CHECKED_IN: int


def _normalize_demographics(demographics: Iterable[DemographicChoices | str] | None) -> list[str] | None:
    """Return the list of demographic *values* (``str``) or ``None`` when empty.

    Accepts either ``DemographicChoices`` members or their raw string values
    so callers (resolvers, services, tests) can pass whichever is convenient.
    The ``ALL`` sentinel means "no narrowing"; any list containing it is
    treated as if no demographics filter was provided.
    """
    if not demographics:
        return None

    values: list[str] = []
    for demo in demographics:
        value = demo.value if isinstance(demo, DemographicChoices) else demo
        if value == DemographicChoices.ALL.value:
            # ALL means: do not narrow.  Short-circuit so callers can pass it
            # alongside other choices without accidentally widening the filter.
            return None
        values.append(value)
    return values or None


def reservation_status_change_counts(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
    demographics: Iterable[DemographicChoices | str] | None = None,
) -> ReservationStatusChangeCounts:
    """Count reservation status-change events for *shelter* within an inclusive window.

    Both endpoints are inclusive at the day level: internally the end of
    ``end_date`` is widened to the start of the next day so any event on
    ``end_date`` is captured.

    When *demographics* is provided, the metric is narrowed to reservations
    whose bed or room currently serves at least one of those demographics.
    ``DemographicChoices.ALL`` is treated as "no narrowing".

    Buckets:

    - ``STATUS_TO_CHECK_IN_OVERDUE`` — reservations that became overdue
    - ``STATUS_TO_CANCELLED`` — reservations that were cancelled
    - ``STATUS_TO_CHECKED_IN`` — reservations that were checked in
    - ``STATUS_OVERDUE_TO_CHECKED_IN`` — overdue reservations that were
      subsequently checked in within the window (sourced from ``pgh_diff``)

    Each reservation is counted at most once per bucket (``distinct=True``).

    Args:
        shelter: ``Shelter`` whose reservations are aggregated.
        start_date: Inclusive lower bound of the date range.
        end_date: Inclusive upper bound of the date range.  Must be on or
            after ``start_date`` and within ``MAX_REPORT_RANGE_DAYS`` days
            of it.
        demographics: Optional iterable of ``DemographicChoices`` (or their
            string values) to scope by bed / room demographics.

    Raises:
        ValueError: If ``end_date`` is before ``start_date`` or the range
            spans more than ``MAX_REPORT_RANGE_DAYS`` days.

    Notes:
        Demographic filtering uses the bed/room's *current* demographics.
        ``Bed.demographics`` / ``Room.demographics`` are not historically
        tracked by pghistory (M2M through tables aren't included on the
        ``BedEvent`` / ``ReservationEvent`` tables), so we cannot
        reconstruct demographic membership as it existed at event time.
    """
    from shelters.models import Reservation

    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")
    if (end_date - start_date).days > MAX_REPORT_RANGE_DAYS:
        raise ValueError(f"Date range cannot exceed {MAX_REPORT_RANGE_DAYS} days.")

    start_dt = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=datetime.timezone.utc)
    end_dt = datetime.datetime.combine(
        end_date + datetime.timedelta(days=1),
        datetime.time.min,
        tzinfo=datetime.timezone.utc,
    )

    reservations = Reservation.objects.filter(
        Q(bed__shelter_id=shelter.pk) | Q(room__shelter_id=shelter.pk),
    )

    demo_values = _normalize_demographics(demographics)
    if demo_values is not None:
        reservations = reservations.filter(
            Q(bed__demographics__name__in=demo_values) | Q(room__demographics__name__in=demo_values),
        ).distinct()

    # pghistory.models.Events.pgh_obj_id is a text column; cast Reservation.pk to text for the IN.
    reservation_ids = reservations.annotate(pk_text=Cast("pk", TextField())).values("pk_text")

    events = pghistory.models.Events.objects.filter(
        pgh_obj_id__in=reservation_ids,
        pgh_label="reservation.status_change",
        pgh_created_at__gte=start_dt,
        pgh_created_at__lt=end_dt,
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
