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

    ZIP = "zip"
    CITY = "city"
    COUNCIL_DISTRICT = "council_district"
    SUPERVISORIAL_DISTRICT = "supervisorial_district"
    SPA = "spa"
    COC = "coc"


@strawberry.enum
class UnassignedReason(enum.Enum):
    """Why a bucket could not be attributed to a named region.

    Two distinct conditions produce an unassigned bucket and they mean different
    things operationally, so they are not merged:

    * ``OUTSIDE_ALL_REGIONS`` — the interaction has a point, but no polygon of
      this dimension contains it. A Beverly Hills address has no LA City council
      district. This is a real coverage signal.
    * ``NO_LOCATION`` — the interaction has no location recorded at all, so no
      spatial join could ever classify it. This is a data-completeness signal.
    """

    OUTSIDE_ALL_REGIONS = "OUTSIDE_ALL_REGIONS"
    NO_LOCATION = "NO_LOCATION"


@strawberry.type
class RegionCountType:
    """One bucket of the rollup.

    Exactly one bucket per ``code``, plus at most one bucket of each
    ``unassigned_reason``. ``code`` is empty for an unassigned bucket; use
    ``is_unassigned``/``unassigned_reason`` to identify it, never ``code`` alone
    — there can be two unassigned buckets in a single response.
    """

    code: str
    name: str
    count: int
    is_unassigned: bool
    # ``None`` for a named region. Set for the unassigned buckets, so a client
    # can tell "outside every region" from "no location recorded" without
    # parsing the display name.
    unassigned_reason: Optional[UnassignedReason]


@strawberry.type
class RegionType:
    """A boundary polygon, as GeoJSON text."""

    kind: RegionDimension
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

        ``regionCodes`` narrows the rollup. Omitting it returns every region with
        at least one interaction, plus the unassigned buckets. Passing the
        ``__unassigned__`` sentinel — alone or alongside real codes — includes
        the "outside every region" bucket.

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

        # Three cases, and conflating the first two is the bug this replaces:
        #   * no `regionCodes` at all      -> unfiltered: every region + both
        #                                     unassigned buckets.
        #   * `["__unassigned__"]` alone   -> *only* rows that matched no region,
        #                                     both causes. Asking for "unassigned"
        #                                     and getting only half of it would be
        #                                     its own surprise; the bucket's
        #                                     `unassignedReason` says which is which.
        #   * real codes (with or without the sentinel) -> those regions, plus the
        #                                     outside-every-region bucket when the
        #                                     sentinel was asked for.
        requested_codes = list(region_codes or [])
        sentinel_requested = UNASSIGNED in requested_codes
        wanted = [c for c in requested_codes if c != UNASSIGNED]
        unassigned_only = sentinel_requested and not wanted
        include_unassigned = region_codes is None or sentinel_requested
        # "No location at all" is a separate unassigned cause: include it unless
        # the caller named specific regions and did not ask for unassigned.
        include_locationless = include_unassigned or (not sentinel_requested and not wanted)

        rows = region_counts(
            kind=dimension.value,
            start=start,
            end=end,
            organization_id=org.id,
            codes=wanted or None,
            unassigned_only=unassigned_only,
            # Real codes plus the sentinel: the predicate needs both arms, which
            # is not expressible by putting the sentinel in the code list.
            include_unassigned=sentinel_requested and bool(wanted),
        )

        # Named regions always come back; unassigned rows only when asked for.
        buckets = [
            RegionCountType(
                code=row["code"] or "",
                name=row["name"] or "",
                count=row["count"],
                is_unassigned=row["code"] is None,
                unassigned_reason=(UnassignedReason.OUTSIDE_ALL_REGIONS if row["code"] is None else None),
            )
            for row in rows
            if row["code"] is not None or include_unassigned
        ]

        # Notes with no location at all are invisible to a spatial rollup, so
        # they get their own unassigned bucket rather than vanishing and making
        # the total disagree with the KPI row. A distinct ``unassigned_reason``
        # keeps the two unassigned buckets tellable apart — they share `code`.
        if include_locationless:
            locationless = region_totals_without_boundaries(start=start, end=end, organization_id=org.id)
            if locationless:
                buckets.append(
                    RegionCountType(
                        code="",
                        name="No location recorded",
                        count=locationless,
                        is_unassigned=True,
                        unassigned_reason=UnassignedReason.NO_LOCATION,
                    )
                )

        return buckets

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def region_dimensions(self, info: Info) -> List[RegionDimension]:
        """Dimensions that actually have boundaries loaded.

        Lets the report offer only groupable dimensions instead of presenting a
        control that returns nothing because ``import_regions`` has not run for it.

        ``IsAuthenticated`` only, like ``regions`` and for the same reason: this
        exposes which boundary sets exist, not any client data.
        """
        return [RegionDimension(kind) for kind in available_kinds()]

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def regions(
        self,
        info: Info,
        dimension: RegionDimension,
        codes: Optional[List[str]] = None,
    ) -> List[RegionType]:
        """Boundary polygons as GeoJSON, for the map view.

        ``IsAuthenticated`` only, deliberately — unlike ``interactionsByRegion``.
        These are public reference boundaries, identical for every tenant; the
        SELECT returns ``kind, code, name, ST_AsGeoJSON(geom, 6)`` and no org- or
        client-scoped column. Requiring ``reports.view_reports`` here would mean
        the map could not render for a signed-in user who may see the report's
        charts but not its boundary layer, with no confidentiality gained.
        """
        rows = region_features(kinds=[dimension.value], codes=codes)
        return [
            RegionType(
                kind=RegionDimension(row["kind"]),
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


__all__ = ["Query", "RegionCountType", "RegionDimension", "RegionType", "UnassignedReason"]
