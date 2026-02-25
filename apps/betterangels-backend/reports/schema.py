from collections import Counter
from datetime import date, timedelta
from typing import List, Optional, cast

import strawberry
import strawberry_django
from accounts.models import Organization, User
from accounts.permissions import UserOrganizationPermissions
from common.permissions.utils import IsAuthenticated
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from notes.models import Note
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.utils.query import filter_for_user


@strawberry.type
class DateCountType:
    date: str
    count: int


@strawberry.type
class NameCountType:
    name: str
    count: int


@strawberry.type
class ReportSummaryType:
    total_notes: int
    start_date: str
    end_date: str
    notes_by_date: List[DateCountType]
    notes_by_team: List[NameCountType]
    notes_by_purpose: List[NameCountType]
    top_provided_services: List[NameCountType]
    top_requested_services: List[NameCountType]


@strawberry.type
class Query:
    @strawberry_django.field(
        permission_classes=[IsAuthenticated],
    )
    def report_summary(
        self,
        info: Info,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> ReportSummaryType:
        current_user = cast(User, get_current_user(info))
        org = filter_for_user(
            Organization.objects.filter(users=current_user),
            current_user,
            [UserOrganizationPermissions.ACCESS_ORG_PORTAL],
        ).first()

        if org is None:
            raise PermissionError("You do not have access to any organization portal.")

        # Default to current month if no dates provided
        now = timezone.now()
        if start_date is None:
            start_date = date(now.year, now.month, 1)
        if end_date is None:
            # Last day of the current month
            if now.month == 12:
                end_date = date(now.year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(now.year, now.month + 1, 1) - timedelta(days=1)

        # Query range is inclusive of end_date, so we add 1 day for the filter
        filter_end = end_date + timedelta(days=1)

        notes_qs = Note.objects.filter(
            interacted_at__gte=start_date,
            interacted_at__lt=filter_end,
            organization=org,
        )

        total_notes = notes_qs.count()

        # Notes by date (for timeline chart)
        notes_by_date_raw = list(
            notes_qs.annotate(trunc_date=TruncDate("interacted_at"))
            .values("trunc_date")
            .annotate(count=Count("id"))
            .order_by("trunc_date")
        )
        notes_by_date = [
            DateCountType(date=entry["trunc_date"].isoformat(), count=entry["count"]) for entry in notes_by_date_raw
        ]

        # Notes by team (for bar chart)
        notes_by_team_raw = list(
            notes_qs.exclude(team__isnull=True)
            .exclude(team="")
            .values("team")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        notes_by_team = []
        for entry in notes_by_team_raw:
            try:
                from common.enums import SelahTeamEnum

                display = SelahTeamEnum(entry["team"]).label
            except (ValueError, KeyError):
                display = entry["team"]
            notes_by_team.append(NameCountType(name=display, count=entry["count"]))

        # Notes by purpose (for pie chart)
        notes_by_purpose_raw = list(
            notes_qs.exclude(purpose__isnull=True)
            .exclude(purpose="")
            .values("purpose")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        notes_by_purpose = [
            NameCountType(name=entry["purpose"], count=entry["count"]) for entry in notes_by_purpose_raw
        ]

        # Top provided services
        provided_services: Counter[str] = Counter()
        for note in notes_qs.prefetch_related("provided_services__service"):
            for sr in note.provided_services.all():
                provided_services[str(sr.service.label)] += 1
        top_provided = [NameCountType(name=name, count=count) for name, count in provided_services.most_common(15)]

        # Top requested services
        requested_services: Counter[str] = Counter()
        for note in notes_qs.prefetch_related("requested_services__service"):
            for sr in note.requested_services.all():
                requested_services[str(sr.service.label)] += 1
        top_requested = [NameCountType(name=name, count=count) for name, count in requested_services.most_common(15)]

        return ReportSummaryType(
            total_notes=total_notes,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            notes_by_date=notes_by_date,
            notes_by_team=notes_by_team,
            notes_by_purpose=notes_by_purpose,
            top_provided_services=top_provided,
            top_requested_services=top_requested,
        )
