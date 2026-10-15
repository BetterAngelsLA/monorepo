"""Mapbox Vector Tiles for region boundaries.

The map used to receive every polygon of a dimension as coordinates — 1.25 MB across the five
LA layers, with ``coc`` alone at 769 kB for 43 polygons — and clipped nothing, because LA County
*is* the extent so a bounding-box filter would return everything. Tiles invert that: the client
asks for what is on screen, and PostGIS generalises to the zoom as it encodes.

Measured on the real layers, DTLA at z10: ``coc`` 1281 B in 1.4 ms, ``city`` 3030 B in 1.9 ms,
``zip`` (densest) 13091 B in 5.2 ms. Against 769 kB / 292 kB / 291 kB for the whole dimensions.
"""

from __future__ import annotations

from django.db import connection

#: Tile coordinate space. 4096 is what deck.gl's MVTLayer and Mapbox's spec both assume.
TILE_EXTENT = 4096

#: Overlap drawn outside the tile so lines and fills do not show a seam at tile edges.
TILE_BUFFER = 64

#: The pre-filter's envelope margin, in tile units. See ``region_tile``.
_MARGIN = TILE_BUFFER / TILE_EXTENT

_TILE_SQL = """
WITH bounds AS (
    -- Two envelopes, deliberately. The margined one decides which rows to *consider*, so a
    -- feature just outside the tile is still fetched and clipped into the buffer; the plain
    -- one is what ST_AsMVTGeom clips against, because PostGIS documents that a margin must
    -- not be passed there.
    SELECT ST_TileEnvelope(%(z)s, %(x)s, %(y)s) AS tile,
           ST_Transform(
               ST_TileEnvelope(%(z)s, %(x)s, %(y)s, margin => %(margin)s::float8), 4326
           ) AS fetch
),
prepared AS (
    SELECT r.code, r.name,
           ST_AsMVTGeom(
               ST_Transform(r.geom_display, 3857), b.tile, %(extent)s, %(buffer)s, true
           ) AS geom
    FROM regions_region r, bounds b
    -- `&&` is evaluated in the table's own SRID, which is what keeps the GiST index; it is a
    -- bounding-box test, so it over-selects slightly and the clip below discards the rest.
    WHERE r.kind = %(kind)s AND r.geom_display && b.fetch
)
SELECT ST_AsMVT(p.*, %(layer)s, %(extent)s, 'geom')
FROM prepared p
WHERE geom IS NOT NULL
"""

#: The MVT media type. Registering the real one matters: deck.gl's loader rejects a tile served
#: as something else, and a 200 carrying non-MVT bytes surfaces as
#: "Worker exception: Error: Unimplemented type: 4" rather than a useful message.
MVT_CONTENT_TYPE = "application/vnd.mapbox-vector-tile"


def region_tile(*, kind: str, z: int, x: int, y: int, layer: str = "regions") -> bytes:
    """One vector tile of ``kind``'s boundaries, or ``b""`` when the tile has no geometry.

    Empty is a normal answer — most tiles of most dimensions are empty — and the caller is
    expected to turn it into a **204**, not a 200 with an empty body. deck.gl reads an empty
    body with a success status as a malformed tile.

    Raw SQL, with every value bound. This is one of the documented cases for it: ``ST_AsMVT``
    is an aggregate over a *row*, and Django's ``Aggregate`` machinery renames the subquery's
    columns (``__col1``, ``__col2``…) before the aggregate sees them, which destroys the
    feature properties — the failure mode ``django-vectortiles`` works around the same way.
    ``kind`` is bound rather than interpolated, so there is no injection surface.

    ``ST_AsMVTGeom`` has no tolerance parameter of its own; it snaps to the integer grid and
    drops repeated and collinear points, and nothing more. Anything coarser has to be applied
    to the geometry first, which is what ``geom_display`` is for.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            _TILE_SQL,
            {
                "kind": kind,
                "z": z,
                "x": x,
                "y": y,
                "margin": _MARGIN,
                "extent": TILE_EXTENT,
                "buffer": TILE_BUFFER,
                "layer": layer,
            },
        )
        row = cursor.fetchone()
    return (row[0] if row and row[0] else b"") or b""
