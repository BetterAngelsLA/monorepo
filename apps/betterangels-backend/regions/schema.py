"""GraphQL surface for region grouping (DEV-2570 / DEV-2604).

Adds a ``RegionDimension`` enum and two queries:

* ``interactionsByRegion`` — the rollup the report needs: interaction counts per
  region of a dimension, optionally filtered to specific region codes.
* ``regions`` — the boundary polygons themselves, as GeoJSON, for the map view.

Both sit alongside the existing ``reportSummary``. Note that GraphQL has no
native geometry type in this schema; polygons are returned as a GeoJSON string
(``ST_AsGeoJSON``) which the client parses, rather than inventing a scalar.
"""

from __future__ import annotations

import enum
import json
from datetime import date, datetime, time, timedelta
from typing import List, Optional, cast
from zoneinfo import ZoneInfo

import strawberry
import strawberry_django
from django.core.exceptions import PermissionDenied
from organizations.models import Organization
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from accounts.models import User as AccountUser
from common.permissions.utils import IsAuthenticated, require_can
from common.utils import get_or_none
from reports.calendar import report_calendar_time_zone
from reports.permissions import ReportPermissions
from reports.selectors import report_default_date_range

from .models import RegionKind
from .selectors import (
    available_kinds,
    region_counts,
    region_features,
    region_totals_without_boundaries,
)

# Sentinel code the client uses to ask for interactions that fall in no region.
UNASSIGNED = "__unassigned__"


@strawberry.enum
class RegionDimension(enum.Enum):
    """The geographic dimensions interactions can be grouped or filtered by.

    Values mirror ``RegionKind`` so the enum, the DB and the loader agree.
    """

    ZCTA = "zcta"
    CITY = "city"
    COUNCIL_DISTRICT = "council_district"
    SUPERVISORIAL_DISTRICT = "supervisorial_district"
    SPA = "spa"
    COC = "coc"


@strawberry.type
class RegionCountType:
    """One bucket of the rollup.

    ``code`` is empty for the unassigned bucket, which is present whenever some
    interactions fall outside every polygon of the chosen dimension — a Beverly
    Hills address has no LA City council district. Clients should render it
    rather than dropping it.
    """

    code: str
    name: str
    count: int
    is_unassigned: bool


@strawberry.type
class RegionType:
    """A boundary polygon, as GeoJSON text."""

    kind: str
    code: str
    name: str
    geometry: str


def _aware_range(start_date: date, end_date: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    """Inclusive calendar dates -> half-open instants, matching ``note_list_for_org``.

    Half-open so the range and every bucket under it describe one period; using
    ``interacted_at__date`` would also wrap the column in a cast and lose the index.
    """
    start = datetime.combine(start_date, time.min, tzinfo=tz)
    end = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=tz)
    return start, end


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def interactions_by_region(
        self,
        info: Info,
        organization_id: ID,
        dimension: RegionDimension,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        region_codes: Optional[List[str]] = None,
    ) -> List[RegionCountType]:
        """Interaction counts per region of ``dimension``.

        ``regionCodes`` narrows to specific regions; omitting it returns every
        region that has at least one interaction plus the unassigned bucket.

        Authority is ``reports.view_reports`` at the payload org, identical to
        ``reportSummary`` — grouping by geography is the same data, sliced
        differently, so it must not be reachable by a weaker check.
        """
        user = cast(AccountUser, get_current_user(info))
        org = _org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

        if start_date is None or end_date is None:
            default_start, default_end = report_default_date_range(org=org)
            start_date = start_date or default_start
            end_date = end_date or default_end

        tz = report_calendar_time_zone(org)
        start, end = _aware_range(start_date, end_date, tz)

        # The sentinel is stripped before it reaches SQL: it selects the absence
        # of a region, so it cannot be a code.
        wanted = [c for c in (region_codes or []) if c != UNASSIGNED]
        include_unassigned = not region_codes or UNASSIGNED in region_codes

        rows = region_counts(
            kind=dimension.value,
            start=start,
            end=end,
            organization_id=org.id,
            codes=wanted or None,
        )

        buckets = [
            RegionCountType(
                code=row["code"] or "", name=row["name"] or "", count=row["count"], is_unassigned=row["code"] is None
            )
            for row in rows
            if row["code"] is not None or include_unassigned
        ]

        # Notes with no location at all are invisible to a spatial rollup, so
        # they are reported in the same unassigned bucket rather than vanishing
        # and making the total disagree with the KPI row.
        if include_unassigned:
            locationless = region_totals_without_boundaries(start=start, end=end, organization_id=org.id)
            if locationless:
                buckets.append(
                    RegionCountType(code="", name="No location recorded", count=locationless, is_unassigned=True)
                )

        return buckets

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def region_dimensions(self, info: Info) -> List[str]:
        """Dimensions that actually have boundaries loaded.

        Lets the report offer only groupable dimensions instead of presenting a
        control that returns nothing because ``import_regions`` has not run for it.
        """
        return available_kinds()

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def regions(
        self,
        info: Info,
        dimension: RegionDimension,
        codes: Optional[List[str]] = None,
    ) -> List[RegionType]:
        """Boundary polygons as GeoJSON, for the map view.

        No org is required: boundaries are public reference geography, identical
        for every tenant, and contain no client data.
        """
        rows = region_features(kinds=[dimension.value], codes=codes)
        return [
            RegionType(
                kind=row["kind"],
                code=row["code"],
                name=row["name"],
                geometry=row["geometry"] if isinstance(row["geometry"], str) else _dumps(row["geometry"]),
            )
            for row in rows
        ]


def _dumps(value: object) -> str:
    """``ST_AsGeoJSON`` may come back already parsed by the driver."""
    return json.dumps(value)


def _org_or_deny(org_id: object) -> Organization:
    """Resolve an org id from client input, failing closed (mirrors reports.schema)."""
    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


__all__ = ["Query", "RegionCountType", "RegionDimension", "RegionType", "RegionKind"]
