"""Tile endpoints for region boundaries and interaction density.

A plain DRF view rather than a tile server: boundaries are public reference data behind the
same ``IsAuthenticated`` gate as the ``regions`` query, and the density grid carries client
data behind the same two gates as ``interactionMap``. A tile server such as ``pg_tileserv``
or Martin authenticates as a *database role* and would bypass the application's permission
layer entirely, which is the whole reason both endpoints live here.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from django.http import HttpResponse
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView
from strawberry_django.utils.query import filter_for_user

from common.graphql.utils import org_or_deny
from common.permissions.utils import require_can
from common.utils import aware_range
from notes.permissions import NotePermissions
from reports.calendar import report_calendar_time_zone
from reports.permissions import ReportPermissions
from reports.selectors import report_default_date_range

from .models import RegionKind
from .selectors import org_notes_in_range
from .tiles import DENSITY_LAYER, MVT_CONTENT_TYPE, density_tile, region_tile

#: Slippy-map limits. z0 is the whole world; z16 is past the detail these boundaries carry, and
#: without a ceiling a client can ask for a zoom that makes PostGIS encode thousands of
#: sub-millimetre tiles for nothing.
MIN_ZOOM = 0
MAX_ZOOM = 16


def _zoom_or_none(z: int, x: int, y: int) -> Optional[int]:
    """The clamped zoom when ``(z, x, y)`` is a real tile index, otherwise ``None``.

    Shared by both tile endpoints so the two cannot drift on what "out of range" means. z is
    bounded first, so ``2**z`` cannot be enormous.
    """
    zoom = min(max(z, MIN_ZOOM), MAX_ZOOM)
    if z != zoom:
        return None
    limit = 2**zoom
    if not (0 <= x < limit and 0 <= y < limit):
        return None
    return zoom


class RegionTileView(APIView):
    """``GET /regions/tiles/<kind>/<z>/<x>/<y>.mvt``

    The same authority as the ``regions`` GraphQL query — ``IsAuthenticated`` — deliberately.
    These are public boundaries, identical for every tenant, and the response carries no org- or
    client-scoped column. Gating this behind ``reports.view_reports`` would deny the boundary
    layer to a signed-in user who can already read it through GraphQL, while protecting nothing
    that the tile does not already expose.

    Serves **204** for a tile with no geometry, which is the common case. deck.gl treats an empty
    body with a 200 as a malformed tile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, kind: str, z: int, x: int, y: int) -> HttpResponse:
        if kind not in RegionKind.values:
            return HttpResponse(status=404)

        zoom = _zoom_or_none(z, x, y)
        if zoom is None:
            return HttpResponse(status=404)

        tile = region_tile(kind=kind, z=zoom, x=x, y=y)
        if not tile:
            return HttpResponse(status=204)

        response = HttpResponse(tile, content_type=MVT_CONTENT_TYPE)
        # Tiles are a pure function of (kind, z, x, y) and the loaded boundaries, so they are
        # safe to cache until the next import changes them. `import_regions` replaces rows in
        # place, so the lifetime is deliberately modest rather than `immutable`.
        response["Cache-Control"] = "private, max-age=3600"
        return response


def _date_param(request: Request, name: str) -> Optional[date]:
    """One optional ISO date query parameter, or ``None`` when it is absent.

    A malformed value is refused rather than ignored: silently dropping ``start`` would widen
    the range to the default and serve a different set of interactions than the caller asked
    for, which is the same class of mistake as reading an empty code list as "no filter".
    """
    raw = request.query_params.get(name)
    if raw is None:
        return None
    parsed = parse_date(raw)
    if parsed is None:
        raise ValidationError({name: "must be an ISO date (YYYY-MM-DD)."})
    return parsed


def _codes_param(request: Request) -> Optional[list[str]]:
    """Optional region codes, or ``None`` when the parameter is absent altogether.

    ``None`` and ``[]`` are different requests and are kept different here exactly as they are
    in ``interactionMap``: absent means no restriction, present-but-empty means "no region",
    which matches nothing. ``?codes=`` and ``?codes=,,`` are therefore the empty list rather
    than an unfiltered read. Repeated (``?codes=1&codes=2``) and comma-separated
    (``?codes=1,2``) spellings both work, because a tile URL is built by hand and either is a
    reasonable thing to write.
    """
    if "codes" not in request.query_params:
        return None
    return [code for raw in request.query_params.getlist("codes") for code in raw.split(",") if code]


class DensityTileView(APIView):
    """``GET /regions/tiles/density/<z>/<x>/<y>.mvt``

    One interaction-density tile: every non-empty cell of a fixed grid over the tile, as a
    polygon carrying its ``count``. This replaces shipping the individual points, which is 1 MB
    for a county-scale month; see ``tiles.density_tile`` for the grid itself.

    **The authority is ``interactionMap``'s, gate for gate**, because this is the same data
    drawn differently — a filled cell is still a note's location:

    * ``reports.view_reports`` at the requested organization, via ``require_can``;
    * the note read scope, via ``filter_for_user(..., [NotePermissions.VIEW])`` — **not**
      ``require_can(..., NotePermissions.VIEW)``. ``interaction_map``'s docstring has the
      reason: notes are a legacy-only domain and no ``Role`` carries ``notes.view_note``, so a
      grant predicate on that codename denies every non-superuser, including the caseworkers
      the map is for.

    The two gates are applied to the *queryset the tile is aggregated from*, not to a count
    computed first and filtered afterwards, so a cell cannot be emitted for an interaction the
    points query would have denied. ``filter_for_user`` is binary and has no organization
    notion, which is why the org predicate is applied before it, in ``org_notes_in_range``.

    Query parameters: ``organizationId`` (required), ``start``/``end`` (optional ISO dates,
    defaulting to the organization's current month exactly as ``interactionMap`` does),
    ``dimension`` and ``codes`` (optional; scoping to regions, and refused without each other
    because a code is ambiguous across dimensions).

    Serves **204** for a tile with no cells — most of the ocean, most of the time. deck.gl reads
    an empty body with a success status as a malformed tile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, z: int, x: int, y: int) -> HttpResponse:
        zoom = _zoom_or_none(z, x, y)
        if zoom is None:
            return HttpResponse(status=404)

        organization_id = request.query_params.get("organizationId")
        if not organization_id:
            return HttpResponse(status=400)

        # Existence first, then authority at the org that exists (ADR 0001 finding F7): `can`
        # never implies the organization exists, so these are two checks and both are required.
        # `org_or_deny` also makes an unknown id a refusal rather than a 500.
        org = org_or_deny(organization_id)
        require_can(request.user, ReportPermissions.VIEW_REPORTS, org=org)

        start_date = _date_param(request, "start")
        end_date = _date_param(request, "end")
        if start_date is None or end_date is None:
            # Same default and the same calendar as `interactionMap`, from the same helper, so
            # an omitted range means the same window on both surfaces.
            default_start, default_end = report_default_date_range(org=org)
            start_date = start_date or default_start
            end_date = end_date or default_end
        start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

        codes = _codes_param(request)
        dimension = request.query_params.get("dimension")
        if codes is not None:
            # Refused, not ignored — the same refusal `interactionMap` raises. A code cannot be
            # resolved without a dimension: "1" is a council district, an SPA and a
            # supervisorial district.
            if dimension is None:
                return HttpResponse(status=400)
            if dimension not in RegionKind.values:
                return HttpResponse(status=400)
        elif dimension is not None and dimension not in RegionKind.values:
            return HttpResponse(status=400)

        # Org confinement happens once, in the selector, before the note permission filter
        # sees the queryset: `filter_for_user` is the note read scope and has no org notion.
        notes = org_notes_in_range(organization_id=org.id, start=start, end=end)
        notes = filter_for_user(notes, request.user, [NotePermissions.VIEW])

        tile = density_tile(
            notes=notes,
            z=zoom,
            x=x,
            y=y,
            # The region scope is applied inside the tile statement rather than by
            # `scope_notes_to_regions` here, and a measurement is what decided it: that
            # helper's per-note correlated EXISTS costs **2,600 ms a tile** against **2 ms**
            # for the boundaries-first semi-join `tiles.density_tile` writes (see
            # `_DENSITY_REGION` for the plan). Both read `regions_regionlookup`, so they
            # cannot disagree about what "inside the region" means — only about the plan.
            region_kind=dimension if codes is not None else None,
            region_codes=codes,
            layer=DENSITY_LAYER,
        )
        if not tile:
            return HttpResponse(status=204)

        response = HttpResponse(tile, content_type=MVT_CONTENT_TYPE)
        # **Private**, because unlike the boundaries the answer is scoped to the caller's
        # organization and note permissions — a shared cache keyed on the URL (which is where
        # the org and the range live) must not hand one tenant's cells to another. Short
        # rather than the boundary layer's hour, because the grid follows notes as they are
        # written, not a boundary import.
        response["Cache-Control"] = "private, max-age=60"
        return response
