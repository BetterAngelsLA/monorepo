"""GraphQL surface for region grouping (DEV-2570 / DEV-2604).

Adds a ``RegionDimension`` enum and four queries:

* ``interactionsByRegion`` — interaction counts per region of a dimension.
* ``interactionMap`` — individual points and a density grid, for the map.
* ``regionDimensions`` — which dimensions have boundaries loaded.
* ``regions`` — the boundary polygons themselves, as GeoJSON.

They sit alongside the existing ``reportSummary``. GraphQL has no
native geometry type in this schema; polygons are returned as a GeoJSON string
(``ST_AsGeoJSON``) which the client parses, rather than inventing a scalar.
"""

from __future__ import annotations

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
from strawberry_django.utils.query import filter_for_user

from accounts.models import User as AccountUser
from common.permissions.utils import IsAuthenticated, require_can
from common.utils import get_or_none
from notes.models import Note
from notes.permissions import NotePermissions
from reports.calendar import report_calendar_time_zone
from reports.permissions import ReportPermissions
from reports.selectors import report_default_date_range

from .selectors import POINT_LIMIT, available_kinds, region_features, scope_notes_to_regions
from .services import interaction_map_data, region_rollup
from .types import (
    InteractionMapType,
    RegionCountType,
    RegionDimension,
    RegionType,
    UnassignedReason,
)


def _resolve_dates(org: Organization, start_date: Optional[date], end_date: Optional[date]) -> tuple[date, date]:
    """Fill in whichever end of the range the caller omitted, from the org's default."""
    if start_date is None or end_date is None:
        default_start, default_end = report_default_date_range(org=org)
        start_date = start_date or default_start
        end_date = end_date or default_end
    return start_date, end_date


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
        dimension: Optional[RegionDimension] = None,
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

        start_date, end_date = _resolve_dates(org, start_date, end_date)
        start, end = _aware_range(start_date, end_date, report_calendar_time_zone(org))

        return region_rollup(
            # `None` counts every dimension at once, grouping by (kind, code) because a
            # code is ambiguous across dimensions.
            kind=dimension.value if dimension else None,
            start=start,
            end=end,
            organization_id=org.id,
            region_codes=region_codes,
        )

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def interaction_map(
        self,
        info: Info,
        organization_id: ID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None,
        dimension: Optional[RegionDimension] = None,
        region_codes: Optional[List[str]] = None,
    ) -> InteractionMapType:
        """Where the interactions happened: pins, and the same data as a density grid.

        Authority is **the note read scope, not the report scope.** This returns
        individual coordinates, so it is gated on ``notes.view_note`` and filtered
        through ``filter_for_user``. Gating on ``reports.view_reports`` alone would
        widen the scope: ``LocationType.point`` is reached *through* a note, and
        ``reports.view_reports`` is held by ``ORG_ADMIN``, which has no note
        permission.

        Pins and the density grid are returned together so the client can switch views
        without a second round trip.

        ``dimension`` is required: codes are not unique across dimensions, so the
        dimension is what makes ``regionCodes`` meaningful. ``regionCodes`` then
        narrows the map to those regions.
        """
        user = cast(AccountUser, get_current_user(info))
        org = _org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)
        # Pins are note locations, so the note permission is required too. The org
        # check above is the coarse gate; `filter_for_user` narrows it to the rows
        # this user may actually read.
        require_can(user, NotePermissions.VIEW, org=org)

        start_date, end_date = _resolve_dates(org, start_date, end_date)
        start, end = _aware_range(start_date, end_date, report_calendar_time_zone(org))

        scoped_notes = filter_for_user(
            Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end),
            user,
            [NotePermissions.VIEW],
        )
        scoped_codes = list(region_codes or [])
        if scoped_codes:
            if dimension is None:
                # Refused, not ignored. A code without a dimension cannot be resolved —
                # "1" is a council district, an SPA and a supervisorial district — so
                # dropping the filter would return every interaction while looking
                # filtered, which is worse than an error.
                raise ValueError("regionCodes requires a dimension")
            scoped_notes = scope_notes_to_regions(scoped_notes, kind=dimension.value, codes=scoped_codes)

        return interaction_map_data(
            kind=dimension.value if dimension else None,
            start=start,
            end=end,
            organization_id=org.id,
            notes=scoped_notes,
            limit=limit or POINT_LIMIT,
        )

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
                geometry=row["geometry"] if isinstance(row["geometry"], str) else json.dumps(row["geometry"]),
            )
            for row in rows
        ]


def _org_or_deny(org_id: object) -> Organization:
    """Resolve an org id from client input, failing closed (mirrors reports.schema)."""
    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied("You do not have access to this organization.")
    return org


__all__ = ["Query", "RegionCountType", "RegionDimension", "RegionType", "UnassignedReason"]
