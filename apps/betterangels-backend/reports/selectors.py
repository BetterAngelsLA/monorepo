"""
Selectors for the reports app.

Selectors are responsible for fetching data from the database.
They should not contain write logic — that belongs in services.

Reference: https://github.com/HackSoftware/Django-Styleguide#selectors
"""

from datetime import date, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from django.db.models import Count, F, QuerySet
from django.db.models.functions import TruncDate
from django.utils import timezone
from organizations.models import Organization

from common.utils import aware_range
from notes.models import Note

from .calendar import report_calendar_time_zone


def report_month_range(*, year: int, month: int) -> tuple[date, date]:
    """Inclusive first and last calendar day of the given month.

    The one place the end-of-month arithmetic lives; the default range and the
    "previous month" helper are both expressed through it.
    """
    start = date(year, month, 1)
    return start, (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)


def report_default_date_range(*, org: Organization) -> tuple[date, date]:
    """Return the default date range — the current month, on the org's calendar."""
    today = timezone.localdate(timezone=report_calendar_time_zone(org))
    return report_month_range(year=today.year, month=today.month)


def resolve_date_range(*, org: Organization, start_date: date | None, end_date: date | None) -> tuple[date, date]:
    """Fill in whichever end of the range the caller omitted, from the org's default.

    The one place the fallback lives: ``reportSummary``, ``interactionsByRegion``,
    ``interactionMap`` and the density tile all read it, so an omitted ``start``/``end``
    means the same window on every surface. Each end falls back independently — passing
    only ``start`` keeps it and defaults ``end``.
    """
    if start_date is None or end_date is None:
        default_start, default_end = report_default_date_range(org=org)
        start_date = start_date or default_start
        end_date = end_date or default_end
    return start_date, end_date


def note_list_for_org(*, org: Organization, start_date: date, end_date: date, time_zone: ZoneInfo) -> QuerySet[Note]:
    """Return Notes for an organization between two inclusive calendar dates.

    *time_zone* is the calendar the dates are read on — one decision per report,
    made by the caller, so the range and the buckets below it cannot disagree.
    """
    # Half-open on instants rather than ``interacted_at__date``; see ``common.utils.aware_range``
    # for why, and for why the calendar is passed in rather than read from the active zone.
    start, end = aware_range(start_date, end_date, time_zone)

    return Note.objects.filter(
        interacted_at__gte=start,
        interacted_at__lt=end,
        organization=org,
    )


def note_count_by_date(*, notes: QuerySet[Note], time_zone: ZoneInfo) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by calendar date.

    ``tzinfo`` is passed explicitly: left to the default, ``TruncDate`` reads the
    zone the request activated, and the buckets would land on a different calendar
    than the range that selected them.
    """
    rows = (
        notes.annotate(trunc_date=TruncDate("interacted_at", tzinfo=time_zone))
        .values("trunc_date")
        .annotate(count=Count("id"))
        .order_by("trunc_date")
    )
    return [{"date": row["trunc_date"], "count": row["count"]} for row in rows]


def note_count_by_team(*, notes: QuerySet[Note]) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by team, with display labels."""
    rows = notes.exclude(team__isnull=True).values("team__name").annotate(count=Count("id")).order_by("-count")
    return [{"name": row["team__name"], "count": row["count"]} for row in rows]


def note_count_by_purpose(*, notes: QuerySet[Note], limit: int = 10) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by purpose."""
    rows = (
        notes.exclude(purpose__isnull=True)
        .exclude(purpose="")
        .values("purpose")
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )
    return [{"name": row["purpose"], "count": row["count"]} for row in rows]


def note_top_services(
    *,
    notes: QuerySet[Note],
    relation: str,
    limit: int = 15,
) -> list[dict[str, Any]]:
    """
    Count services across notes via a many-to-many service-request relation.

    Uses a single aggregation query instead of Python-level iteration.

    Args:
        notes: Base Note queryset.
        relation: ``"provided_services"`` or ``"requested_services"``.
        limit: Max number of results.
    """
    label_field = f"{relation}__service__label"
    rows = (
        notes.filter(**{f"{relation}__service__isnull": False})
        .values(name=F(label_field))
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )
    return [{"name": row["name"], "count": row["count"]} for row in rows]


def note_unique_clients_count(*, notes: QuerySet[Note]) -> int:
    """Count distinct client profiles across the given notes."""
    return notes.filter(client_profile__isnull=False).values("client_profile").distinct().count()


def note_unique_clients_by_date(*, notes: QuerySet[Note], time_zone: ZoneInfo) -> list[dict[str, Any]]:
    """Count distinct client profiles grouped by interaction date.

    Bucketed on the same calendar as :func:`note_count_by_date`.
    """
    rows = (
        notes.filter(client_profile__isnull=False)
        .annotate(trunc_date=TruncDate("interacted_at", tzinfo=time_zone))
        .values("trunc_date")
        .annotate(count=Count("client_profile", distinct=True))
        .order_by("trunc_date")
    )
    return [{"date": row["trunc_date"], "count": row["count"]} for row in rows]


def _dates_to_iso(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert date objects in aggregation results to ISO strings."""
    for entry in rows:
        if hasattr(entry["date"], "isoformat"):
            entry["date"] = entry["date"].isoformat()
    return rows


def report_summary(*, org: Organization, start_date: date, end_date: date) -> dict[str, Any]:
    """
    Build the full report summary for an organization and inclusive date range.

    Returns a dict ready to be serialized by the GraphQL layer or a DRF view.
    """
    # One calendar for the whole summary: the range, the buckets and the labels all
    # have to describe the same one.
    org_time_zone = report_calendar_time_zone(org)
    notes = note_list_for_org(org=org, start_date=start_date, end_date=end_date, time_zone=org_time_zone)

    return {
        "total_notes": notes.count(),
        "unique_clients": note_unique_clients_count(notes=notes),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "notes_by_date": _dates_to_iso(note_count_by_date(notes=notes, time_zone=org_time_zone)),
        "notes_by_team": note_count_by_team(notes=notes),
        "notes_by_purpose": note_count_by_purpose(notes=notes),
        "unique_clients_by_date": _dates_to_iso(note_unique_clients_by_date(notes=notes, time_zone=org_time_zone)),
        "top_provided_services": note_top_services(notes=notes, relation="provided_services"),
        "top_requested_services": note_top_services(notes=notes, relation="requested_services"),
    }
