"""Mapbox Vector Tiles for region boundaries and interaction density.

Boundaries as coordinates are 27 MB across the six loaded dimensions, 1.0 MB once simplified
(560 kB of stored geometry), and a bounding-box filter prunes nothing, because LA County *is*
the extent. Tiles invert that: the client asks for what is on screen, and PostGIS generalises to
the zoom as it encodes.

**Every figure in this module comes from one measurement**, taken on the dev fixture — 431
regions, 5,685 pieces, 4,000 locations, 20,000 notes — with the whole-dimension payloads read as
``sum(length(ST_AsGeoJSON(…)))`` and ``sum(pg_column_size(…))``. It is a point-in-time
measurement of one fixture, not a spec; re-measure before quoting it as one.

Measured on the loaded layers, DTLA at z10: ``coc`` 1281 B, ``city`` 3030 B, ``zip`` (densest)
13091 B — against 59 kB / 216 kB / 518 kB of simplified GeoJSON for the whole ``coc`` / ``city``
/ ``zip`` dimensions (932 kB / 5.4 MB / 12 MB unsimplified).

The **density** tile is the same trick applied to the interaction points, which as a raw point
list are ~1.1 MB for a single LA County month on this fixture (see ``interactionMap``). Every
non-empty grid cell becomes one polygon carrying its ``count``, so the client receives an area
rather than a point cloud and the payload is bounded by the cells in view instead of by the
interactions.
"""

from __future__ import annotations

from typing import Any, Sequence

from django.db import connection
from django.db.models import QuerySet

from common.models import Location
from notes.models import Note

from .selectors import _REGION_TABLE, REGION_LOCATIONS_SQL
from .services import resolve_region_scope

#: The location table, taken from the model rather than written out, so a ``db_table``
#: override cannot leave the density SQL pointing somewhere else — the same rule ``selectors``
#: follows for its raw SQL. ``_REGION_TABLE`` is imported from there rather than re-derived,
#: so every raw statement in the app names the region table the same way.
_LOCATION_TABLE = Location._meta.db_table

#: Tile coordinate space. 4096 is what deck.gl's MVTLayer and Mapbox's spec both assume.
TILE_EXTENT = 4096

#: Overlap drawn outside the tile so lines and fills do not show a seam at tile edges.
TILE_BUFFER = 64

#: The pre-filter's envelope margin, in tile units. See ``region_tile``.
_MARGIN = TILE_BUFFER / TILE_EXTENT

_TILE_SQL = f"""
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
    FROM {_REGION_TABLE} r, bounds b
    -- `&&` is evaluated in the table's own SRID, so it can use the GiST index on
    -- `geom_display` that migration `0005` adds — a `GeneratedField` is never indexed
    -- automatically. The planner leads with the envelope only when it is selective (deep
    -- zoom); at coarse zoom a tile holds most of the dimension, so it scans by `kind` and
    -- filters, which is the correct plan. Either way the index is what keeps the read from
    -- scaling with the number of regions loaded. It is a bounding-box test, so it
    -- over-selects slightly and the clip below discards the rest.
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


# --- Interaction density -------------------------------------------------------------------
#
# A **fraction of the tile**, not a distance and not a count of metres. That choice is what
# makes one cell the same number of *screen pixels* at every zoom — deck.gl draws a 512 px
# tile, so 64 cells is an 8 px cell from z0 to z16 — and the reader's sense of "how
# concentrated is this" therefore does not quietly change scale when they zoom. It also keeps
# adjacent tiles lined up: a tile edge in Web Mercator is a multiple of the tile width, which
# is a multiple of the cell size whenever the cell size is the tile divided by a whole number.
#
# Measured on the LA County fixture, a county-scale tile holds ~1,250 non-empty cells and
# ~30 kB of MVT at z9 (~370 cells, ~9 kB at z8), against ~1.1 MB for the same month's points
# through ``interactionMap``.
#
# **z9 is not the zoom the admin map asks for.** deck.gl's tiles are 512 px while Google's
# zoom levels are 256 px, so a map at Google zoom 9 requests **z8** — which is why the client's
# colour reference is measured against z8 cell counts and not these. The number here is kept
# at z9 because that is the zoom ``curl`` at a tile is read at, and the ratio is what matters:
# four times the cells at a quarter of the count each.
DENSITY_CELLS_PER_TILE = 64

#: The layer name inside the tile, and what the client selects on.
DENSITY_LAYER = "density"

#: **Zero**, unlike the boundary tiles. Their 64-unit margin exists so a line crossing the
#: tile edge is drawn continuously by both neighbours; cells do not cross the edge — the grid
#: is aligned to it — so a margin would only overlap a full cell with the neighbour's own cell
#: for the same ground, drawing one count over another along every tile seam.
DENSITY_TILE_BUFFER = 0

#: The permission-scoped note subquery, spliced in by the caller, as ``scoped``. ``{scoped}``
#: is a ``SELECT location_id …`` from the queryset's own compiler, so its bind parameters sit
#: ahead of every other parameter in the statement.
_DENSITY_SCOPED = """
scoped AS (
    {scoped}
)"""

#: The region semi-join, present only when the read is scoped to region codes.
#:
#: **Boundaries drive and the points are probed**, the direction ``selectors._assigned_counts``
#: documents: one pass over the selected regions, probing the GiST index on ``point_geom``.
#: The statement is ``selectors.REGION_LOCATIONS_SQL``, imported rather than rewritten, so the
#: density tile, the rollup and ``interactionMap``'s ``regionCodes`` filter share one definition
#: of "this point is in this region" — `regions_regionlookup`'s two arms included.
#:
#: Its ``DISTINCT`` is load-bearing: a location may fall in more than one piece of the same
#: region, and without it the note would be counted once per piece.
_DENSITY_REGION = """
, region_locations AS (
    {region_locations_sql}
)"""

#: The seen-from-space part of the statement: the tile's Web Mercator envelope, the grid origin,
#: and the cell size derived from it. ``ST_TileEnvelope`` is the origin as well as the clip, so
#: no floating-point drift accumulates across the tile.
_DENSITY_BOUNDS = """
, bounds AS (
    SELECT ST_TileEnvelope(%s, %s, %s) AS tile
)
, origin AS (
    SELECT tile,
           ST_XMin(tile) AS x0,
           ST_YMin(tile) AS y0,
           (ST_XMax(tile) - ST_XMin(tile)) / %s::float8 AS size
    FROM bounds
)"""

#: One row per non-empty cell, in tile-relative cell indices.
#:
#: **Integer division on the projected point, not ``ST_SnapToGrid``.** ``ST_SnapToGrid`` on a
#: geometry snaps each *vertex* to the nearest grid intersection, so a point in the middle of
#: a cell lands on that cell's lower-left corner — but a point past the midpoint lands on the
#: upper-right one. Two points in the same cell can therefore snap to opposite corners and be
#: counted as two, which is exactly the aggregation this exists to do. ``floor`` of the
#: projected coordinate divided by the cell size is a cell *membership* test with one answer
#: per point.
#:
#: The ``&&`` pre-filter is evaluated against ``Location.point_geom`` in its own SRID, which is
#: what keeps the GiST index — the tile's envelope transformed to 4326 is a rectangle, since
#: Mercator maps the sphere to a rectangle axis by axis. It is a bounding-box test, so it
#: over-selects and the exact grouping discards the rest.
_DENSITY_CELLS = """
, cells AS (
    SELECT floor((ST_X(ST_Transform(l.point_geom, 3857)) - o.x0) / o.size)::int AS cx,
           floor((ST_Y(ST_Transform(l.point_geom, 3857)) - o.y0) / o.size)::int AS cy,
           count(*) AS count
    FROM scoped s
    JOIN {location_table} l ON l.id = s.location_id
    CROSS JOIN origin o
    WHERE l.point_geom && ST_Transform(o.tile, 4326){region_filter}
    GROUP BY 1, 2
)"""

#: The cells, as polygons in tile space, encoded as one MVT layer.
#:
#: The polygon is rebuilt from the same origin and cell size the grouping used, so the shape a
#: cell is drawn as is the area its count was computed over.
_DENSITY_ENCODE = """
, prepared AS (
    SELECT c.count,
           ST_AsMVTGeom(
               ST_MakeEnvelope(
                   o.x0 + c.cx * o.size, o.y0 + c.cy * o.size,
                   o.x0 + (c.cx + 1) * o.size, o.y0 + (c.cy + 1) * o.size,
                   3857
               ),
               o.tile, %s, %s, true
           ) AS geom
    FROM cells c
    CROSS JOIN origin o
)
SELECT ST_AsMVT(p.*, %s, %s, 'geom')
FROM prepared p
WHERE geom IS NOT NULL
"""

#: The membership test the region CTE's ids are joined through.
_DENSITY_REGION_FILTER = """
      AND l.id IN (SELECT id FROM region_locations)"""


def density_tile(
    *,
    notes: QuerySet[Note],
    z: int,
    x: int,
    y: int,
    region_kind: str | None = None,
    region_codes: Sequence[str] | None = None,
    layer: str = DENSITY_LAYER,
) -> bytes:
    """One vector tile of interaction density, or ``b""`` when the tile has no cells.

    ``notes`` is the **permission-scoped** queryset — org-confined and narrowed by the note read
    scope — and it is compiled into the statement as a derived table rather than resolved to a
    list of ids. That is deliberate: the confinement is whatever Django's own permission
    machinery produced, so the tile cannot disagree with ``interactionMap`` about which notes
    exist, and 20,000 ids do not cross the wire to say so. The compiled SQL and its parameters
    come from the queryset's own compiler, so they are bound, not interpolated; the parameters
    are positional because a statement cannot mix ``%(name)s`` and ``%s``, and every other
    parameter is appended in the order its fragment appears in the text.

    ``region_kind``/``region_codes`` narrow the cells to interactions whose location falls in
    one of those regions of that dimension. They go through ``services.resolve_region_scope``,
    the one expression of the contract: both are required together, a non-empty code list
    without a dimension is ambiguous and refused, and an empty code list matches **nothing**
    rather than everything — short-circuited here because ``= ANY('{}')`` needs an array type
    Postgres cannot infer from an empty list, and the answer is known without asking. ``None``
    codes means no restriction.

    Empty is a normal answer and the caller must turn it into a **204**: deck.gl reads an empty
    body with a success status as a malformed tile.

    Nothing is cached and nothing is precomputed — this is a live aggregate over the same
    tables the rollup reads, which is why there is no migration behind it.
    """
    region_kind, region_codes = resolve_region_scope(dimension=region_kind, codes=region_codes)
    if region_codes == []:
        return b""

    # `sql_with_params` returns SQL containing real `%s` placeholders *and* the parameters that
    # bind them, so the text goes in verbatim and `scoped_params` heads the positional list. The
    # templates below use `%s` too, so the fragments compose into one pyformat statement. A
    # literal `%` cannot appear here from the ORM — a `Value("%")` arrives as a bound parameter —
    # so the one source would be a caller's `RawSQL`, which has to escape its own text.
    scoped_sql, scoped_params = notes.order_by().values("location_id").query.sql_with_params()
    params: list[Any] = [*scoped_params]
    sql = "WITH " + _DENSITY_SCOPED.format(scoped=scoped_sql)

    if region_codes is not None:
        sql += _DENSITY_REGION.format(region_locations_sql=REGION_LOCATIONS_SQL)
        params += [region_kind, list(region_codes)]

    sql += _DENSITY_BOUNDS
    params += [z, x, y, DENSITY_CELLS_PER_TILE]

    sql += _DENSITY_CELLS.format(
        location_table=_LOCATION_TABLE,
        region_filter=_DENSITY_REGION_FILTER if region_codes is not None else "",
    )
    sql += _DENSITY_ENCODE
    params += [TILE_EXTENT, DENSITY_TILE_BUFFER, layer, TILE_EXTENT]

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
    return (row[0] if row and row[0] else b"") or b""
