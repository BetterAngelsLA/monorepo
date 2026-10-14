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
from strawberry_django.utils.query import filter_for_user

from accounts.models import User as AccountUser
from common.permissions.utils import IsAuthenticated, require_can
from common.utils import get_or_none
from notes.models import Note
from notes.permissions import NotePermissions
from reports.calendar import report_calendar_time_zone
from reports.permissions import ReportPermissions
from reports.selectors import report_default_date_range

from .selectors import (
    POINT_LIMIT,
    available_kinds,
    interaction_density,
    interaction_points,
    region_counts,
    region_features,
    region_totals_without_boundaries,
    scope_notes_to_regions,
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

    Two conditions, kept distinct because they mean different things: a point that no
    polygon contains is a coverage signal, and a note with no location at all is a
    data-completeness signal.
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
    # Set only on unassigned buckets, so a client can tell the two causes apart
    # without parsing the display name.
    unassigned_reason: Optional[UnassignedReason]


@strawberry.type
class InteractionPointType:
    """One interaction's location, for a map pin.

    Coordinates and a timestamp only. There is deliberately no client, note, or
    address field: the map answers "where were our interactions", not "who".
    """

    latitude: float
    longitude: float
    interacted_at: datetime


@strawberry.type
class DensityCellType:
    """Interactions counted on a fixed grid cell, for the density view.

    Aggregated in the database, so the payload is bounded by the grid rather than
    by the number of interactions.
    """

    latitude: float
    longitude: float
    count: int


@strawberry.type
class InteractionMapType:
    """Both views of the same interactions, so the client can toggle without refetching.

    ``truncated`` is set when the point cap was reached — the map is then a subset
    of the period's interactions and the UI must say so, because a partial map that
    looks complete is worse than no map.
    """

    points: List[InteractionPointType]
    density: List[DensityCellType]
    truncated: bool


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

        # `regionCodes` has three shapes and the first two must not be conflated:
        #   absent            -> unfiltered: every region + both unassigned buckets
        #   `["__unassigned__"]` alone -> only rows matching no region, both causes
        #   real codes (+ sentinel)    -> those regions, plus unassigned when asked
        requested_codes = list(region_codes or [])
        sentinel_requested = UNASSIGNED in requested_codes
        wanted = [c for c in requested_codes if c != UNASSIGNED]
        unassigned_only = sentinel_requested and not wanted
        include_unassigned = region_codes is None or sentinel_requested
        include_locationless = include_unassigned or (not sentinel_requested and not wanted)

        rows = region_counts(
            kind=dimension.value,
            start=start,
            end=end,
            organization_id=org.id,
            codes=wanted if region_codes is not None else None,
            unassigned_only=unassigned_only,
            include_unassigned=sentinel_requested and bool(wanted),
        )

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

        # Notes with no location are invisible to a spatial rollup, so they get their
        # own bucket rather than vanishing and making the total disagree with the KPI
        # row. `unassigned_reason` keeps that bucket tellable from the other one —
        # they share `code`.
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
    def interaction_map(
        self,
        info: Info,
        organization_id: ID,
        dimension: RegionDimension,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: Optional[int] = None,
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
        # The pins are note locations, so the note permission is required too. The
        # org-level check below is the coarse gate; `filter_for_user` narrows it to
        # the rows this user may actually read.
        require_can(user, NotePermissions.VIEW, org=org)

        if start_date is None or end_date is None:
            default_start, default_end = report_default_date_range(org=org)
            start_date = start_date or default_start
            end_date = end_date or default_end

        tz = report_calendar_time_zone(org)
        start, end = _aware_range(start_date, end_date, tz)

        # The same filter the `notes` query applies: org scoping plus any
        # object-level grants. `organization_id` is still passed so the common case
        # does not depend on the filter's SQL shape.
        scoped_notes = filter_for_user(
            Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end),
            user,
            [NotePermissions.VIEW],
        )

        scoped_codes = list(region_codes or [])
        if scoped_codes:
            # One implementation, shared with the tests: see `scope_notes_to_regions`
            # for why the kind is required and why this is a semi-join.
            scoped_notes = scope_notes_to_regions(scoped_notes, kind=dimension.value, codes=scoped_codes)

        points, truncated = interaction_points(
            start=start,
            end=end,
            organization_id=org.id,
            limit=limit or POINT_LIMIT,
            notes=scoped_notes,
        )
        density = interaction_density(start=start, end=end, organization_id=org.id, notes=scoped_notes)

        return InteractionMapType(
            points=[
                InteractionPointType(
                    latitude=row["latitude"],
                    longitude=row["longitude"],
                    interacted_at=row["interacted_at"],
                )
                for row in points
            ],
            density=[
                DensityCellType(latitude=row["latitude"], longitude=row["longitude"], count=row["count"])
                for row in density
            ],
            truncated=truncated,
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
