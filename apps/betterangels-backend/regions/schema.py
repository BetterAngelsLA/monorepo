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

from datetime import date
from typing import List, Optional, cast

import strawberry
import strawberry_django
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

from .models import REGION_KIND_PLURALS, RegionKind
from .selectors import POINT_LIMIT, available_kinds, org_notes_in_range, scope_notes_to_regions
from .services import RegionScopeError, interaction_map_data, region_rollup, resolve_region_scope
from .types import (
    InteractionMapType,
    RegionCountType,
    RegionDimensionInfo,
    UnassignedReason,
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

        ``dimension`` is required when a non-empty ``regionCodes`` is given: codes are not
        unique across dimensions, so the dimension is what makes them meaningful. An empty
        list needs no dimension — it matches nothing either way — and a ``dimension`` sent
        without ``regionCodes`` is ignored, because this resolver has nothing to narrow.

        ``limit`` caps the pins. An omitted limit is ``POINT_LIMIT``; ``limit: 0`` is a
        request for one pin, not for the cap, which is the same floor the selector applies
        (``max(1, min(limit, POINT_LIMIT_MAX))``).
        """
        user = cast(AccountUser, get_current_user(info))
        org = org_or_deny(organization_id)
        require_can(user, ReportPermissions.VIEW_REPORTS, org=org)

        start_date, end_date = resolve_date_range(org=org, start_date=start_date, end_date=end_date)
        start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

        # Org confinement happens here, once, in the selector — not in a later SQL clause
        # and not in the permission filter. `filter_for_user` is the *note* read scope and
        # has no org notion: it is a binary "holds `notes.view_note` model-level ⇒ every
        # row of every org", so it cannot confine anything.
        org_notes = org_notes_in_range(organization_id=org.id, start=start, end=end)
        # The per-row note authority. Notes are a legacy domain (ADR 0001 §4.1: gated on
        # RFC 0003, `LEGACY_INERT_APPS` excludes them), so this is the legacy arm and
        # deliberately so — it is the same scope the Notes pages themselves apply.
        scoped_notes = filter_for_user(org_notes, user, [NotePermissions.VIEW])

        # Whether the note scope is what emptied the payload is answerable here and **only**
        # here: downstream the region filter can empty the same payload for a reason the reader
        # can act on ("that district had no visits"). Both sides are the set *before* the region
        # filter is applied, so a region with nothing in it cannot make an empty map read as a
        # permission answer.
        withheld = not scoped_notes.exists() and org_notes.exists()

        # The one reading of `(dimension, regionCodes)`: an empty list matches nothing and
        # needs no dimension, a non-empty list without one is refused, and an absent list is
        # no restriction. It is consulted only when `regionCodes` was sent at all: a
        # `dimension` with no codes has nothing to narrow and is ignored here, as the
        # docstring says.
        if region_codes is not None:
            try:
                kind, scoped_codes = resolve_region_scope(
                    dimension=dimension.value if dimension else None, codes=region_codes
                )
            except RegionScopeError as error:
                # A top-level error, because `interactionMap` returns a concrete type and so
                # cannot carry the `OperationInfo` payload the mutation path uses. The
                # `{field, errorCode}` entry is the branchable part; the message stays the
                # human-readable one. See `docs/graphql_errors.md` §2.
                raise GraphQLError(
                    str(error),
                    extensions={
                        "errors": [
                            {"field": error.field, "location": None, "errorCode": error.code},
                        ]
                    },
                ) from error
            scoped_notes = (
                scope_notes_to_regions(scoped_notes, kind=cast(str, kind), codes=scoped_codes)
                if scoped_codes
                else scoped_notes.none()
            )

        return interaction_map_data(
            start=start,
            end=end,
            organization_id=org.id,
            notes=scoped_notes,
            # `is not None`, not truthiness: `limit: 0` is a request for one pin, and
            # `limit or POINT_LIMIT` would turn it into the 10,000 cap.
            limit=limit if limit is not None else POINT_LIMIT,
            withheld=withheld,
        )

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


__all__ = ["Query", "RegionCountType", "RegionKind", "UnassignedReason"]
