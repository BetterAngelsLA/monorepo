from datetime import date
from typing import List, Optional, cast

import strawberry
import strawberry_django
from accounts.extensions import HasOrgPerm
from common.permissions.utils import IsAuthenticated, get_current_organization
from organizations.models import Organization
from strawberry.types import Info

from .permissions import ReportPermissions
from .selectors import report_default_date_range, report_summary


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
    unique_clients: int
    start_date: str
    end_date: str
    notes_by_date: List[DateCountType]
    notes_by_team: List[NameCountType]
    notes_by_purpose: List[NameCountType]
    unique_clients_by_date: List[DateCountType]
    top_provided_services: List[NameCountType]
    top_requested_services: List[NameCountType]


@strawberry.type
class Query:
    @strawberry_django.field(
        permission_classes=[IsAuthenticated],
        extensions=[HasOrgPerm(ReportPermissions.VIEW_REPORTS)],
    )
    def report_summary(
        self,
        info: Info,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> ReportSummaryType:
        org_id = get_current_organization(info)
        org = Organization.objects.get(pk=org_id)

        if start_date is None or end_date is None:
            default_start, default_end = report_default_date_range()
            start_date = start_date or default_start
            end_date = end_date or default_end

        summary = report_summary(org=org, start_date=start_date, end_date=end_date)

        return ReportSummaryType(
            total_notes=summary["total_notes"],
            unique_clients=summary["unique_clients"],
            start_date=summary["start_date"],
            end_date=summary["end_date"],
            notes_by_date=[DateCountType(**d) for d in summary["notes_by_date"]],
            notes_by_team=[NameCountType(**d) for d in summary["notes_by_team"]],
            notes_by_purpose=[NameCountType(**d) for d in summary["notes_by_purpose"]],
            unique_clients_by_date=[DateCountType(**d) for d in summary["unique_clients_by_date"]],
            top_provided_services=[NameCountType(**d) for d in summary["top_provided_services"]],
            top_requested_services=[NameCountType(**d) for d in summary["top_requested_services"]],
        )
