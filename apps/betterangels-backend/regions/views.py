"""Tile endpoints for region boundaries and interaction density.

A plain DRF view rather than a tile server: boundaries are public reference data behind
``IsAuthenticated``, and the density grid carries client data behind ``reports.view_reports``
plus the note read scope. A tile server such as ``pg_tileserv`` or Martin authenticates as a
*database role* and would bypass the application's permission layer entirely, which is the
whole reason both endpoints live here.
"""

from __future__ import annotations

from datetime import date
from typing import Optional

from django.http import HttpResponse, JsonResponse
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView
from strawberry_django.utils.query import filter_for_user

from common.utils import aware_range
from notes.permissions import NotePermissions
from reports.calendar import report_calendar_time_zone
from reports.permissions import HasReportAccess
from reports.selectors import resolve_date_range

from .models import RegionKind
from .selectors import org_notes_in_range
from .services import RegionScopeError, resolve_region_scope
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

    **``IsAuthenticated`` is the whole gate, deliberately.** These are public reference
    boundaries — identical for every tenant, published by the City and County, carrying no
    org- or client-scoped column. The requirement is a signed-in session because the endpoint
    lives inside the authenticated API surface, not because the polygons are confidential;
    ``reports.view_reports`` would protect nothing the tile does not already publish while
    denying the boundary layer to a signed-in user entitled to read the same data.

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
        # Tiles are a pure function of (kind, z, x, y) and the loaded boundaries, and every
        # reader gets the same bytes, so `public` would also be correct. `private` is the
        # conservative choice: the response is fetched with a session cookie, and this keeps
        # any intermediary from storing a session-bearing response. It is safe to cache until
        # the next import changes the boundaries, and `import_regions` replaces rows in place,
        # so the lifetime is deliberately modest rather than `immutable`.
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
    polygon carrying its ``count``. This replaces shipping the individual points, which are
    ~1.1 MB for a county-scale month on the dev fixture; see ``tiles.density_tile`` for the grid.

    **The authority is ``interactionMap``'s, gate for gate**, because this is the same data
    drawn differently — a filled cell is still a note's location:

    * ``reports.view_reports`` at the requested organization, through ``HasReportAccess`` —
      the same DRF permission the report export uses, which reads ``org_id``, resolves it
      fail-closed, checks the grant, and stores the row on ``request.permitted_org``;
    * the note read scope, via ``filter_for_user(..., [NotePermissions.VIEW])`` — **not**
      ``require_can(..., NotePermissions.VIEW)``. ``interaction_map``'s docstring has the
      reason: notes are a legacy-only domain and no ``Role`` carries ``notes.view_note``, so a
      grant predicate on that codename denies every non-superuser, including the caseworkers
      the map is for.

    The two gates are applied to the *queryset the tile is aggregated from*, not to a count
    computed first and filtered afterwards, so a cell cannot be emitted for an interaction the
    points query would have denied. ``filter_for_user`` is binary and has no organization
    notion, which is why the org predicate is applied before it, in ``org_notes_in_range``.

    Query parameters: ``org_id`` (required, the organization id — the same name
    ``HasReportAccess`` and the CSV export read), ``start``/``end`` (optional ISO dates,
    defaulting to the organization's current month exactly as ``interactionMap`` does),
    ``dimension`` and ``codes`` (optional; scoping to regions).

    ``codes`` and ``dimension`` are refused without each other, with one deliberate exception
    that keeps this surface consistent with ``interactionMap``: an **empty** ``codes`` matches
    nothing in any dimension, so ``?codes=`` is a **204** (an empty map) rather than a 400,
    while a non-empty ``codes`` without a dimension is a 400 because a code is ambiguous
    across dimensions. ``dimension`` without ``codes`` is a 400 as well — refused, not
    silently ignored. Both 400s carry the ``errorCode`` ``interactionMap`` reports for the same
    refusal, so a client branches on one vocabulary across the two channels.

    Serves **204** for a tile with no cells — most of the ocean, most of the time. deck.gl reads
    an empty body with a success status as a malformed tile.
    """

    permission_classes = [IsAuthenticated, HasReportAccess]

    def get(self, request: Request, z: int, x: int, y: int) -> HttpResponse:
        zoom = _zoom_or_none(z, x, y)
        if zoom is None:
            return HttpResponse(status=404)

        # `HasReportAccess` resolved `?org_id=` fail-closed and confirmed the grant; it stores
        # the row on the request so this does not repeat either lookup.
        org = request.permitted_org  # type: ignore[attr-defined]  # set by HasReportAccess

        start_date = _date_param(request, "start")
        end_date = _date_param(request, "end")
        # Same default and same calendar as `interactionMap`, from the same helper, so an
        # omitted range means the same window on both surfaces.
        start_date, end_date = resolve_date_range(org=org, start_date=start_date, end_date=end_date)
        start, end = aware_range(start_date, end_date, report_calendar_time_zone(org))

        dimension = request.query_params.get("dimension")
        codes = _codes_param(request)
        try:
            region_kind, region_codes = resolve_region_scope(dimension=dimension, codes=codes)
        except RegionScopeError as error:
            # `resolve_region_scope` is the one reading of the pair. A non-empty `codes` with no
            # `dimension` is refused here for the reason `interactionMap` refuses it: "1" is a
            # council district, an SPA and a supervisorial district, so guessing would be a
            # wrong answer. A `dimension` with no `codes` is refused by this endpoint alone —
            # the resolver ignores a lone dimension because it has nothing to narrow. Either
            # way, `code` is the branchable part, in the same vocabulary that surface carries in
            # `extensions.errors[].errorCode`; `message` stays human-readable.
            return JsonResponse({"code": error.code, "message": str(error)}, status=400)
        if region_kind is not None and region_kind not in RegionKind.values:
            return HttpResponse(status=400)
        if region_codes == []:
            # `?codes=` asks for no region, which matches nothing in any dimension. Answering
            # it without a query is both cheaper and what `interactionMap` does with `[]`.
            return HttpResponse(status=204)

        # Org confinement happens once, in the selector, before the note permission filter
        # sees the queryset: `filter_for_user` is the note read scope and has no org notion.
        notes = org_notes_in_range(organization_id=org.id, start=start, end=end)
        notes = filter_for_user(notes, request.user, [NotePermissions.VIEW])

        tile = density_tile(
            notes=notes,
            z=zoom,
            x=x,
            y=y,
            # The region scope is applied inside the tile statement rather than by narrowing
            # the note queryset here: it is a boundaries-first semi-join, and `density_tile`
            # and `interactionMap` share `selectors.REGION_LOCATIONS_SQL`, so they cannot
            # disagree about what "inside the region" means.
            region_kind=region_kind,
            region_codes=region_codes,
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
