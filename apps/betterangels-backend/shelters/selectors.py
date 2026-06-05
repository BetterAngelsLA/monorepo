"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

import bisect
import datetime
from collections import defaultdict
from typing import TYPE_CHECKING, Any, Callable
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta
from django.apps import apps
from django.db.models import Exists, OuterRef, Q, QuerySet
from organizations.models import Organization
from shelters.enums import BedStatusChoices, DayOfWeekChoices, ScheduleTypeChoices, StatusChoices

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


# ---------------------------------------------------------------------------
# Reporting selectors
# ---------------------------------------------------------------------------
#
# These selectors reconstruct historical bed occupancy from the pghistory
# ``BedEvent`` table, which is populated by database triggers whenever a Bed is
# inserted, deleted, or has its ``status`` changed (see the ``@pghistory.track``
# decorator on ``shelters.models.Bed``).
#
# Historical-fidelity notes
# --------------------------
# ``BedEvent`` snapshots only the Bed's own scalar columns plus foreign-key ids
# (notably ``occupant_id``); it does NOT snapshot the Bed's many-to-many fields
# (``demographics`` ...) nor the occupant's attributes.  Therefore:
#   * Occupant *identity* over time is accurate (``occupant_id`` is snapshotted).
#   * Client-demographic filters are reconstructed historically from the
#     ``ClientProfileEvent`` table: each occupant's attributes are read as of the
#     relevant moment, so matching reflects the client's state at that time and
#     still works for clients later deleted (their events persist).  Caveat:
#     clients created before ``ClientProfile`` tracking began have no events and
#     are therefore excluded from demographic-filtered counts.
#   * Bed-attribute filters still join to the LIVE ``Bed`` row (current state),
#     because pghistory does not snapshot the Bed's M2M fields.  A bed deleted
#     since its events were recorded will not match a bed-attribute filter.
#     Historical bed-attribute filtering would require tracking those M2M
#     relations and is intentionally out of scope here.
#
# All Better Angels shelters operate in Los Angeles, so date boundaries are
# interpreted in ``America/Los_Angeles`` and converted to UTC for querying
# (Django runs ``TIME_ZONE = "UTC"`` / ``USE_TZ = True`` and ``pgh_created_at``
# is stored in UTC).

LA_TZ = ZoneInfo("America/Los_Angeles")

# Acceptance criteria require ranges "up to a year in the past"; allow a full
# inclusive year (plus a leap day of slack) and reject anything larger.
MAX_REPORT_RANGE_DAYS = 366


def _as_list(value: Any) -> list:
    """Normalize a scalar-or-iterable filter value into a list."""
    if isinstance(value, (list, tuple, set)):
        return list(value)
    return [value]


def _report_date_range_to_utc(
    start_date: datetime.date, end_date: datetime.date
) -> tuple[datetime.datetime, datetime.datetime]:
    """Convert an inclusive LA-local date range to a ``[start, end)`` UTC window.

    ``end`` is the UTC instant at the start of the day *after* ``end_date`` in
    Los Angeles, so the returned half-open interval covers the whole of
    ``end_date`` locally.

    Raises:
        ``ValueError`` if ``start_date`` is after ``end_date`` or the range
        exceeds :data:`MAX_REPORT_RANGE_DAYS`.
    """
    if start_date > end_date:
        raise ValueError("start_date must be on or before end_date")
    if (end_date - start_date).days > MAX_REPORT_RANGE_DAYS:
        raise ValueError(f"Date range may not exceed {MAX_REPORT_RANGE_DAYS} days")

    start_local = datetime.datetime.combine(start_date, datetime.time.min, tzinfo=LA_TZ)
    end_local = datetime.datetime.combine(end_date + datetime.timedelta(days=1), datetime.time.min, tzinfo=LA_TZ)
    return start_local.astimezone(datetime.timezone.utc), end_local.astimezone(datetime.timezone.utc)


def _iter_days(start_date: datetime.date, end_date: datetime.date) -> "list[datetime.date]":
    """Return every LA-local date from ``start_date`` to ``end_date`` inclusive."""
    days = []
    day = start_date
    while day <= end_date:
        days.append(day)
        day += datetime.timedelta(days=1)
    return days


def _bed_ids_matching_filters(*, shelter_id: int | str, bed_filters: dict) -> set[int]:
    """Resolve ``bed_filters`` against the LIVE ``Bed`` table for a shelter.

    Supports the scalar ``type`` field, the name-keyed M2M lookups
    (``demographics``, ``accessibility``, ``funders``, ``pets``,
    ``medical_needs``) and the boolean attributes (``b7``, ``storage``,
    ``maintenance_flag``).  Returns the set of matching live bed ids.  See the
    module caveat: beds deleted since their events were recorded cannot match.
    """
    from shelters.models import Bed

    m2m_name_fields = {"demographics", "accessibility", "funders", "pets", "medical_needs"}
    bool_fields = {"b7", "storage", "maintenance_flag"}

    qs = Bed.objects.filter(shelter_id=shelter_id)
    for key, value in bed_filters.items():
        if value is None or (isinstance(value, (list, tuple, set)) and not value):
            continue
        if key == "type":
            qs = qs.filter(type__in=_as_list(value))
        elif key in m2m_name_fields:
            qs = qs.filter(**{f"{key}__name__in": _as_list(value)})
        elif key in bool_fields:
            qs = qs.filter(**{key: value})
        else:
            raise ValueError(f"Unsupported bed filter: {key!r}")
    return set(qs.values_list("id", flat=True).distinct())


def _client_state_matches(
    client_filters: dict,
    *,
    gender: str | None,
    race: str | None,
    veteran_status: str | None,
    date_of_birth: datetime.date | None,
    as_of: datetime.date,
) -> bool:
    """Return whether a reconstructed client state satisfies ``client_filters``.

    Supported keys: ``gender``, ``race``, ``veteran_status`` (scalar or list of
    values) and ``age_min`` / ``age_max`` (inclusive ages computed against
    ``as_of``).
    """
    for key, value in client_filters.items():
        if value is None or (isinstance(value, (list, tuple, set)) and not value):
            continue
        if key == "gender":
            if gender not in _as_list(value):
                return False
        elif key == "race":
            if race not in _as_list(value):
                return False
        elif key == "veteran_status":
            if veteran_status not in _as_list(value):
                return False
        elif key == "age_min":
            if date_of_birth is None or relativedelta(as_of, date_of_birth).years < int(value):
                return False
        elif key == "age_max":
            if date_of_birth is None or relativedelta(as_of, date_of_birth).years > int(value):
                return False
        else:
            raise ValueError(f"Unsupported client filter: {key!r}")
    return True


def _build_client_demographic_matcher(client_filters: dict) -> Callable[[int | None, datetime.datetime], bool]:
    """Build a ``matches(occupant_id, at_time)`` predicate over client history.

    Demographic state is reconstructed from the pghistory ``ClientProfileEvent``
    table: for a given moment we use the most recent event at or before that
    time.  This reflects the client's attributes *as of* that moment and still
    resolves for clients later deleted (their events persist).  Clients with no
    events at or before the moment (e.g. created before tracking began) never
    match.  Per-occupant timelines are cached for the life of the matcher.
    """
    client_event_model = apps.get_model("clients", "ClientProfileEvent")
    # occupant_id -> (sorted event times, sorted event states)
    timelines: dict[int, tuple[list[datetime.datetime], list[tuple]]] = {}

    def _timeline(occupant_id: int) -> tuple[list[datetime.datetime], list[tuple]]:
        cached = timelines.get(occupant_id)
        if cached is None:
            rows = list(
                client_event_model.objects.filter(pgh_obj_id=occupant_id)
                .order_by("pgh_created_at", "pgh_id")
                .values_list("pgh_created_at", "gender", "race", "veteran_status", "date_of_birth")
            )
            cached = ([row[0] for row in rows], [row[1:] for row in rows])
            timelines[occupant_id] = cached
        return cached

    def matches(occupant_id: int | None, at_time: datetime.datetime) -> bool:
        if occupant_id is None:
            return False
        times, states = _timeline(occupant_id)
        index = bisect.bisect_right(times, at_time) - 1
        if index < 0:
            return False  # no recorded state at or before this moment
        gender, race, veteran_status, date_of_birth = states[index]
        return _client_state_matches(
            client_filters,
            gender=gender,
            race=race,
            veteran_status=veteran_status,
            date_of_birth=date_of_birth,
            as_of=at_time.astimezone(LA_TZ).date(),
        )

    return matches


def _build_daily_bed_snapshots(
    *,
    shelter_id: int | str,
    start_date: datetime.date,
    end_date: datetime.date,
    bed_filters: dict | None = None,
) -> "dict[datetime.date, dict[int, tuple[str | None, int | None]]]":
    """Reconstruct each bed's status for each day in the range from ``BedEvent``.

    Returns ``{day: {bed_id: (status, occupant_id)}}`` containing only beds that
    *existed* on that day (created on or before, not yet removed).  A bed's state
    on a given day is the most recent event at or before that day's LA-local
    end-of-day.

    Bed ids are discovered from the event table (not ``Bed.objects``) so beds
    that were later deleted still appear for the days they existed.  When
    ``bed_filters`` is supplied the bed set is restricted to live beds matching
    those attributes.
    """
    _, end_utc = _report_date_range_to_utc(start_date, end_date)
    days = _iter_days(start_date, end_date)

    bed_event_model = apps.get_model("shelters", "BedEvent")
    event_qs = bed_event_model.objects.filter(shelter_id=shelter_id, pgh_created_at__lt=end_utc)

    if bed_filters:
        allowed_bed_ids = _bed_ids_matching_filters(shelter_id=shelter_id, bed_filters=bed_filters)
        if not allowed_bed_ids:
            return {day: {} for day in days}
        event_qs = event_qs.filter(pgh_obj_id__in=allowed_bed_ids)

    # Group every event (up to the end of the range) per bed, chronologically.
    per_bed: dict[int, list[tuple[datetime.datetime, str, str | None, int | None]]] = defaultdict(list)
    for bed_id, created_at, label, status, occupant_id in event_qs.order_by(
        "pgh_obj_id", "pgh_created_at", "pgh_id"
    ).values_list("pgh_obj_id", "pgh_created_at", "pgh_label", "status", "occupant_id"):
        per_bed[bed_id].append((created_at, label, status, occupant_id))

    # End-of-day boundary (exclusive) in UTC for each local day.
    day_bounds = [
        datetime.datetime.combine(day + datetime.timedelta(days=1), datetime.time.min, tzinfo=LA_TZ).astimezone(
            datetime.timezone.utc
        )
        for day in days
    ]

    snapshots: dict[datetime.date, dict[int, tuple[str | None, int | None]]] = {day: {} for day in days}
    for bed_id, events in per_bed.items():
        created_times = [event[0] for event in events]
        for day, bound in zip(days, day_bounds):
            # Most recent event strictly before the next local midnight.
            idx = bisect.bisect_left(created_times, bound) - 1
            if idx < 0:
                continue  # bed did not exist yet on this day
            _, label, status, occupant_id = events[idx]
            if label == "bed.remove":
                continue  # bed had been removed by this day
            snapshots[day][bed_id] = (status, occupant_id)
    return snapshots


def daily_occupancy(
    *,
    shelter_id: int | str,
    start_date: datetime.date,
    end_date: datetime.date,
    bed_filters: dict | None = None,
    client_filters: dict | None = None,
) -> list[dict[str, Any]]:
    """Daily occupied-bed counts and occupancy percentage for a shelter.

    Args:
        shelter_id: The shelter to report on.
        start_date / end_date: Inclusive LA-local date range (max one year).
        bed_filters: Optional bed-attribute filters restricting which beds are
            counted (see :func:`_bed_ids_matching_filters`).
        client_filters: Optional client-demographic filters; when supplied an
            occupied bed only counts toward ``occupied_count`` if its occupant
            matched (as of that day) (see
            :func:`_build_client_demographic_matcher`).

    Returns:
        One dict per day, ordered chronologically::

            {"date": date, "occupied_count": int, "total_beds": int, "occupancy_pct": float}

        ``total_beds`` is the number of beds present that day with a known
        (non-null) status; beds with no status set are excluded from the
        percentage.  ``occupancy_pct`` is a 0–100 value rounded to two places.
    """
    snapshots = _build_daily_bed_snapshots(
        shelter_id=shelter_id,
        start_date=start_date,
        end_date=end_date,
        bed_filters=bed_filters,
    )
    client_matcher = _build_client_demographic_matcher(client_filters) if client_filters else None

    results = []
    for day in _iter_days(start_date, end_date):
        # End-of-day boundary (exclusive) in UTC — also used to read client state.
        day_bound = datetime.datetime.combine(
            day + datetime.timedelta(days=1), datetime.time.min, tzinfo=LA_TZ
        ).astimezone(datetime.timezone.utc)
        beds = snapshots.get(day, {})
        total_beds = 0
        occupied_count = 0
        for status, occupant_id in beds.values():
            if status is None:
                continue  # unknown status — excluded from the percentage
            total_beds += 1
            if status == BedStatusChoices.OCCUPIED and (
                client_matcher is None or client_matcher(occupant_id, day_bound)
            ):
                occupied_count += 1
        occupancy_pct = round(occupied_count / total_beds * 100, 2) if total_beds else 0.0
        results.append(
            {
                "date": day,
                "occupied_count": occupied_count,
                "total_beds": total_beds,
                "occupancy_pct": occupancy_pct,
            }
        )
    return results
