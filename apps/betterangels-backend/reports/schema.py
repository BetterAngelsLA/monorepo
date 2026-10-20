from datetime import date
from typing import List, Optional, cast

import strawberry
import strawberry_django
from graphql import GraphQLError
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from accounts.models import User as AccountUser
from common.graphql.utils import org_or_deny
from common.permissions.utils import IsAuthenticated, require_can
from regions.models import RegionKind
from regions.services import RegionScopeError, resolve_group_scope

from .permissions import ReportPermissions
from .selectors import report_summary, resolve_date_range


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
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def report_summary(
        self,
        info: Info,
        organization_id: ID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        dimension: Optional[RegionKind] = None,
        region_codes: Optional[List[str]] = None,
    ) -> ReportSummaryType:
        """Report summary for an organization — grant-only, header-free (ADR 0001 §5.3).

        The org is carried in the payload (``organizationId`` — no header is
        read); authority is ``require_can``/``can(reports.view_reports)`` at
        that org — role-backed ORG_ADMIN/ORG_SUPERUSER backfilled Grants, or the
        global tier.  Membership is not consulted; a legacy-only holder fails
        closed; an unknown org id fails closed.

        ``dimension``/``regionCodes`` scope the whole summary — the KPIs and every chart — to
        interactions inside a geographic group. They are the same pair the location breakdown
        and the map read, and they follow ``resolve_group_scope``: naming a dimension alone
        means every region of that dimension, adding codes narrows to those regions, and codes
        without a dimension are refused because a code is ambiguous across dimensions. The
        filter is applied to the note queryset before aggregation, so no chart can be left
        unscoped while its neighbours are narrowed.

        A group is a *scope*, not a display choice: choosing City excludes interactions whose
        address falls in no city, which is why the summary can legitimately be smaller than an
        ungrouped one. The breakdown's "not attributed to a city" figure names that remainder.
        """
        user = cast(AccountUser, get_current_user(info))
        org = org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

        start_date, end_date = resolve_date_range(org=org, start_date=start_date, end_date=end_date)

        try:
            region_kind, scoped_codes = resolve_group_scope(
                dimension=dimension.value if dimension else None, codes=region_codes
            )
        except RegionScopeError as error:
            # Same channel and same branchable `errorCode` as `interactionMap` and the density
            # tile: one refusal vocabulary across the report's surfaces. See
            # `docs/graphql_errors.md` §2.
            raise GraphQLError(
                str(error),
                extensions={
                    "errors": [
                        {"field": error.field, "location": None, "errorCode": error.code},
                    ]
                },
            ) from error

        summary = report_summary(
            org=org,
            start_date=start_date,
            end_date=end_date,
            region_kind=region_kind,
            region_codes=scoped_codes,
        )

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
