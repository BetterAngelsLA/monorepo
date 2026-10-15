"""GraphQL surface for region grouping (DEV-2570 / DEV-2604).

Adds the ``RegionDimension`` enum (``models.RegionKind``) and four queries:

* ``interactionsByRegion`` — interaction counts per region of a dimension.
* ``interactionMap`` — individual interaction points, for the map.
* ``regionDimensions`` — which dimensions have boundaries loaded.
* ``regions`` — the boundary polygons themselves, as geometry.

They sit alongside the existing ``reportSummary``.

**Polygons are returned as a GeoJSON string the client parses**, via ``AsGeoJSON``. This is
a payload decision, not a schema limitation: strawberry-django *does* register geometry
scalars (``schema.graphql`` already publishes ``scalar Point`` for ``LocationType.point``,
and ``strawberry_django/fields/types.py`` registers ``MultiPolygon`` alongside it), so a
scalar was available. It was not used because the native scalar serialises the full vertex
set — the six-dimension payload is 21 MB unsimplified against 817 kB for the simplified
``geom_display`` this serves — and because the client needs the geometry as an object, which
a string hands over after one ``JSON.parse`` rather than after a bespoke scalar's shape.
"""

from __future__ import annotations

from datetime import date
from typing import List, Optional, cast

import strawberry
import strawberry_django
from organizations.models import Organization
from strawberry import ID
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user
from strawberry_django.utils.query import filter_for_user

from accounts.models import User as AccountUser
from common.graphql.utils import org_or_deny
from common.permissions.utils import IsAuthenticated, require_can
from common.utils import aware_range
from notes.permissions import NotePermissions
from reports.calendar import report_calendar_time_zone
from reports.permissions import ReportPermissions
from reports.selectors import report_default_date_range

from .models import RegionKind
from .selectors import POINT_LIMIT, available_kinds, org_notes_in_range, region_features, scope_notes_to_regions
from .services import interaction_map_data, region_rollup
from .types import (
    InteractionMapType,
    RegionCountType,
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


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def interactions_by_region(
        self,
        info: Info,
        organization_id: ID,
        dimension: Optional[RegionKind] = None,
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
        org = org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

        start_date, end_date = _resolve_dates(org, start_date, end_date)
        start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

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
        dimension: Optional[RegionKind] = None,
        region_codes: Optional[List[str]] = None,
    ) -> InteractionMapType:
        """Where the interactions happened, as map pins.

        **Two gates, and they are not interchangeable.** The coarse gate is
        ``reports.view_reports`` at the payload org — the same authority as the rollup
        beside it, because a pin is the same interaction the rollup counts, sliced
        differently. The fine gate is the note read scope, applied by
        ``filter_for_user(..., [NotePermissions.VIEW])``.

        It is deliberately **not** ``require_can(..., NotePermissions.VIEW)``. Notes are a
        legacy-only domain: ``LEGACY_INERT_APPS`` (``common/permissions/domain.py``) lists
        shelters/teams/reports/organizations, not notes, and the scoped ``CASEWORKER_ROLE``
        carries only ``Team.perms.VIEW`` (RFC 0003 step 1) — **no ``Role`` carries
        ``notes.view_note``**. A grant predicate on that codename therefore resolves to an
        empty scope and denies every non-superuser, including the caseworkers the map is
        for. That is the ADR §5.3 anti-pattern: gating on a permission before its cutover
        deletes authority rather than moving it. The note scope is enforced below, through
        the same legacy path the Notes pages use.

        ``filter_for_user`` is a **binary** filter, not row-narrowing: it answers "does
        this user hold ``notes.view_note`` model-level (or on an object grant) ⇒ every row
        it is given". It has no organization awareness at all, which is why the queryset
        is org-confined *before* it is passed in (``org_notes_in_range``) and why
        ``interaction_points`` also applies its own org predicate.

        ``dimension`` is required when ``regionCodes`` is given: codes are not unique
        across dimensions, so the dimension is what makes them meaningful.
        """
        user = cast(AccountUser, get_current_user(info))
        org = org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

        start_date, end_date = _resolve_dates(org, start_date, end_date)
        start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

        # Org confinement happens here, once, in the selector — not in a later SQL clause
        # and not in the permission filter. `filter_for_user` is the *note* read scope and
        # has no org notion: it is a binary "holds `notes.view_note` model-level ⇒ every
        # row of every org", so it cannot confine anything.
        scoped_notes = org_notes_in_range(organization_id=org.id, start=start, end=end)
        # The per-row note authority. Notes are a legacy domain (ADR 0001 §4.1: gated on
        # RFC 0003, `LEGACY_INERT_APPS` excludes them), so this is the legacy arm and
        # deliberately so — it is the same scope the Notes pages themselves apply.
        scoped_notes = filter_for_user(scoped_notes, user, [NotePermissions.VIEW])

        scoped_codes = list(region_codes or [])
        if scoped_codes:
            if dimension is None:
                # Refused, not ignored. A code cannot be resolved without a dimension:
                # "1" is a council district, an SPA and a supervisorial district.
                raise ValueError("regionCodes requires a dimension")
            scoped_notes = scope_notes_to_regions(scoped_notes, kind=dimension.value, codes=scoped_codes)

        return interaction_map_data(
            start=start,
            end=end,
            organization_id=org.id,
            notes=scoped_notes,
            limit=limit or POINT_LIMIT,
        )

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def region_dimensions(self, info: Info) -> List[RegionKind]:
        """Dimensions that actually have boundaries loaded.

        Lets the report offer only groupable dimensions instead of presenting a
        control that returns nothing because ``import_regions`` has not run for it.

        ``IsAuthenticated`` only, like ``regions`` and for the same reason: this
        exposes which boundary sets exist, not any client data.
        """
        return [RegionKind(kind) for kind in available_kinds()]

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def regions(
        self,
        info: Info,
        dimension: RegionKind,
        codes: Optional[List[str]] = None,
    ) -> List[RegionType]:
        """Boundary polygons for the map view, as ``MultiPolygon`` values.

        ``IsAuthenticated`` only, deliberately — unlike ``interactionsByRegion``.
        These are public reference boundaries, identical for every tenant; the SELECT
        returns ``kind, code, name`` and the rounded geometry, and no org- or client-scoped
        column. Requiring ``reports.view_reports`` here would mean the map could not render
        for a signed-in user who may see the report's charts but not its boundary layer, with
        no confidentiality gained.
        """
        rows = region_features(kinds=[dimension.value], codes=codes)
        return [
            RegionType(
                kind=RegionKind(row["kind"]),
                code=row["code"],
                name=row["name"],
                # Coordinates, rounded in SQL. The scalar needs a `MultiPolygon`-shaped
                # value, which is what `region_features` returns.
                geometry=row["geometry"],
            )
            for row in rows
        ]


__all__ = ["Query", "RegionCountType", "RegionKind", "RegionType", "UnassignedReason"]
