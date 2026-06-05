"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

import datetime
from collections import defaultdict
from typing import TYPE_CHECKING, Any
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
# These selectors read the pghistory ``BedEvent`` table, which is populated by
# database triggers whenever a Bed is inserted, deleted, or has its ``status``
# changed (see the ``@pghistory.track`` decorator on ``shelters.models.Bed``).
#
# Historical-fidelity caveat
# --------------------------
# ``BedEvent`` snapshots only the Bed's own scalar columns plus foreign-key ids
# (notably ``occupant_id``).  It does NOT snapshot the Bed's many-to-many fields
# (``demographics`` ...) nor the occupant's attributes (gender / race /
# date_of_birth).  Therefore:
#   * the *identity* of a bed's occupant at any point in time is accurate, but
#   * bed-attribute and client-demographic *filtering* must join to the LIVE
#     ``Bed`` / ``ClientProfile`` rows — i.e. current state.  A bed deleted
#     since its events were recorded will not match a bed-attribute filter, and
#     a client whose demographics have since changed is matched on their
#     current values.  Fully historical filtering would require reconstructing
#     state from the respective event tables and is intentionally out of scope.
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


def _client_ids_matching_filters(*, client_filters: dict) -> set[int]:
    """Resolve client-demographic ``client_filters`` against LIVE ``ClientProfile``.

    Supported keys: ``gender``, ``race``, ``veteran_status`` (each scalar or a
    list of values) and ``age_min`` / ``age_max`` (inclusive ages, derived from
    ``date_of_birth``).  Returns the set of matching client-profile ids.  See
    the module caveat: matching uses each client's *current* attributes.
    """
    from clients.models import ClientProfile

    qs = ClientProfile.objects.all()
    today = datetime.date.today()
    for key, value in client_filters.items():
        if value is None or (isinstance(value, (list, tuple, set)) and not value):
            continue
        if key == "gender":
            qs = qs.filter(gender__in=_as_list(value))
        elif key == "race":
            qs = qs.filter(race__in=_as_list(value))
        elif key == "veteran_status":
            qs = qs.filter(veteran_status__in=_as_list(value))
        elif key == "age_min":
            qs = qs.filter(date_of_birth__lte=today - relativedelta(years=int(value)))
        elif key == "age_max":
            qs = qs.filter(date_of_birth__gt=today - relativedelta(years=int(value) + 1))
        else:
            raise ValueError(f"Unsupported client filter: {key!r}")
    return set(qs.values_list("id", flat=True))


def avg_days_to_occupancy(
    *,
    shelter_id: int | str,
    start_date: datetime.date,
    end_date: datetime.date,
    bed_filters: dict | None = None,
    client_filters: dict | None = None,
) -> float | None:
    """Average number of days a bed sat unoccupied before becoming occupied.

    For every transition *into* the ``OCCUPIED`` status (a ``bed.status_change``
    event) whose timestamp falls inside the date range, we pair it with that
    bed's most recent prior event whose status was not ``OCCUPIED`` (which may
    pre-date the range).  The duration between the two events is measured using
    full datetimes; the function returns the mean across all such pairs.

    A bed may contribute several pairs.  Beds that were occupied from creation
    (no preceding non-occupied event) are excluded, as are occupancy events that
    fall outside the range.

    Args:
        shelter_id: The shelter to report on.
        start_date / end_date: Inclusive LA-local date range (max one year).
        bed_filters: Optional bed-attribute filters restricting which beds are
            considered (see :func:`_bed_ids_matching_filters`).
        client_filters: Optional client-demographic filters; an occupancy event
            only qualifies if the occupant matches (see
            :func:`_client_ids_matching_filters`).

    Returns:
        The mean number of days (rounded to two places) or ``None`` when there
        are no qualifying pairs.
    """
    start_utc, end_utc = _report_date_range_to_utc(start_date, end_date)

    bed_event_model = apps.get_model("shelters", "BedEvent")
    event_qs = bed_event_model.objects.filter(shelter_id=shelter_id, pgh_created_at__lt=end_utc)

    if bed_filters:
        allowed_bed_ids = _bed_ids_matching_filters(shelter_id=shelter_id, bed_filters=bed_filters)
        if not allowed_bed_ids:
            return None
        event_qs = event_qs.filter(pgh_obj_id__in=allowed_bed_ids)

    allowed_client_ids = _client_ids_matching_filters(client_filters=client_filters) if client_filters else None

    # Group every event up to the end of the range per bed, chronologically, so
    # each occupancy event can look back at the preceding event in Python.
    per_bed: dict[int, list[tuple[datetime.datetime, str, str | None, int | None]]] = defaultdict(list)
    for bed_id, created_at, label, status, occupant_id in event_qs.order_by(
        "pgh_obj_id", "pgh_created_at", "pgh_id"
    ).values_list("pgh_obj_id", "pgh_created_at", "pgh_label", "status", "occupant_id"):
        per_bed[bed_id].append((created_at, label, status, occupant_id))

    durations_days: list[float] = []
    for events in per_bed.values():
        for index, (created_at, label, status, occupant_id) in enumerate(events):
            if label != "bed.status_change" or status != BedStatusChoices.OCCUPIED:
                continue
            if not (start_utc <= created_at < end_utc):
                continue
            if allowed_client_ids is not None and occupant_id not in allowed_client_ids:
                continue
            # Walk back to the most recent event whose status was not OCCUPIED.
            preceding_time = None
            for prior in range(index - 1, -1, -1):
                if events[prior][2] != BedStatusChoices.OCCUPIED:
                    preceding_time = events[prior][0]
                    break
            if preceding_time is None:
                continue  # occupied from creation — no unoccupied period to measure
            durations_days.append((created_at - preceding_time).total_seconds() / 86400.0)

    if not durations_days:
        return None
    return round(sum(durations_days) / len(durations_days), 2)
