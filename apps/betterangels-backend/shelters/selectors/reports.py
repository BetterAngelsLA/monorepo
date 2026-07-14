"""Report-gathering selectors — historical data aggregation."""

import dataclasses
import datetime
from collections import Counter, defaultdict
from itertools import groupby, takewhile
from typing import TYPE_CHECKING

import pghistory
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


def _report_days(start_date: datetime.date, end_date: datetime.date) -> list[datetime.date]:
    """Return every date from *start_date* to *end_date* inclusive."""
    n = (end_date - start_date).days + 1
    return [start_date + datetime.timedelta(days=i) for i in range(n)]


@dataclasses.dataclass(frozen=True, slots=True)
class BedLifecycle:
    """A bed's existence window within the shelter.

    Each bed has exactly one ``bed.add`` event (the trigger).  A subsequent
    ``bed.remove`` closes the window; ``removed_at`` is ``None`` if the bed
    was never removed.
    """

    bed_id: int
    added_at: datetime.datetime
    removed_at: datetime.datetime | None


def _bed_lifecycles(*, shelter: "Shelter", end_utc: datetime.datetime) -> list[BedLifecycle]:
    """Return ``(bed_id, added_at, removed_at_or_None)`` for beds added before *end_utc*.

    Uses a single LEFT JOIN between ``bed.add`` and ``bed.remove`` — zero
    correlated subqueries.  A bed exists on day *D* iff ``added_at < D_end``
    AND (``removed_at IS NULL`` OR ``removed_at >= D_end``).

    Expected index: ``(shelter_id, pgh_label, pgh_created_at)`` on BedEvent.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    add_rows = (
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_label="bed.add",
            pgh_created_at__lt=end_utc,
        )
        .values_list("pgh_obj_id", "pgh_created_at")
    )

    # Deduplicate add events per bed (keep earliest).  Duplicates shouldn't
    # happen in practice, but pghistory can emit multiple events in a txn.
    added: dict[int, datetime.datetime] = {}
    for bed_id, created_at in add_rows:
        if bed_id not in added or created_at < added[bed_id]:
            added[bed_id] = created_at

    if not added:
        return []

    # One query for remove events.  groupby picks the latest per bed
    # (rows are ordered by bed_id ASC, created_at DESC).
    remove_rows = (
        BedEvent.objects.filter(
            pgh_obj_id__in=list(added),
            pgh_label="bed.remove",
            pgh_created_at__lt=end_utc,
        )
        .order_by("pgh_obj_id", "-pgh_created_at")
        .values_list("pgh_obj_id", "pgh_created_at")
    )
    removed: dict[int, datetime.datetime] = {}
    for bed_id, group in groupby(remove_rows, key=lambda r: r[0]):
        removed[bed_id] = next(group)[1]  # first row in each group is the latest

    return [
        BedLifecycle(bed_id=bid, added_at=added[bid], removed_at=removed.get(bid))
        for bid in sorted(added)
    ]


@dataclasses.dataclass(frozen=True, slots=True)
class OccupancyInterval:
    """A period when a reservation occupied a bed."""

    check_in: datetime.datetime
    freed: datetime.datetime | None  # None = still occupied
    reservation_id: int


def _occupancy_pct(occupied: int, total: int) -> float:
    """Occupancy percentage rounded to two places, or ``0.0`` when no beds exist."""
    return round(occupied / total * 100, 2) if total else 0.0


def _day_end_utc(day: datetime.date, tz: datetime.tzinfo) -> datetime.datetime:
    """UTC timestamp of midnight at the *start* of the day after *day* in *tz*.

    This is the exclusive upper bound for events that fall on *day*.
    """
    return datetime.datetime.combine(
        day + datetime.timedelta(days=1), datetime.time.min, tzinfo=tz
    ).astimezone(datetime.timezone.utc)


# ── Shared data reconstruction ────────────────────────────────────────────────


def _reservation_status_intervals(
    *,
    bed_ids: set[int],
    end_utc: datetime.datetime,
    target_statuses: frozenset[str],
) -> dict[int, list[OccupancyInterval]]:
    """Reconstruct per-bed intervals where a reservation was in one of *target_statuses*.

    Reads every ``ReservationEvent`` (any label) with ``pgh_created_at < end_utc``
    whose snapshotted ``bed_id`` is in ``bed_ids``, groups by reservation, and
    walks each chronologically.  An interval opens when a reservation enters a
    target status (without already being in one) and closes when it leaves the
    set.  Still-open intervals at the reservation's last event are returned with
    ``freed=None``.

    Used for both CHECKED_IN occupancy and RESERVED (CONFIRMED/CHECK_IN_OVERDUE)
    intervals — the only difference is *target_statuses*.

    Returns ``{bed_id: [OccupancyInterval, ...]}`` with each list sorted by
    ``check_in``.
    """
    from shelters.models import Reservation

    if not bed_ids:
        return {}

    reservation_event_model = Reservation.pgh_event_model  # type: ignore[attr-defined]
    rows = (
        reservation_event_model.objects.filter(bed_id__in=bed_ids, pgh_created_at__lt=end_utc)
        .order_by("pgh_obj_id", "pgh_created_at", "pgh_id")
        .values_list("pgh_obj_id", "bed_id", "status", "pgh_created_at")
    )

    intervals_by_bed: dict[int, list[OccupancyInterval]] = defaultdict(list)

    for reservation_id, group in groupby(rows, key=lambda r: r[0]):
        open_start: datetime.datetime | None = None
        open_bed: int | None = None
        prev_status: str | None = None
        for _rid, bed_id, status, created_at in group:
            was_target = prev_status in target_statuses
            is_target = status in target_statuses

            if is_target and not was_target:
                open_start, open_bed = created_at, bed_id
            elif was_target and not is_target and open_start is not None:
                intervals_by_bed[open_bed].append(
                    OccupancyInterval(check_in=open_start, freed=created_at, reservation_id=reservation_id)
                )
                open_start = None
            prev_status = status

        if open_start is not None:
            intervals_by_bed[open_bed].append(
                OccupancyInterval(check_in=open_start, freed=None, reservation_id=reservation_id)
            )

    for intervals in intervals_by_bed.values():
        intervals.sort(key=lambda interval: interval.check_in)
    return dict(intervals_by_bed)


# Reserved statuses used by callers of _reservation_status_intervals.
_CHECKED_IN = frozenset({"checked_in"})
_CONFIRMED_OR_OVERDUE = frozenset({"confirmed", "check_in_overdue"})


def _checkout_times_by_bed(
    *, bed_ids: set[int], end_utc: datetime.datetime
) -> dict[int, list[datetime.datetime]]:
    """Return ``{bed_id: [checkout_datetime, ...]}`` for COMPLETED reservations with ``checked_out_at`` set.

    Only returns checkouts where ``checked_out_at < end_utc``.
    """
    from shelters.enums import ReservationStatusChoices
    from shelters.models import Reservation

    if not bed_ids:
        return {}

    reservation_event_model = Reservation.pgh_event_model  # type: ignore[attr-defined]
    # The most recent status_change to COMPLETED with checked_out_at set.
    rows = (
        reservation_event_model.objects.filter(
            bed_id__in=bed_ids,
            pgh_created_at__lt=end_utc,
            pgh_label="reservation.status_change",
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at__isnull=False,
        )
        .order_by("bed_id", "-pgh_created_at")
        .values_list("bed_id", "checked_out_at")
        .distinct("bed_id")  # latest per bed
    )

    result: dict[int, list[datetime.datetime]] = defaultdict(list)
    for bed_id, checked_out_at in rows:
        result[bed_id].append(checked_out_at)
    return dict(result)


def _interval_active_at(
    intervals: list[OccupancyInterval],
    at: datetime.datetime,
) -> bool:
    """Return ``True`` if *at* falls within any interval (``[check_in, freed)``)."""
    for interval in intervals:
        if interval.check_in < at and (interval.freed is None or interval.freed >= at):
            return True
        if interval.check_in >= at:
            break  # intervals are sorted by check_in
    return False


def _in_turnaround_at(
    bed_id: int,
    at: datetime.datetime,
    last_cleaned: datetime.datetime | None,
    checkout_times: dict[int, list[datetime.datetime]],
) -> bool:
    """Return ``True`` if *bed_id* is IN_TURNAROUND at *at*.

    A bed is in turnaround when a completed checkout exists after *last_cleaned*
    (i.e. the bed was used and hasn't been cleaned since).
    """
    if last_cleaned is None:
        return False
    for co in checkout_times.get(bed_id, ()):
        if co > last_cleaned and co < at:
            return True
    return False


# ── Public types ──────────────────────────────────────────────────────────────


@dataclasses.dataclass
class DailyBedCounts:
    """A single day's bed status counts."""

    date: str
    available: int = 0
    occupied: int = 0
    reserved: int = 0
    out_of_service: int = 0
    in_turnaround: int = 0


# ── Public selectors ──────────────────────────────────────────────────────────


def report_bed_status_counts(
    *, shelter: "Shelter", start_date: datetime.date, end_date: datetime.date
) -> list[DailyBedCounts]:
    """Return daily bed status counts for *shelter* across an inclusive date range.

    Bed status follows the priority chain defined in
    :mod:`shelters.selectors.computed_status`:

        OUT_OF_SERVICE → OCCUPIED → RESERVED → IN_TURNAROUND → AVAILABLE

    The status at end-of-day on each date is reconstructed from three
    independent event streams:

    * **Bed events** (``bed.add`` / ``bed.update``) — ``maintenance_flag``
      and ``last_cleaned`` snapshots.
    * **Reservation occupancy intervals** — ``CHECKED_IN`` periods
      (see ``_reservation_status_intervals``).
    * **Reservation reserved intervals** — ``CONFIRMED`` /
      ``CHECK_IN_OVERDUE`` periods before check-in
      (see ``_reservation_status_intervals``).

    Both endpoints are inclusive and treated as UTC calendar dates
    (start-of-day to start-of-next-day).

    Raises:
        ValueError: if *end_date* is before *start_date*.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]

    _validate_date_range(start_date, end_date)

    utc = datetime.timezone.utc
    start_utc = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=utc)
    end_utc = datetime.datetime.combine(
        end_date + datetime.timedelta(days=1), datetime.time.min, tzinfo=utc
    )

    days = _report_days(start_date, end_date)

    # 1. Bed existence windows.
    lifecycles = _bed_lifecycles(shelter=shelter, end_utc=end_utc)
    if not lifecycles:
        return [DailyBedCounts(date=day.isoformat()) for day in days]

    scope_bed_ids = {lc.bed_id for lc in lifecycles}

    # 2. Bed operational state snapshots — the latest ``bed.add`` or
    #    ``bed.update`` before *end_utc* for each bed, keyed by (bed_id, time).
    bed_snapshots: dict[int, list[tuple[datetime.datetime, bool, datetime.datetime | None]]] = defaultdict(list)
    snapshot_rows = (
        BedEvent.objects.filter(
            pgh_obj_id__in=list(scope_bed_ids),
            pgh_created_at__lt=end_utc,
            pgh_label__in=["bed.add", "bed.update"],
        )
        .order_by("pgh_obj_id", "pgh_created_at")
        .values_list("pgh_obj_id", "pgh_created_at", "maintenance_flag", "last_cleaned")
    )
    for bed_id, created_at, maint_flag, last_cleaned in snapshot_rows:
        bed_snapshots[bed_id].append((created_at, bool(maint_flag), last_cleaned))

    # 3. Occupancy intervals (CHECKED_IN).
    occupancy = _reservation_status_intervals(bed_ids=scope_bed_ids, end_utc=end_utc, target_statuses=_CHECKED_IN)

    # 4. Reserved intervals (CONFIRMED / CHECK_IN_OVERDUE before check-in).
    reserved = _reservation_status_intervals(bed_ids=scope_bed_ids, end_utc=end_utc, target_statuses=_CONFIRMED_OR_OVERDUE)

    # 5. Completed checkout times (for IN_TURNAROUND).
    checkout_times = _checkout_times_by_bed(bed_ids=scope_bed_ids, end_utc=end_utc)

    # 6. Per-day status computation — point-in-time at end-of-day.
    #    The priority chain is applied per bed: each bed gets exactly one
    #    status per day.
    results: list[DailyBedCounts] = []
    for day in days:
        day_end_utc = _day_end_utc(day, utc)

        counts: Counter[str] = Counter()

        for lc in lifecycles:
            if lc.added_at >= day_end_utc:
                continue  # bed not yet added
            if lc.removed_at is not None and lc.removed_at < day_end_utc:
                continue  # bed already removed

            bed_id = lc.bed_id

            # Find the latest operational snapshot at or before day_end_utc.
            snapshots = bed_snapshots.get(bed_id, ())
            maint_flag = False
            last_cleaned: datetime.datetime | None = None
            for created_at, mf, lc_val in reversed(snapshots):
                if created_at < day_end_utc:
                    maint_flag, last_cleaned = mf, lc_val
                    break

            # Apply the priority chain: first matching status wins.
            # OUT_OF_SERVICE → OCCUPIED → RESERVED → IN_TURNAROUND → AVAILABLE
            occupied = _interval_active_at(occupancy.get(bed_id, ()), day_end_utc)
            reserved_active = _interval_active_at(reserved.get(bed_id, ()), day_end_utc)
            in_turnaround = _in_turnaround_at(bed_id, day_end_utc, last_cleaned, checkout_times)

            if maint_flag:
                counts[BedStatusChoices.OUT_OF_SERVICE] += 1
            elif occupied:
                counts[BedStatusChoices.OCCUPIED] += 1
            elif reserved_active:
                counts[BedStatusChoices.RESERVED] += 1
            elif in_turnaround:
                counts[BedStatusChoices.IN_TURNAROUND] += 1
            else:
                counts[BedStatusChoices.AVAILABLE] += 1

        results.append(
            DailyBedCounts(
                date=day.isoformat(),
                available=counts.get(BedStatusChoices.AVAILABLE, 0),
                occupied=counts.get(BedStatusChoices.OCCUPIED, 0),
                reserved=counts.get(BedStatusChoices.RESERVED, 0),
                out_of_service=counts.get(BedStatusChoices.OUT_OF_SERVICE, 0),
                in_turnaround=counts.get(BedStatusChoices.IN_TURNAROUND, 0),
            )
        )
    return results


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
    (see ``_reservation_status_intervals``) overlaps that day.  ``total_beds``
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
    days = _report_days(start_date, end_date)

    lifecycles = _bed_lifecycles(shelter=shelter, end_utc=end_utc)
    if not lifecycles:
        return [
            DailyOccupancyMetricsType(date=day, occupied_count=0, total_beds=0, occupancy_pct=0.0)
            for day in days
        ]

    scope_bed_ids = {lc.bed_id for lc in lifecycles}
    intervals_by_bed = _reservation_status_intervals(bed_ids=scope_bed_ids, end_utc=end_utc, target_statuses=_CHECKED_IN)

    # Pre-compute occupied-bed sets by calendar date (O(I × avg_stay_days)).
    # Each interval is expanded to the calendar dates it covers (clamped to
    # the report range) so that the per-day lookup is O(1).
    occupied_by_day: dict[datetime.date, set[int]] = defaultdict(set)
    for bed_id, intervals in intervals_by_bed.items():
        for interval in intervals:
            first = interval.check_in.astimezone(tz).date()
            if first < start_date:
                first = start_date
            if interval.freed is None:
                last = end_date
            else:
                freed_date = (interval.freed - datetime.timedelta(microseconds=1)).astimezone(tz).date()
                last = freed_date if freed_date < end_date else end_date
            cursor = first
            while cursor <= last:
                occupied_by_day[cursor].add(bed_id)
                cursor += datetime.timedelta(days=1)

    results: list[DailyOccupancyMetricsType] = []
    for day in days:
        day_end = _day_end_utc(day, tz)

        # Beds that exist on this day: added before day_end, not yet removed.
        # ``lifecycles`` are sorted by added_at; takewhile stops scanning
        # once added_at >= day_end — beds added later can't exist yet.
        existing_bed_ids = {
            lc.bed_id
            for lc in takewhile(lambda lc: lc.added_at < day_end, lifecycles)
            if lc.removed_at is None or lc.removed_at >= day_end
        }

        occupied_bed_ids = occupied_by_day.get(day, set()) & existing_bed_ids

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

    scope_bed_ids = {lc.bed_id for lc in _bed_lifecycles(shelter=shelter, end_utc=end_utc)}
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
