"""Selectors for the reports app — query logic separated from views/schema."""

from collections import Counter
from datetime import date, timedelta
from typing import Any

from django.db.models import Count, QuerySet
from django.db.models.functions import TruncDate
from django.utils import timezone
from notes.models import Note
from organizations.models import Organization


def get_default_date_range() -> tuple[date, date]:
    """Return the default date range (current month)."""
    now = timezone.now()
    start = date(now.year, now.month, 1)
    if now.month == 12:
        end = date(now.year + 1, 1, 1) - timedelta(days=1)
    else:
        end = date(now.year, now.month + 1, 1) - timedelta(days=1)
    return start, end


def get_notes_for_org(
    org: Organization,
    start_date: date,
    end_date: date,
) -> QuerySet[Note]:
    """
    Return a queryset of Notes for an organization within an inclusive date range.

    The end_date is inclusive — internally we add one day for the ORM lt filter.
    """
    filter_end = end_date + timedelta(days=1)
    return Note.objects.filter(
        interacted_at__gte=start_date,
        interacted_at__lt=filter_end,
        organization=org,
    )


def get_notes_by_date(qs: QuerySet[Note]) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by date."""
    return [
        {"date": entry["trunc_date"].isoformat(), "count": entry["count"]}
        for entry in (
            qs.annotate(trunc_date=TruncDate("interacted_at"))
            .values("trunc_date")
            .annotate(count=Count("id"))
            .order_by("trunc_date")
        )
    ]


def get_notes_by_team(qs: QuerySet[Note]) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by team, using display labels."""
    results = []
    for entry in (
        qs.exclude(team__isnull=True).exclude(team="").values("team").annotate(count=Count("id")).order_by("-count")
    ):
        try:
            from common.enums import SelahTeamEnum

            display = SelahTeamEnum(entry["team"]).label
        except (ValueError, KeyError):
            display = entry["team"]
        results.append({"name": display, "count": entry["count"]})
    return results


def get_notes_by_purpose(qs: QuerySet[Note], limit: int = 10) -> list[dict[str, Any]]:
    """Aggregate note counts grouped by purpose."""
    return [
        {"name": entry["purpose"], "count": entry["count"]}
        for entry in (
            qs.exclude(purpose__isnull=True)
            .exclude(purpose="")
            .values("purpose")
            .annotate(count=Count("id"))
            .order_by("-count")[:limit]
        )
    ]


def get_top_services(
    qs: QuerySet[Note],
    relation: str,
    limit: int = 15,
) -> list[dict[str, Any]]:
    """
    Count services across notes via a related service-request relation.

    Args:
        qs: Base Note queryset.
        relation: Either "provided_services" or "requested_services".
        limit: Max number of results.
    """
    counter: Counter[str] = Counter()
    for note in qs.prefetch_related(f"{relation}__service"):
        for sr in getattr(note, relation).all():
            counter[str(sr.service.label)] += 1
    return [{"name": name, "count": count} for name, count in counter.most_common(limit)]


def get_report_summary(org: Organization, start_date: date, end_date: date) -> dict[str, Any]:
    """
    Build the full report summary dict for an organization and date range.

    Returns a dict ready to be serialized by the GraphQL type or DRF serializer.
    """
    notes_qs = get_notes_for_org(org, start_date, end_date)

    return {
        "total_notes": notes_qs.count(),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "notes_by_date": get_notes_by_date(notes_qs),
        "notes_by_team": get_notes_by_team(notes_qs),
        "notes_by_purpose": get_notes_by_purpose(notes_qs),
        "top_provided_services": get_top_services(notes_qs, "provided_services"),
        "top_requested_services": get_top_services(notes_qs, "requested_services"),
    }
