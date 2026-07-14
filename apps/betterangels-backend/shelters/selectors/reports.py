"""Report-gathering selectors — historical data aggregation."""

import datetime
from collections import Counter, defaultdict
from itertools import takewhile
from typing import TYPE_CHECKING, Any, Iterable, TypedDict
from zoneinfo import ZoneInfo

import pghistory
from django.db.models import Count, OuterRef, Q, Subquery, TextField
from django.db.models.functions import Cast
from shelters.enums import BedStatusChoices

if TYPE_CHECKING:
    from shelters.models import Shelter
    from shelters.types.reporting import DailyOccupancyMetricsType, ReservationMetricsType


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


def report_day_bounds_utc(day: datetime.date) -> tuple[datetime.datetime, datetime.datetime]:
    """Return the ``[start, end)`` UTC instants bounding one LA-local day."""
    start = datetime.datetime.combine(day, datetime.time.min, tzinfo=LA_TZ).astimezone(datetime.timezone.utc)
    end = datetime.datetime.combine(day + datetime.timedelta(days=1), datetime.time.min, tzinfo=LA_TZ).astimezone(
        datetime.timezone.utc
    )
    return start, end


def iter_report_days(start_date: datetime.date, end_date: datetime.date) -> list[datetime.date]:
    """Return every LA-local date from ``start_date`` to ``end_date`` inclusive."""
    days = []
    day = start_date
    while day <= end_date:
        days.append(day)
        day += datetime.timedelta(days=1)
    return days


def _reservation_occupancy_intervals(
    *, bed_ids: Iterable[int], end_utc: datetime.datetime
) -> dict[int, list[tuple[datetime.datetime, datetime.datetime | None, int]]]:
    """Reconstruct per-bed ``CHECKED_IN`` occupancy intervals from the reservation event stream.

    Reads every ``ReservationEvent`` (any label) with ``pgh_created_at < end_utc``
    whose snapshotted ``bed_id`` is in ``bed_ids``, groups by reservation, and
    walks each chronologically. An interval opens when a reservation becomes
    ``CHECKED_IN`` and closes at its next transition out of ``CHECKED_IN``; one
    still open at the reservation's last event is returned with ``freed=None``.
    Each interval is attributed to the bed snapshotted at check-in, so bed
    reassignment and since-deleted beds are handled (event rows keep the
    historical ``bed_id``).

    Returns ``{bed_id: [(check_in, freed_or_None, reservation_id), ...]}`` with
    each list sorted by ``check_in``.
    """
    from shelters.enums import ReservationStatusChoices
    from shelters.models import Reservation

    bed_ids = set(bed_ids)
    if not bed_ids:
        return {}

    reservation_event_model = Reservation.pgh_event_model  # type: ignore[attr-defined]
    rows = (
        reservation_event_model.objects.filter(bed_id__in=bed_ids, pgh_created_at__lt=end_utc)
        .order_by("pgh_obj_id", "pgh_created_at", "pgh_id")
        .values_list("pgh_obj_id", "bed_id", "status", "pgh_created_at")
    )

    events_by_reservation: dict[int, list[tuple[int, str, datetime.datetime]]] = defaultdict(list)
    for reservation_id, bed_id, status, created_at in rows:
        events_by_reservation[reservation_id].append((bed_id, status, created_at))

    checked_in = ReservationStatusChoices.CHECKED_IN
    intervals_by_bed: dict[int, list[tuple[datetime.datetime, datetime.datetime | None, int]]] = defaultdict(list)

    for reservation_id, events in events_by_reservation.items():
        # (check_in_time, bed_id) of the currently-open interval, or None.
        open_interval: tuple[datetime.datetime, int] | None = None
        prev_status: str | None = None
        for bed_id, status, created_at in events:
            is_in = status == checked_in
            was_in = prev_status == checked_in
            if is_in and not was_in:
                open_interval = (created_at, bed_id)
            elif was_in and not is_in and open_interval is not None:
                open_start, open_bed = open_interval
                intervals_by_bed[open_bed].append((open_start, created_at, reservation_id))
                open_interval = None
            prev_status = status
        if open_interval is not None:
            open_start, open_bed = open_interval
            intervals_by_bed[open_bed].append((open_start, None, reservation_id))

    for intervals in intervals_by_bed.values():
        intervals.sort(key=lambda interval: interval[0])
    return dict(intervals_by_bed)


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


def daily_occupancy(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
) -> "list[DailyOccupancyMetricsType]":
    """Daily occupied-bed counts and occupancy percentage for a shelter.

    A bed is occupied on an LA-local day when a reconstructed ``CHECKED_IN``
    interval (see ``_reservation_occupancy_intervals``) overlaps that day.
    ``total_beds`` is the number of beds that existed that day, from ``bed.add`` /
    ``bed.remove``. ``occupancy_pct`` is ``occupied / total * 100`` rounded to two
    places (``0.0`` when no beds existed).

    Both endpoints are inclusive and interpreted in America/Los_Angeles.

    Raises:
        ValueError: if ``end_date`` is before ``start_date``.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]
    from shelters.types.reporting import DailyOccupancyMetricsType

    _, end_utc = report_date_range_to_utc(start_date, end_date)
    days = iter_report_days(start_date, end_date)

    def _row(day: datetime.date, occupied: int, total: int) -> DailyOccupancyMetricsType:
        pct = round(occupied / total * 100, 2) if total else 0.0
        return DailyOccupancyMetricsType(date=day, occupied_count=occupied, total_beds=total, occupancy_pct=pct)

    # Beds that existed each day, reconstructed from bed.add / bed.remove.
    next_event_subq = (
        BedEvent.objects.filter(
            pgh_obj_id=OuterRef("pgh_obj_id"),
            pgh_created_at__gt=OuterRef("pgh_created_at"),
        )
        .order_by("pgh_created_at")
        .values("pgh_created_at")[:1]
    )
    bed_events = list(
        BedEvent.objects.filter(shelter_id=shelter.pk, pgh_created_at__lt=end_utc)
        .exclude(pgh_label="bed.remove")
        .annotate(next_event_at=Subquery(next_event_subq))
        .order_by("pgh_created_at")
        .values("pgh_obj_id", "pgh_created_at", "next_event_at")
    )

    # Every non-remove event belongs to a bed that was added, so these obj ids are
    # the shelter's full bed history, including beds later deleted.
    scope_bed_ids = {event["pgh_obj_id"] for event in bed_events}
    if not scope_bed_ids:
        return [_row(day, 0, 0) for day in days]

    intervals_by_bed = _reservation_occupancy_intervals(bed_ids=scope_bed_ids, end_utc=end_utc)

    results: list[DailyOccupancyMetricsType] = []
    for day in days:
        day_start, day_end = report_day_bounds_utc(day)

        existing_bed_ids = {
            event["pgh_obj_id"]
            for event in bed_events
            if event["pgh_created_at"] < day_end
            and (event["next_event_at"] is None or event["next_event_at"] >= day_end)
        }

        occupied_bed_ids: set[int] = set()
        for bed_id in existing_bed_ids:
            for check_in, freed, _reservation_id in intervals_by_bed.get(bed_id, ()):
                if check_in >= day_end:
                    break  # intervals sorted by check-in; the rest start even later
                if freed is not None and freed <= day_start:
                    continue  # interval ended before the day began
                occupied_bed_ids.add(bed_id)
                break

        results.append(_row(day, len(occupied_bed_ids), len(existing_bed_ids)))
    return results


def avg_days_to_occupancy(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
) -> float | None:
    """Average number of days a bed sat unoccupied before becoming occupied.

    For every occupancy interval whose check-in falls in the LA-local range and
    that is not the bed's first interval, the vacancy is the gap in days from the
    previous interval's freed instant to this check-in. A bed becomes free on any
    exit from CHECKED_IN (checkout or cancellation), so cancelled stays are
    measured correctly. Beds occupied from creation (no prior interval) and
    reverts on the same reservation are excluded. Returns the mean rounded to two
    places, or None when there are no qualifying pairs.

    Both endpoints are inclusive and interpreted in America/Los_Angeles.

    Raises:
        ValueError: if end_date is before start_date.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    start_utc, end_utc = report_date_range_to_utc(start_date, end_date)

    scope_bed_ids = set(
        BedEvent.objects.filter(shelter_id=shelter.pk, pgh_label="bed.add", pgh_created_at__lt=end_utc).values_list(
            "pgh_obj_id", flat=True
        )
    )
    if not scope_bed_ids:
        return None

    intervals_by_bed = _reservation_occupancy_intervals(bed_ids=scope_bed_ids, end_utc=end_utc)

    gaps: list[float] = []
    for intervals in intervals_by_bed.values():
        for index in range(1, len(intervals)):
            check_in, _freed, reservation_id = intervals[index]
            if not (start_utc <= check_in < end_utc):
                continue
            _prev_check_in, prev_freed, prev_reservation_id = intervals[index - 1]
            if prev_freed is None:
                continue  # previous interval never closed; can't overlap, guard
            if prev_reservation_id == reservation_id:
                continue  # revert on the same reservation, not a new occupancy
            gaps.append((check_in - prev_freed).total_seconds() / 86400.0)

    if not gaps:
        return None
    return round(sum(gaps) / len(gaps), 2)
