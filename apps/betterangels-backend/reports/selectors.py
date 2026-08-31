"""
Selectors for the reports app.

Selectors are responsible for fetching data from the database.
They should not contain write logic — that belongs in services.

Reference: https://github.com/HackSoftware/Django-Styleguide#selectors
"""

from datetime import date, datetime, time, timedelta
from typing import Any

from common.constants import OPERATING_TIME_ZONE
from django.db.models import Count, F, QuerySet
from django.db.models.functions import TruncDate
from django.utils import timezone
from notes.models import Note
from organizations.models import Organization


def local_window(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    """Widen an inclusive pair of calendar dates into the half-open range the ORM filters on.

    The dates are read on the operating time zone's calendar, and the returned
    datetimes are aware — so everything downstream carries its zone with it
    instead of taking one alongside.
    """
    start = datetime.combine(start_date, time.min, tzinfo=OPERATING_TIME_ZONE)
    end = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=OPERATING_TIME_ZONE)
    return start, end


def local_today() -> date:
    """Today's date on the operating time zone's calendar."""
    return timezone.now().astimezone(OPERATING_TIME_ZONE).date()


def report_default_date_range() -> tuple[date, date]:
    """Return the default date range — the current month, locally."""
    start = local_today().replace(day=1)
    end = (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    return start, end


def report_month_range(*, year: int, month: int) -> tuple[date, date]:
    """Inclusive first and last calendar day of the given month."""
    start = date(year, month, 1)
    return start, (start + timedelta(days=32)).replace(day=1) - timedelta(days=1)


def note_list_for_org(*, org: Organization, start: datetime, end: datetime) -> QuerySet[Note]:
    """Return Notes for an organization within an aware, half-open datetime range.

    Build the range with :func:`local_window` — the bounds carry the zone that
    decides which calendar day a note belongs to.
    """
    return Note.objects.filter(
        interacted_at__gte=start,
        interacted_at__lt=end,
        organization=org,
    )


def note_count_by_date(*, notes: QuerySet[Note]) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by local calendar date."""
    rows = (
        notes.annotate(trunc_date=TruncDate("interacted_at", tzinfo=OPERATING_TIME_ZONE))
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


def note_unique_clients_by_date(*, notes: QuerySet[Note]) -> list[dict[str, Any]]:
    """Count distinct client profiles grouped by local interaction date."""
    rows = (
        notes.filter(client_profile__isnull=False)
        .annotate(trunc_date=TruncDate("interacted_at", tzinfo=OPERATING_TIME_ZONE))
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
    start, end = local_window(start_date, end_date)
    notes = note_list_for_org(org=org, start=start, end=end)

    return {
        "total_notes": notes.count(),
        "unique_clients": note_unique_clients_count(notes=notes),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "notes_by_date": _dates_to_iso(note_count_by_date(notes=notes)),
        "notes_by_team": note_count_by_team(notes=notes),
        "notes_by_purpose": note_count_by_purpose(notes=notes),
        "unique_clients_by_date": _dates_to_iso(note_unique_clients_by_date(notes=notes)),
        "top_provided_services": note_top_services(notes=notes, relation="provided_services"),
        "top_requested_services": note_top_services(notes=notes, relation="requested_services"),
    }
