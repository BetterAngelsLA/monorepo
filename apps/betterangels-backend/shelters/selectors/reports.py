"""Report-gathering selectors — historical data aggregation."""

import datetime
from collections import Counter, defaultdict
from itertools import takewhile
from typing import TYPE_CHECKING, Iterable, TypedDict

import pghistory
from django.db import connection
from django.db.models import Avg, Count, F, OuterRef, Q, Subquery, TextField
from django.db.models.functions import Cast, Extract
from shelters.enums import BedStatusChoices

if TYPE_CHECKING:
    from shelters.models import Shelter
    from shelters.types.reporting import DailyOccupancyMetricsType, ReservationMetricsType


# ── Private helpers ───────────────────────────────────────────────────────────


def _validate_date_range(start_date: datetime.date, end_date: datetime.date) -> None:
    """Raise ``ValueError`` if *end_date* is before *start_date*."""
    if end_date < start_date:
        raise ValueError("end_date must be on or after start_date")


def _iter_report_days(start_date: datetime.date, end_date: datetime.date) -> list[datetime.date]:
    """Return every date from *start_date* to *end_date* inclusive.

    Delegates to PostgreSQL ``generate_series`` so the DB builds the date list
    rather than a Python loop.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT generate_series(%s, %s, '1 day'::interval)::date",
            [start_date, end_date],
        )
        return [row[0] for row in cursor.fetchall()]


def _shelter_bed_ids(*, shelter: "Shelter", end_utc: datetime.datetime) -> set[int]:
    """Bed IDs that were added to *shelter* before *end_utc*."""
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    return set(
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_label="bed.add",
            pgh_created_at__lt=end_utc,
        ).values_list("pgh_obj_id", flat=True)
    )


def _bed_events_with_next(
    *, shelter: "Shelter", end_utc: datetime.datetime
) -> list[dict]:
    """Bed events annotated with ``next_event_at``.

    Excludes ``bed.remove`` — a removed bed has no successor, effectively ending
    its lifecycle at the remove event.  The successor is found via a correlated
    subquery on the same bed (``pgh_obj_id``), unfiltered by shelter so that
    ``bed.remove`` events (which may lose ``shelter_id`` on ``bed.delete()``)
    are still reachable.

    ``Lead()`` was explored but Django pushes ``.exclude()`` into the WHERE
    clause before the window function computes, preventing ``bed.remove`` rows
    from being visible to the window.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    next_event_subq = (
        BedEvent.objects.filter(
            pgh_obj_id=OuterRef("pgh_obj_id"),
            pgh_created_at__gt=OuterRef("pgh_created_at"),
        )
        .order_by("pgh_created_at")
        .values("pgh_created_at")[:1]
    )

    return list(
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_created_at__lt=end_utc,
        )
        .exclude(pgh_label="bed.remove")
        .annotate(next_event_at=Subquery(next_event_subq))
        .order_by("pgh_created_at")
        .values("pgh_obj_id", "pgh_created_at", "next_event_at")
    )


def _occupancy_pct(occupied: int, total: int) -> float:
    """Occupancy percentage rounded to two places, or ``0.0`` when no beds exist."""
    return round(occupied / total * 100, 2) if total else 0.0


# ── Shared data reconstruction ────────────────────────────────────────────────


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


# ── Public types ──────────────────────────────────────────────────────────────


class DailyBedCounts(TypedDict):
    """A single day's bed status counts."""

    date: str
    available: int
    occupied: int
    reserved: int
    out_of_service: int


# ── Public selectors ──────────────────────────────────────────────────────────


def report_bed_status_counts(
    *, shelter: "Shelter", start_date: datetime.date, end_date: datetime.date
) -> list[DailyBedCounts]:
    """
    Returns daily bed status counts for each day in the range.

    Each BedEvent is valid from its ``pgh_created_at`` until the *next*
    event for the same bed (or forever if no next event).  A ``bed.remove``
    event ends the bed's lifecycle.  By annotating each event with its
    successor's timestamp via ``LEAD()`` we can answer "what was the status at
    the end of day X?" with a single query — no per-day round-trips, no
    DISTINCT ON.  Later events for the same bed naturally overwrite earlier
    ones, so the returned counts reflect the state as of 23:59:59.999 on
    each day.

    TODO: Add demographic filtering once pghistory tracks M2M through tables.
    Bed.demographics is M2M and pghistory only tracks scalar fields so we cannot
    reconstruct historically accurate demographic membership from BedEvent
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    _validate_date_range(start_date, end_date)
    end_of_range = datetime.datetime.combine(end_date, datetime.time.max, tzinfo=datetime.timezone.utc)

    events = list(
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_created_at__lt=end_of_range,
        )
        .exclude(pgh_label="bed.remove")
        .annotate(
            next_event_at=Subquery(
                BedEvent.objects.filter(
                    pgh_obj_id=OuterRef("pgh_obj_id"),
                    pgh_created_at__gt=OuterRef("pgh_created_at"),
                )
                .order_by("pgh_created_at")
                .values("pgh_created_at")[:1]
            ),
        )
        .order_by("pgh_created_at")
        .values("pgh_obj_id", "status", "pgh_created_at", "next_event_at")
    )

    days = _iter_report_days(start_date, end_date)

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

    return [_counts(day) for day in days]


def reservation_status_change_counts(
    *,
    shelter: "Shelter",
    start: datetime.datetime,
    end: datetime.datetime,
) -> "ReservationMetricsType":
    """Count reservation status-change events for *shelter* within an inclusive window.

    *start* and *end* are timezone-aware datetimes; they are converted to UTC
    internally.  The caller decides the timezone by passing appropriately
    constructed values.

    Returns a :class:`~shelters.types.reporting.ReservationMetricsType` with:

    - ``check_in_overdue`` — reservations that became overdue
    - ``cancelled`` — reservations that were cancelled
    - ``checked_in`` — reservations that were checked in
    - ``check_in_overdue_to_checked_in`` — overdue reservations that were
      subsequently checked in within the window (sourced from ``pgh_diff``)

    Each reservation is counted at most once per bucket (``distinct=True``).

    Args:
        shelter: ``Shelter`` whose reservations are aggregated.
        start: Inclusive lower bound (timezone-aware).
        end: Exclusive upper bound (timezone-aware).

    Raises:
        ValueError: If ``end`` is before ``start``.
    """
    from shelters.models import Reservation
    from shelters.types.reporting import ReservationMetricsType

    if end < start:
        raise ValueError("end must be on or after start")

    start_utc = start.astimezone(datetime.timezone.utc)
    end_utc = end.astimezone(datetime.timezone.utc)

    # pghistory.models.Events.pgh_obj_id is a text column; cast Reservation.pk to text for the IN.
    reservation_ids = (
        Reservation.objects.filter(Q(bed__shelter_id=shelter.pk) | Q(room__shelter_id=shelter.pk))
        .annotate(pk_text=Cast("pk", TextField()))
        .values("pk_text")
    )

    events = pghistory.models.Events.objects.filter(
        pgh_obj_id__in=reservation_ids,
        pgh_label="reservation.status_change",
        pgh_created_at__gte=start_utc,
        pgh_created_at__lt=end_utc,
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
    start: datetime.datetime,
    end: datetime.datetime,
) -> "list[DailyOccupancyMetricsType]":
    """Daily occupied-bed counts and occupancy percentage for a shelter.

    A bed is occupied on a day when a reconstructed ``CHECKED_IN`` interval
    (see ``_reservation_occupancy_intervals``) overlaps that day.  ``total_beds``
    is the number of beds that existed that day, from ``bed.add`` / ``bed.remove``.
    ``occupancy_pct`` is ``occupied / total * 100`` rounded to two places
    (``0.0`` when no beds existed).

    *start* and *end* are timezone-aware datetimes.  The caller's timezone
    determines where each day begins and ends (e.g. ``ZoneInfo("America/Los_Angeles")``).

    Raises:
        ValueError: if ``end`` is before ``start``.
    """
    from shelters.types.reporting import DailyOccupancyMetricsType

    if end < start:
        raise ValueError("end must be on or after start")

    tz = start.tzinfo
    if tz is None:
        raise ValueError("start must be timezone-aware")

    start_utc = start.astimezone(datetime.timezone.utc)
    end_utc = end.astimezone(datetime.timezone.utc)

    # Derive calendar-date range from the caller's timezone.
    start_date = start.date()
    end_date = (end - datetime.timedelta(microseconds=1)).date() if end > start else start_date
    days = _iter_report_days(start_date, end_date)

    scope_bed_ids = _shelter_bed_ids(shelter=shelter, end_utc=end_utc)
    if not scope_bed_ids:
        return [
            DailyOccupancyMetricsType(date=day, occupied_count=0, total_beds=0, occupancy_pct=0.0)
            for day in days
        ]

    bed_events = _bed_events_with_next(shelter=shelter, end_utc=end_utc)
    intervals_by_bed = _reservation_occupancy_intervals(bed_ids=scope_bed_ids, end_utc=end_utc)

    results: list[DailyOccupancyMetricsType] = []
    for day in days:
        day_start = datetime.datetime.combine(day, datetime.time.min, tzinfo=tz).astimezone(
            datetime.timezone.utc
        )
        day_end = datetime.datetime.combine(
            day + datetime.timedelta(days=1), datetime.time.min, tzinfo=tz
        ).astimezone(datetime.timezone.utc)

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

        results.append(
            DailyOccupancyMetricsType(
                date=day,
                occupied_count=len(occupied_bed_ids),
                total_beds=len(existing_bed_ids),
                occupancy_pct=_occupancy_pct(len(occupied_bed_ids), len(existing_bed_ids)),
            )
        )
    return results


def avg_days_to_occupancy(
    *,
    shelter: "Shelter",
    start_date: datetime.date,
    end_date: datetime.date,
) -> float | None:
    """Average number of days a bed sat unoccupied before becoming occupied.

    For each check-in event (status changed TO checked_in) whose timestamp
    falls in the date range, the vacancy is the gap between that check-in and
    the most recent time the same bed was freed by a *different* reservation.
    A bed is freed on any exit from CHECKED_IN — checkout or cancellation.

    Returns the mean rounded to two decimal places.  Returns ``None`` when
    there are no gaps to measure — for example when every bed was occupied
    from creation, every check-in fell outside the range, or all gaps are
    same-reservation reverts.

    Both endpoints are inclusive and treated as UTC calendar dates
    (start-of-day to start-of-next-day).

    Raises:
        ValueError: if end_date is before start_date.
    """
    _validate_date_range(start_date, end_date)

    start_utc = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=datetime.timezone.utc)
    end_utc = datetime.datetime.combine(
        end_date + datetime.timedelta(days=1), datetime.time.min, tzinfo=datetime.timezone.utc
    )
    Events = pghistory.models.Events

    scope_bed_ids = _shelter_bed_ids(shelter=shelter, end_utc=end_utc)
    if not scope_bed_ids:
        return None

    # pgh_diff is a JSONField storing before/after values as arrays:
    #   {"status": ["old_value", "new_value"]}
    #   __0 = index 0 (status *before* the change)
    #   __1 = index 1 (status *after* the change)
    #
    # Check-in events: status changed TO checked_in within the range.
    checkins = Events.objects.filter(
        pgh_label="reservation.status_change",
        pgh_data__bed_id__in=list(scope_bed_ids),
        pgh_created_at__gte=start_utc,
        pgh_created_at__lt=end_utc,
        pgh_data__status="checked_in",
    ).exclude(
        pgh_diff__status__0="checked_in",
    )

    # Correlated subquery: most recent "free" event (exited checked_in)
    # on the same bed, from a *different* reservation, at or before this check-in.
    prev_free = (
        Events.objects.filter(
            pgh_label="reservation.status_change",
            pgh_data__bed_id=OuterRef("pgh_data__bed_id"),
            pgh_created_at__lte=OuterRef("pgh_created_at"),
            pgh_diff__status__0="checked_in",
        )
        .exclude(pgh_diff__status__1="checked_in")
        .exclude(pgh_obj_id=OuterRef("pgh_obj_id"))
        .order_by("-pgh_created_at")
        .values("pgh_created_at")[:1]
    )

    result = (
        checkins.annotate(prev_freed=Subquery(prev_free))
        .filter(prev_freed__isnull=False)
        .annotate(
            gap_days=(
                Extract(F("pgh_created_at"), "epoch")
                - Extract(F("prev_freed"), "epoch")
            )
            / 86400.0,  # seconds per day → fractional days
        )
        .aggregate(avg=Avg("gap_days"))
    )

    avg_val = result["avg"]
    return round(avg_val, 2) if avg_val is not None else None
