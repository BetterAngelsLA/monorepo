"""Report-gathering selectors — historical data aggregation."""

import datetime
from collections import Counter
from itertools import takewhile
from typing import TYPE_CHECKING, Any, TypedDict
from zoneinfo import ZoneInfo

import pghistory
from django.db.models import Count, OuterRef, Q, Subquery, TextField
from django.db.models.functions import Cast

from shelters.enums import BedStatusChoices, ReservationStatusChoices

if TYPE_CHECKING:
    from shelters.models import Shelter
    from shelters.types.reporting import DailyBedStatusMetricsType, ReservationMetricsType


# ── Shared date-range helpers ─────────────────────────────────────────────────
# Reporting selectors take calendar dates and read them as LA-local days (all BA
# shelters are in LA), then convert to a UTC window to query pgh_created_at.
# New selectors should call report_date_range_to_utc rather than convert inline.

LA_TZ = ZoneInfo("America/Los_Angeles")


def report_date_range_to_utc(
    start_date: datetime.date, end_date: datetime.date
) -> tuple[datetime.datetime, datetime.datetime]:
    """Convert an inclusive LA-local date range to a ``[start, end)`` UTC window.

    ``end`` is the UTC instant at the start of the day *after* ``end_date`` in
    Los Angeles, so the returned half-open interval covers all of ``end_date``
    locally. Ranges are unbounded; the natural limit is how far back data exists.

    Raises:
        ValueError: if ``end_date`` is before ``start_date``.
    """
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date")

    start_local = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=LA_TZ)
    end_local = datetime.datetime.combine(end_date + datetime.timedelta(days=1), datetime.time.min, tzinfo=LA_TZ)
    return start_local.astimezone(datetime.timezone.utc), end_local.astimezone(datetime.timezone.utc)


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


def bed_status_metric(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
) -> "list[DailyBedStatusMetricsType]":
    """Return daily bed status counts for each day in [start_date, end_date].

    Uses reservation events as the SSOT and bed events for create/delete/
    maintenance tracking.  For each day the counts reflect the state of every
    bed as of end-of-day in Los Angeles local time.  When a bed's status changes
    more than once in a single day, only the *final* state is counted — this
    falls out naturally from chronological event replay.

    Args:
        shelter: The shelter whose beds are aggregated.
        start_date: Inclusive lower bound of the reporting date range.
        end_date: Inclusive upper bound.  Must be >= ``start_date``.

    Raises:
        ValueError: If ``end_date`` is before ``start_date``.

    Returns:
        One :class:`~shelters.types.reporting.DailyBedStatusMetricsType` entry
        per day in the inclusive range.
    """
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date.")

    from shelters.models import Bed, Reservation
    from shelters.models.shelter import ACTIVE_RESERVATION_STATUSES
    from shelters.types.reporting import DailyBedStatusMetricsType

    BedEvent = Bed.pgh_event_model  # type: ignore[attr-defined]
    ReservationEvent = Reservation.pgh_event_model  # type: ignore[attr-defined]

    start_utc, end_utc = report_date_range_to_utc(start_date, end_date)
    # end_utc is the start of the day after end_date in LA (half-open), so using
    # it as the upper bound covers all events that occurred on end_date locally.
    end_of_range = end_utc - datetime.timedelta(microseconds=1)

    # All bed IDs are discovered from events; beds are assumed to have been
    # created after pghistory tracking was installed.
    bed_events: list[dict[str, Any]] = list(
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_created_at__lte=end_of_range,
        )
        .order_by("pgh_created_at")
        .values("pgh_obj_id", "pgh_label", "pgh_created_at", "maintenance_flag")
    )

    scoped_bed_ids: frozenset[int] = frozenset(e["pgh_obj_id"] for e in bed_events)

    # Room-only reservations (bed_id IS NULL) are excluded; they don't affect per-bed counts.
    res_events: list[dict[str, Any]] = list(
        ReservationEvent.objects.filter(
            bed_id__in=scoped_bed_ids,
            pgh_created_at__lte=end_of_range,
        )
        .order_by("pgh_created_at")
        .values("pgh_label", "pgh_created_at", "bed_id", "status")
    )

    # Merge both streams chronologically. Bed events are ordered before
    # reservation events at equal timestamps so a bed exists before its
    # first reservation event is applied.
    tagged: list[dict[str, Any]] = sorted(
        [{"_src": "bed", **e} for e in bed_events] + [{"_src": "res", **e} for e in res_events],
        key=lambda e: (e["pgh_created_at"], 0 if e["_src"] == "bed" else 1),
    )

    bed_active: set[int] = set()  # beds that currently exist in the shelter
    bed_maintenance: dict[int, bool] = {}  # True → OUT_OF_SERVICE
    bed_reservation: dict[int, str | None] = {}  # active reservation status (None = none)

    def _apply(event: dict[str, Any]) -> None:
        if event["_src"] == "bed":
            bid: int = event["pgh_obj_id"]
            label = event["pgh_label"]
            if label == "bed.add":
                bed_active.add(bid)
                bed_maintenance[bid] = bool(event["maintenance_flag"])
                bed_reservation.setdefault(bid, None)
            elif label == "bed.remove":
                bed_active.discard(bid)
            elif label == "bed.maintenance_flag_change":
                bed_maintenance[bid] = bool(event["maintenance_flag"])
        else:
            bid = event["bed_id"]
            label = event["pgh_label"]
            status: str = event["status"]
            if label in ("reservation.add", "reservation.status_change"):
                if status in ACTIVE_RESERVATION_STATUSES:
                    bed_reservation[bid] = status
                else:
                    bed_reservation[bid] = None
            elif label == "reservation.remove" and status in ACTIVE_RESERVATION_STATUSES:
                bed_reservation[bid] = None

    # Replay all events before start_date to build the initial snapshot.
    split = next((i for i, e in enumerate(tagged) if e["pgh_created_at"] >= start_utc), len(tagged))
    pre_events = tagged[:split]
    in_range_events = tagged[split:]

    for event in pre_events:
        _apply(event)

    n_days = (end_date - start_date).days + 1
    result: list[DailyBedStatusMetricsType] = []
    event_idx = 0
    total_in_range = len(in_range_events)

    def _snapshot(day: datetime.date) -> DailyBedStatusMetricsType:
        available = occupied = reserved = out_of_service = 0
        for bid in bed_active:
            if bed_maintenance.get(bid, False):
                out_of_service += 1
            else:
                rs = bed_reservation.get(bid)
                if rs == ReservationStatusChoices.CHECKED_IN:
                    occupied += 1
                elif rs in ACTIVE_RESERVATION_STATUSES:  # CONFIRMED or CHECK_IN_OVERDUE
                    reserved += 1
                else:
                    available += 1
        return DailyBedStatusMetricsType(
            date=day,
            available=available,
            occupied=occupied,
            reserved=reserved,
            out_of_service=out_of_service,
        )

    for day_n in range(n_days):
        day = start_date + datetime.timedelta(days=day_n)
        end_of_day = datetime.datetime.combine(day, datetime.time.max, tzinfo=datetime.timezone.utc)

        while event_idx < total_in_range and in_range_events[event_idx]["pgh_created_at"] <= end_of_day:
            _apply(in_range_events[event_idx])
            event_idx += 1

        result.append(_snapshot(day))

    return result


def reservation_status_change_counts(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
) -> "ReservationMetricsType":
    """Count reservation status-change events for *shelter* within an inclusive window.

    Both endpoints are inclusive at the day level and interpreted in
    America/Los_Angeles (via ``report_date_range_to_utc``): internally the end of
    ``end_date`` is widened to the start of the next LA day so any event on
    ``end_date`` (LA-local) is captured.

    Returns a :class:`~shelters.types.reporting.ReservationMetricsType` with:

    - ``check_in_overdue`` — reservations that became overdue
    - ``cancelled`` — reservations that were cancelled
    - ``checked_in`` — reservations that were checked in
    - ``check_in_overdue_to_checked_in`` — overdue reservations that were
      subsequently checked in within the window (sourced from ``pgh_diff``)

    Each reservation is counted at most once per bucket (``distinct=True``).

    Args:
        shelter: ``Shelter`` whose reservations are aggregated.
        start_date: Inclusive lower bound of the date range.
        end_date: Inclusive upper bound of the date range.  Must be on or
            after ``start_date``.

    Raises:
        ValueError: If ``end_date`` is before ``start_date``.
    """
    # Local imports avoid a circular dependency: ``shelters.types`` imports
    # from ``shelters.selectors``, so this module must not import them at load time.
    from shelters.models import Reservation
    from shelters.types.reporting import ReservationMetricsType

    start_dt, end_dt = report_date_range_to_utc(start_date, end_date)

    # pghistory.models.Events.pgh_obj_id is a text column; cast Reservation.pk to text for the IN.
    reservation_ids = (
        Reservation.objects.filter(Q(bed__shelter_id=shelter.pk) | Q(room__shelter_id=shelter.pk))
        .annotate(pk_text=Cast("pk", TextField()))
        .values("pk_text")
    )

    events = pghistory.models.Events.objects.filter(
        pgh_obj_id__in=reservation_ids,
        pgh_label="reservation.status_change",
        pgh_created_at__gte=start_dt,
        pgh_created_at__lt=end_dt,
    )

    # ``Count(..., filter=...)`` returns ``None`` on empty rowsets; coerce to 0.
    aggregated = events.aggregate(
        check_in_overdue=Count(
            "pgh_obj_id",
            distinct=True,
            filter=Q(pgh_data__status="check_in_overdue"),
        ),
        cancelled=Count("pgh_obj_id", distinct=True, filter=Q(pgh_data__status="cancelled")),
        checked_in=Count("pgh_obj_id", distinct=True, filter=Q(pgh_data__status="checked_in")),
        check_in_overdue_to_checked_in=Count(
            "pgh_obj_id",
            distinct=True,
            filter=Q(pgh_diff__status__0="check_in_overdue", pgh_diff__status__1="checked_in"),
        ),
    )
    return ReservationMetricsType(
        check_in_overdue=aggregated["check_in_overdue"] or 0,
        cancelled=aggregated["cancelled"] or 0,
        checked_in=aggregated["checked_in"] or 0,
        check_in_overdue_to_checked_in=aggregated["check_in_overdue_to_checked_in"] or 0,
    )
