"""GraphQL surface for region grouping (DEV-2570 / DEV-2604).

Adds the ``RegionDimension`` enum (``models.RegionKind``) and three queries:

* ``interactionsByRegion`` — interaction counts per region of a dimension.
* ``interactionMap`` — individual interaction points, for the map.
* ``regionDimensions`` — which dimensions have boundaries loaded.

They sit alongside the existing ``reportSummary``.

**Boundaries are not served here.** The map draws them as vector tiles from
``regions/views.py``, which is what keeps a dimension's polygons off the GraphQL payload —
see ``regions/tiles.py`` for the measured payload and tile sizes.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date, datetime
from typing import TYPE_CHECKING, List, Optional, cast

import strawberry
import strawberry_django
from django.core.cache import cache
from graphql import GraphQLError
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
from reports.selectors import resolve_date_range

from .grid import DENSITY_MAX_ZOOM
from .models import REGION_KIND_PLURALS, RegionKind
from .selectors import (
    POINT_LIMIT,
    DensityScale,
    available_kinds,
    org_notes_in_range,
    scope_notes_to_regions,
)
from .selectors import (
    density_scale as density_scale_for,
)
from .services import RegionScopeError, interaction_map_data, region_rollup, resolve_region_scope
from .types import (
    DensityScaleType,
    InteractionMapType,
    InteractionScopeType,
    RegionCountType,
    RegionDimensionInfo,
)

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from notes.models import Note


def _note_scoped_notes(org_notes: "QuerySet[Note]", user: AccountUser) -> "QuerySet[Note]":
    """The per-row note authority: the same legacy scope the Notes pages apply.

    A filter rather than a grant predicate, and deliberately so — `interaction_map` carries
    the reasoning. Shared with `interaction_scope` so the two cannot answer differently.
    """
    # `filter_for_user` is untyped upstream, so the shape is asserted rather than inferred.
    return cast("QuerySet[Note]", filter_for_user(org_notes, user, [NotePermissions.VIEW]))


def _is_withheld(*, org_notes: "QuerySet[Note]", scoped_notes: "QuerySet[Note]") -> bool:
    """Whether the note scope removed **every** pin from a set that is not itself empty.

    Both sides are the set *before* any region filter: otherwise a district with no visits
    would read as a permission answer, which is the false diagnosis this flag exists to stop.
    """
    return not scoped_notes.exists() and org_notes.exists()


_CACHE_MISS = object()
#: Long enough to absorb a zoom gesture's repeated scale reads, short enough that a note write
#: is reflected without a manual refresh. The key carries the user id because the note read
#: scope is per-user; a role change can take up to this long to show a different domain.
_DENSITY_SCALE_CACHE_SECONDS = 60


@dataclass(frozen=True)
class _MapScope:
    """The scoped notes and window every map surface shares."""

    org_id: int
    user_id: int
    start: datetime
    end: datetime
    notes: "QuerySet[Note]"
    withheld: bool


def _map_scope(
    *,
    user: AccountUser,
    organization_id: ID,
    start_date: Optional[date],
    end_date: Optional[date],
    dimension: Optional[RegionKind],
    region_codes: Optional[List[str]],
) -> _MapScope:
    """Apply the map's two gates and its region scope once.

    ``interactionMap``, ``interactionScope`` and ``densityScale`` all read the same scoped
    note set; keeping the composition here stops the scale from describing a different
    population than the tiles it colours. ``withheld`` is computed before the region filter,
    as the map's permission answer must not turn a quiet district into a refusal.
    """
    org = org_or_deny(organization_id)
    require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

    start_date, end_date = resolve_date_range(org=org, start_date=start_date, end_date=end_date)
    start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

    # Org confinement happens here, once, in the selector — not in a later SQL clause
    # and not in the permission filter. `filter_for_user` is the *note* read scope and
    # has no org notion: it is a binary "holds `notes.view_note` model-level ⇒ every
    # row of every org", so it cannot confine anything.
    org_notes = org_notes_in_range(organization_id=org.id, start=start, end=end)
    scoped_notes = _note_scoped_notes(org_notes, user)
    withheld = _is_withheld(org_notes=org_notes, scoped_notes=scoped_notes)

    # One reading of `(dimension, regionCodes)`, consulted on every call so these surfaces
    # and the density tile cannot answer the same pair differently.
    try:
        kind, scoped_codes = resolve_region_scope(dimension=dimension.value if dimension else None, codes=region_codes)
    except RegionScopeError as error:
        # A top-level error, because these queries return concrete types and so cannot carry
        # the `OperationInfo` payload the mutation path uses. The `{field, errorCode}` entry is
        # the branchable part; the message stays the human-readable one. See
        # `docs/graphql_errors.md` §2.
        raise GraphQLError(
            str(error),
            extensions={
                "errors": [
                    {"field": error.field, "location": None, "errorCode": error.code},
                ]
            },
        ) from error

    if scoped_codes is not None:
        scoped_notes = (
            scope_notes_to_regions(scoped_notes, kind=cast(str, kind), codes=scoped_codes)
            if scoped_codes
            else scoped_notes.none()
        )

    return _MapScope(
        org_id=org.id,
        user_id=user.pk,
        start=start,
        end=end,
        notes=scoped_notes,
        withheld=withheld,
    )


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

        start_date, end_date = resolve_date_range(org=org, start_date=start_date, end_date=end_date)
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

        ``filter_for_user`` has **no organization awareness at all**, which is why the
        queryset is org-confined *before* it is passed in (``org_notes_in_range``) and why
        ``interaction_points`` also applies its own org predicate.

        For this codename it behaves as all-or-nothing in this deployment — no ``Role``
        carries ``notes.view_note`` and nothing writes an object grant for a note — but that
        is a property of the data, not of the helper. It ORs the model-level permission with
        an object-grant ``pk__in`` subquery, so a per-object grant would narrow the result.
        ``withheld`` is a boolean and therefore reports only the all-or-nothing case: a
        partially scoped map still reads as complete.

        ``dimension`` and ``regionCodes`` are read together, the same way the density tile
        reads them: a non-empty ``regionCodes`` needs a dimension (a code is not unique across
        them), an empty list needs none (it matches nothing either way), and a ``dimension``
        sent without ``regionCodes`` is refused — the caller named a dimension, so returning
        every one would answer a question they did not ask.

        ``limit`` caps the pins. An omitted limit is ``POINT_LIMIT``; ``limit: 0`` is a
        request for one pin, not for the cap, which is the same floor the selector applies
        (``max(1, min(limit, POINT_LIMIT_MAX))``).
        """
        scope = _map_scope(
            user=cast(AccountUser, get_current_user(info)),
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            dimension=dimension,
            region_codes=region_codes,
        )

        return interaction_map_data(
            start=scope.start,
            end=scope.end,
            organization_id=scope.org_id,
            notes=scope.notes,
            # `is not None`, not truthiness: `limit: 0` is a request for one pin, and
            # `limit or POINT_LIMIT` would turn it into the 10,000 cap.
            limit=limit if limit is not None else POINT_LIMIT,
            withheld=scope.withheld,
        )

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def interaction_scope(
        self,
        info: Info,
        organization_id: ID,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> InteractionScopeType:
        """Whether ``interactionMap`` would be withheld for this window.

        Takes only the organization and the window, because that is all the answer depends on:
        ``withheld`` is computed *before* the region filter — otherwise a district with no
        visits would read as a permission answer — so accepting ``dimension``/``regionCodes``
        here would be accepting arguments it silently ignores.

        Same gates and same date resolution as ``interactionMap``, without assembling a
        payload. It exists because the density view needs the answer and draws none of the
        points: a cell-free tile is a **204**, and an MVT has no field to say whether it was
        empty or withheld, so the one surface that can answer has to be asked separately.

        ``withheld`` reports the all-or-nothing case only; see ``interaction_map``.
        """
        scope = _map_scope(
            user=cast(AccountUser, get_current_user(info)),
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            dimension=None,
            region_codes=None,
        )
        return InteractionScopeType(withheld=scope.withheld)

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def density_scale(
        self,
        info: Info,
        organization_id: ID,
        zoom: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        dimension: Optional[RegionKind] = None,
        region_codes: Optional[List[str]] = None,
    ) -> Optional[DensityScaleType]:
        """Quantiles of the density cells at *zoom* — the map's per-zoom colour domain.

        The scale is computed over **the same cells the tile paints**: same org, window,
        note read scope and region scope, and the same global grid size for *zoom*. The
        client uses ``p95`` as the red end, so 95% of the non-empty cells span the ramp and
        the top 5% clamp; that is what keeps the full ramp in use at every zoom.

        The scale is relative to the zoom because the cell size changes with it. A client
        must label it that way, or equal shading reads as equal absolute density.

        ``zoom`` is the tile zoom the client is drawing (0–16). It is refused rather than
        clamped, for the same reason the tile endpoints refuse an out-of-range z: a scale
        for a different grid than the tiles would silently colour the map with the wrong
        domain.
        """
        if not 0 <= zoom <= DENSITY_MAX_ZOOM:
            raise GraphQLError("zoom out of range")

        scope = _map_scope(
            user=cast(AccountUser, get_current_user(info)),
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
            dimension=dimension,
            region_codes=region_codes,
        )

        # A withheld note scope is an authority answer, not a cacheable domain: do not let a
        # cached scale outlive the permission that produced it, even for the short TTL.
        if scope.withheld:
            return None

        # The key carries the user id because the note read scope is per-user. The code list
        # is hashed so a long selection cannot exceed a cache backend's key length.
        if region_codes is None:
            codes_key = "all"
        elif not region_codes:
            codes_key = "none"
        else:
            codes_key = "codes:" + ",".join(sorted(region_codes))
        scope_digest = hashlib.sha256(f"{dimension.value if dimension else '-'}:{codes_key}".encode()).hexdigest()[:16]
        cache_key = (
            f"density-scale:{scope.org_id}:{scope.user_id}:"
            f"{scope.start.date().isoformat()}:{scope.end.date().isoformat()}:"
            f"{scope_digest}:{zoom}"
        )

        cached = cache.get(cache_key, _CACHE_MISS)
        if cached is _CACHE_MISS:
            scale = density_scale_for(notes=scope.notes, zoom=zoom)
            cache.set(cache_key, scale, _DENSITY_SCALE_CACHE_SECONDS)
        else:
            scale = cast(Optional[DensityScale], cached)

        if scale is None:
            return None
        return DensityScaleType(p50=scale.p50, p90=scale.p90, p95=scale.p95, max=scale.max)

    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def region_dimensions(self, info: Info) -> List[RegionDimensionInfo]:
        """Dimensions that actually have boundaries loaded, with their display names.

        Lets the report offer only groupable dimensions instead of presenting a
        control that returns nothing because ``import_regions`` has not run for it.

        The labels travel with the value so a client renders the vocabulary rather than
        keeping its own copy of it; a dimension added later would otherwise fall through
        that copy's lookup and render as a bare code.

        ``IsAuthenticated`` only, deliberately: this exposes which boundary sets exist,
        not any client data. It reads no organization and takes no organization argument.
        """
        return [
            RegionDimensionInfo(
                value=kind,
                label=kind.label,
                plural=REGION_KIND_PLURALS[kind.value],
            )
            for kind in (RegionKind(loaded) for loaded in available_kinds())
        ]
