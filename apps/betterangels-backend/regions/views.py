"""Tile endpoint for region boundaries.

A plain DRF view rather than a tile server: these boundaries are public reference data behind
the same ``IsAuthenticated`` gate as the ``regions`` query, so reusing Django's auth beats
standing up ``pg_tileserv`` or Martin — both of which authenticate as a *database role* and
would bypass the application's permission layer entirely.
"""

from __future__ import annotations

from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from .models import RegionKind
from .tiles import MVT_CONTENT_TYPE, region_tile

#: Slippy-map limits. z0 is the whole world; z16 is past the detail these boundaries carry, and
#: without a ceiling a client can ask for a zoom that makes PostGIS encode thousands of
#: sub-millimetre tiles for nothing.
MIN_ZOOM = 0
MAX_ZOOM = 16


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

        # A tile index must be inside [0, 2^z). z is bounded first, so 2**z cannot be enormous.
        zoom = min(max(z, MIN_ZOOM), MAX_ZOOM)
        if z != zoom:
            return HttpResponse(status=404)
        limit = 2**zoom
        if not (0 <= x < limit and 0 <= y < limit):
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
