"""Report-gathering selectors — historical data aggregation."""

import dataclasses
import datetime
from collections import Counter, defaultdict
from itertools import groupby
from typing import TYPE_CHECKING

from django.db.models import Count, Q, TextField
from django.db.models.functions import Cast

import pghistory

from shelters.enums import BedStatusChoices, ReservationStatusChoices

if TYPE_CHECKING:
    from shelters.models import Shelter
    from shelters.types.reporting import DailyOccupancyMetricsType, ReservationMetricsType


# ── Private helpers ───────────────────────────────────────────────────────────


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


def _bed_lifecycles(*, shelter: "Shelter", before: datetime.datetime) -> list[BedLifecycle]:
    """Return ``(bed_id, added_at, removed_at_or_None)`` for beds added before *before*.

    *before* must be timezone-aware.  Django converts it to UTC for the
    database query automatically.  A bed exists on day *D* iff
    ``added_at < D_end`` AND (``removed_at IS NULL`` OR ``removed_at >= D_end``).

    Expected index: ``(shelter_id, pgh_label, pgh_created_at)`` on BedEvent.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]  # pghistory event model; inline to avoid circular import

    add_rows = (
        BedEvent.objects.filter(
            shelter_id=shelter.pk,
            pgh_label="bed.add",
            pgh_created_at__lt=before,
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
            pgh_created_at__lt=before,
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


def _day_end(day: datetime.date, tz: datetime.tzinfo) -> datetime.datetime:
    """Midnight at the start of the day after *day* in *tz* as a tz-aware datetime.

    This is the exclusive upper bound for events that fall on *day*.
    """
    return datetime.datetime.combine(
        day + datetime.timedelta(days=1), datetime.time.min, tzinfo=tz
    )


# ── Shared data reconstruction ────────────────────────────────────────────────


def _reservation_status_intervals(
    *,
    bed_ids: set[int],
    before: datetime.datetime,
    target_statuses: frozenset[str],
) -> dict[int, list[OccupancyInterval]]:
    """Reconstruct per-bed intervals where a reservation was in one of *target_statuses*.

    Reads every ``ReservationEvent`` (any label) with ``pgh_created_at < before``
    whose snapshotted ``bed_id`` is in ``bed_ids``, groups by reservation, and
    walks each chronologically.  An interval opens when a reservation enters a
    target status (without already being in one) and closes when it leaves the
    set.  Still-open intervals at the reservation's last event are returned with
    ``freed=None``.

    *before* must be timezone-aware; Django converts it to UTC automatically.

    Used for both CHECKED_IN occupancy and RESERVED (CONFIRMED/CHECK_IN_OVERDUE)
    intervals — the only difference is *target_statuses*.

    Returns ``{bed_id: [OccupancyInterval, ...]}`` with each list sorted by
    ``check_in``.
    """
    from shelters.models import Reservation  # inline to avoid circular import

    if not bed_ids:
        return {}

    reservation_event_model = Reservation.pgh_event_model  # type: ignore[attr-defined]
    rows = (
        reservation_event_model.objects.filter(bed_id__in=bed_ids, pgh_created_at__lt=before)
        .order_by("pgh_obj_id", "pgh_created_at", "pgh_id")
        .values_list("pgh_obj_id", "bed_id", "status", "pgh_created_at")
    )

    intervals_by_bed: dict[int, list[OccupancyInterval]] = defaultdict(list)

    for reservation_id, group in groupby(rows, key=lambda r: r[0]):
        open_start: datetime.datetime | None = None
        open_bed: int | None = None
        prev_status: str | None = None
        prev_bed: int | None = None
        for _, bed_id, status, created_at in group:
            # Skip consecutive duplicate events (pghistory can emit multiples
            # in a transaction — same pattern as _bed_lifecycles dedup).
            if status == prev_status and bed_id == prev_bed:
                continue
            was_target = prev_status in target_statuses
            is_target = status in target_statuses

            if is_target and not was_target:
                open_start, open_bed = created_at, bed_id
            elif was_target and not is_target and open_start is not None:
                assert open_bed is not None  # set together with open_start
                intervals_by_bed[open_bed].append(
                    OccupancyInterval(check_in=open_start, freed=created_at, reservation_id=reservation_id)
                )
                open_start = None
            prev_status = status
            prev_bed = bed_id

        if open_start is not None:
            assert open_bed is not None  # set together with open_start
            intervals_by_bed[open_bed].append(
                OccupancyInterval(check_in=open_start, freed=None, reservation_id=reservation_id)
            )

    for intervals in intervals_by_bed.values():
        intervals.sort(key=lambda interval: interval.check_in)
    return dict(intervals_by_bed)


# Reserved statuses used by callers of _reservation_status_intervals.
_CHECKED_IN = frozenset({"checked_in"})
_CONFIRMED_OR_OVERDUE = frozenset({"confirmed", "check_in_overdue"})


def _latest_checkout_by_bed(
    *, bed_ids: set[int], before: datetime.datetime
) -> dict[int, datetime.datetime]:
    """Return ``{bed_id: latest_checkout_datetime}`` for COMPLETED reservations with ``checked_out_at`` set.

    Only returns checkouts where ``checked_out_at < before``.
    *before* must be timezone-aware; Django converts it to UTC automatically.
    """
    from shelters.models import Reservation  # inline to avoid circular import

    if not bed_ids:
        return {}

    reservation_event_model = Reservation.pgh_event_model  # type: ignore[attr-defined]
    # The most recent status_change to COMPLETED with checked_out_at set.
    # Rows are ordered by bed ASC, created_at DESC — groupby picks the first
    # (latest) per bed, same pattern as _bed_lifecycles.
    rows = (
        reservation_event_model.objects.filter(
            bed_id__in=bed_ids,
            pgh_created_at__lt=before,
            pgh_label="reservation.status_change",
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at__isnull=False,
        )
        .order_by("bed_id", "-pgh_created_at")
        .values_list("bed_id", "checked_out_at")
    )

    result: dict[int, datetime.datetime] = {}
    for bed_id, group in groupby(rows, key=lambda r: r[0]):
        result[bed_id] = next(group)[1]  # first in group = latest checkout
    return result


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
    checkout_times: dict[int, datetime.datetime],
) -> bool:
    """Return ``True`` if *bed_id* is IN_TURNAROUND at *at*.

    A bed is in turnaround when a completed checkout exists after
    ``last_cleaned`` (or the bed was never cleaned at all).
    """
    co = checkout_times.get(bed_id)
    if co is None:
        return False
    return (last_cleaned is None or co > last_cleaned) and co < at


# ── Public types ──────────────────────────────────────────────────────────────


@dataclasses.dataclass
class DailyBedCounts:
    """A single day's bed status counts."""

    date: datetime.date
    available: int = 0
    occupied: int = 0
    reserved: int = 0
    out_of_service: int = 0
    in_turnaround: int = 0


# ── Public selectors ──────────────────────────────────────────────────────────


def report_bed_status_counts(
    *, shelter: "Shelter", start: datetime.datetime, end: datetime.datetime
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

    *start* and *end* are timezone-aware datetimes.  The caller's timezone
    determines where each day begins and ends.  *end* is exclusive (midnight
    of the day after the last report day).

    Raises:
        ValueError: if *end* is before *start*, or if either is naive.
    """
    from shelters.models import BedEvent  # type: ignore[attr-defined]  # pghistory event model; inline to avoid circular import

    if end < start:
        raise ValueError("end must be on or after start")
    if start.tzinfo is None:
        raise ValueError("start must be timezone-aware")
    if end.tzinfo is None:
        raise ValueError("end must be timezone-aware")

    tz = start.tzinfo

    start_date = start.date()
    end_date = (end - datetime.timedelta(microseconds=1)).date() if end > start else start_date
    days = _report_days(start_date, end_date)

    # 1. Bed existence windows.
    lifecycles = _bed_lifecycles(shelter=shelter, before=end)
    if not lifecycles:
        return [DailyBedCounts(date=day) for day in days]

    scope_bed_ids = {lc.bed_id for lc in lifecycles}

    # 2. Bed operational state snapshots — the latest ``bed.add`` or
    #    ``bed.update`` before *end* for each bed, keyed by (bed_id, time).
    bed_snapshots: dict[int, list[tuple[datetime.datetime, bool, datetime.datetime | None]]] = defaultdict(list)
    snapshot_rows = (
        BedEvent.objects.filter(
            pgh_obj_id__in=list(scope_bed_ids),
            pgh_created_at__lt=end,
            pgh_label__in=["bed.add", "bed.update"],
        )
        .order_by("pgh_obj_id", "pgh_created_at")
        .values_list("pgh_obj_id", "pgh_created_at", "maintenance_flag", "last_cleaned")
    )
    for bed_id, created_at, maint_flag, lc_val in snapshot_rows:
        bed_snapshots[bed_id].append((created_at, bool(maint_flag), lc_val))

    # 3. Occupancy intervals (CHECKED_IN).
    occupancy = _reservation_status_intervals(bed_ids=scope_bed_ids, before=end, target_statuses=_CHECKED_IN)

    # 4. Reserved intervals (CONFIRMED / CHECK_IN_OVERDUE before check-in).
    reserved = _reservation_status_intervals(bed_ids=scope_bed_ids, before=end, target_statuses=_CONFIRMED_OR_OVERDUE)

    # 5. Completed checkout times (for IN_TURNAROUND).
    checkout_times = _latest_checkout_by_bed(bed_ids=scope_bed_ids, before=end)

    # 6. Per-day status computation — point-in-time at end-of-day.
    #    The priority chain is applied per bed: each bed gets exactly one
    #    status per day.
    #
    #    Snapshot lookup uses forward-only cursors: day_end is monotonic,
    #    so each bed's latest applicable snapshot index only moves forward.
    #    Total cost is O(S) across all days instead of O(S × D).
    snapshot_cursors: dict[int, int] = defaultdict(lambda: -1)

    results: list[DailyBedCounts] = []
    for day in days:
        day_end = _day_end(day, tz)

        counts: Counter[str] = Counter()

        for lc in lifecycles:
            if lc.added_at >= day_end:
                continue  # bed not yet added
            if lc.removed_at is not None and lc.removed_at < day_end:
                continue  # bed already removed

            bed_id = lc.bed_id

            # Advance cursor to the latest snapshot ≤ day_end.
            snapshots = bed_snapshots.get(bed_id, ())
            idx = snapshot_cursors[bed_id]
            while idx + 1 < len(snapshots) and snapshots[idx + 1][0] < day_end:
                idx += 1
            snapshot_cursors[bed_id] = idx

            maint_flag = False
            last_cleaned: datetime.datetime | None = None
            if idx >= 0:
                _, maint_flag, last_cleaned = snapshots[idx]

            # Apply the priority chain: first matching status wins.
            # OUT_OF_SERVICE → OCCUPIED → RESERVED → IN_TURNAROUND → AVAILABLE
            occupied = _interval_active_at(occupancy.get(bed_id, []), day_end)
            reserved_active = _interval_active_at(reserved.get(bed_id, []), day_end)
            in_turnaround = _in_turnaround_at(bed_id, day_end, last_cleaned, checkout_times)

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
                date=day,
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

    *start* and *end* are timezone-aware datetimes — Django converts them to
    UTC for database queries, so no manual conversion is needed.

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
    from shelters.models import Reservation  # inline to avoid circular import
    from shelters.types.reporting import ReservationMetricsType  # inline to avoid circular import

    if end < start:
        raise ValueError("end must be on or after start")
    if start.tzinfo is None:
        raise ValueError("start must be timezone-aware")

    # pgh_obj_id is a text column; cast Reservation.pk to text for the IN.
    reservation_ids = (
        Reservation.objects.filter(Q(bed__shelter_id=shelter.pk) | Q(room__shelter_id=shelter.pk))
        .annotate(pk_text=Cast("pk", TextField()))
        .values("pk_text")
    )

    events = pghistory.models.Events.objects.filter(
        pgh_obj_id__in=reservation_ids,
        pgh_label="reservation.status_change",
        pgh_created_at__gte=start,
        pgh_created_at__lt=end,
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
    from shelters.types.reporting import DailyOccupancyMetricsType  # inline to avoid circular import

    if end < start:
        raise ValueError("end must be on or after start")

    tz = start.tzinfo
    if tz is None:
        raise ValueError("start must be timezone-aware")

    # Derive calendar-date range from the caller's timezone.
    start_date = start.date()
    end_date = (end - datetime.timedelta(microseconds=1)).date() if end > start else start_date
    days = _report_days(start_date, end_date)

    lifecycles = _bed_lifecycles(shelter=shelter, before=end)
    if not lifecycles:
        return [
            DailyOccupancyMetricsType(date=day, occupied_count=0, total_beds=0, occupancy_pct=0.0)
            for day in days
        ]

    scope_bed_ids = {lc.bed_id for lc in lifecycles}
    intervals_by_bed = _reservation_status_intervals(bed_ids=scope_bed_ids, before=end, target_statuses=_CHECKED_IN)

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
                # The last fully-occupied day is the day *before* the freed
                # date (in the caller's tz).  At end-of-day D the interval is
                # only active if freed >= midnight of D+1, which fails on the
                # freed date itself.
                freed_day = interval.freed.astimezone(tz).date()
                last = freed_day - datetime.timedelta(days=1)
                if last < start_date:
                    continue  # interval ended entirely before the report range
                if last > end_date:
                    last = end_date
            cursor = first
            while cursor <= last:
                occupied_by_day[cursor].add(bed_id)
                cursor += datetime.timedelta(days=1)

    results: list[DailyOccupancyMetricsType] = []
    for day in days:
        day_end = _day_end(day, tz)

        # Beds that exist on this day: added before day_end, not yet removed.
        # ``lifecycles`` are sorted by added_at, so we can break early.
        existing_bed_ids: set[int] = set()
        for lc in lifecycles:
            if lc.added_at >= day_end:
                break
            if lc.removed_at is None or lc.removed_at >= day_end:
                existing_bed_ids.add(lc.bed_id)

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
    start: datetime.datetime,
    end: datetime.datetime,
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

    *start* and *end* are timezone-aware datetimes.  *end* is exclusive.
    The caller's timezone determines which check-ins fall in range.

    Raises:
        ValueError: if *end* is before *start*, or if either is naive.
    """
    if end < start:
        raise ValueError("end must be on or after start")
    if start.tzinfo is None:
        raise ValueError("start must be timezone-aware")

    Events = pghistory.models.Events

    scope_bed_ids = {lc.bed_id for lc in _bed_lifecycles(shelter=shelter, before=end)}
    if not scope_bed_ids:
        return None

    # pgh_diff is a JSONField storing before/after values as arrays:
    #   {"status": ["old_value", "new_value"]}
    #   __0 = index 0 (status *before* the change)
    #   __1 = index 1 (status *after* the change)
    #
    # Fetch all status_change events for beds in scope before *end* and walk
    # them per bed chronologically — pairing each in-range check-in with the
    # most recent prior "free" event (exit from checked_in) on the same bed.
    rows = (
        Events.objects.filter(
            pgh_label="reservation.status_change",
            pgh_data__bed_id__in=list(scope_bed_ids),
            pgh_created_at__lt=end,
        )
        .order_by("pgh_data__bed_id", "pgh_created_at")
        .values_list(
            "pgh_obj_id", "pgh_data__bed_id",
            "pgh_diff__status__0", "pgh_diff__status__1",
            "pgh_created_at",
        )
    )

    gaps: list[float] = []
    last_free: dict[int, datetime.datetime] = {}       # per-bed: when last freed
    last_free_res: dict[int, int] = {}                  # per-bed: which reservation freed it

    for reservation_id, bed_id, before, after, created_at in rows:
        try:
            bed_id = int(bed_id)
        except (TypeError, ValueError):
            continue

        # "Free" event: exited checked_in → bed available for the next guest.
        if before == "checked_in" and after != "checked_in":
            last_free[bed_id] = created_at
            last_free_res[bed_id] = reservation_id

        # Check-in: entered checked_in from something else, within the date range.
        elif after == "checked_in" and before != "checked_in" and start <= created_at < end:
            prev_free = last_free.get(bed_id)
            if prev_free is not None and last_free_res.get(bed_id) != reservation_id:
                gaps.append((created_at - prev_free).total_seconds() / 86400.0)

    if not gaps:
        return None
    return round(sum(gaps) / len(gaps), 2)
