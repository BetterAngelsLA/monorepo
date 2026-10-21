"""Density grid geometry shared by the tile SQL and the per-zoom colour scale.

The grid is sized to a **ground distance**, not a fixed fraction of a tile. That floor is the
density estimate's resolution, not only a rendering choice: on the county fixture the median
non-empty 500 m cell holds ~3 interactions, while a 127 m cell holds ~1. Shrinking further
turns the heatmap into a binary occupied/not map and makes the per-zoom percentile describe
sampling noise. The 64-cells-per-tile cap is the separate county-view payload cap.

Both the tile endpoint and the scale query use this module, so the cells whose counts the
scale summarises are exactly the cells the map paints.
"""

from __future__ import annotations

import math

#: Target ground width of one density cell: the estimate's resolution floor, in metres.
DENSITY_TARGET_CELL_M = 500
#: Cap for the county view; a z8 tile would otherwise ask for 260 cells across.
DENSITY_MAX_CELLS_PER_TILE = 64
#: LA's latitude. The target is a ground size, so the tile width is scaled by ``cos(lat)``;
#: the admin report is LA-specific and one reference keeps the server and client equal.
DENSITY_REFERENCE_LATITUDE = 34.05
EARTH_CIRCUMFERENCE_M = 40_075_016.686
#: Web Mercator's half-width, the origin of the global grid.
MERCATOR_HALF_WORLD = 20_037_508.342789244
#: The deepest tile zoom the density endpoint serves; the scale refuses beyond it.
DENSITY_MAX_ZOOM = 16


def density_cells_per_tile(z: int) -> int:
    """Cells across a z tile, targeting ``DENSITY_TARGET_CELL_M`` at LA's latitude."""
    tile_width: float = float(EARTH_CIRCUMFERENCE_M * math.cos(math.radians(DENSITY_REFERENCE_LATITUDE)) / 2**z)
    cells: int = int(math.floor(tile_width / DENSITY_TARGET_CELL_M + 0.5))
    return int(max(1, min(DENSITY_MAX_CELLS_PER_TILE, cells)))


def density_cell_size_mercator(z: int) -> float:
    """One cell's width in Web Mercator units; the global grid's cell size at z."""
    return float((2 * MERCATOR_HALF_WORLD) / 2**z / density_cells_per_tile(z))


def density_cell_xy_sql(*, origin_x: str, origin_y: str, size: str) -> str:
    """The two cell-index expressions, shared by the tile and the scale query.

    ``origin_x``/``origin_y``/``size`` are SQL expressions, not values: the tile uses its
    per-tile origin and cell size, while the scale query uses the global Mercator origin and
    the same cell size. Keeping the projection and floor here means the cells the scale
    summarises are the cells the tile paints rather than a second implementation.
    """
    return (
        f"floor((ST_X(ST_Transform(l.point_geom, 3857)) - ({origin_x})) / ({size}))::int AS cx,\n"
        f"           floor((ST_Y(ST_Transform(l.point_geom, 3857)) - ({origin_y})) / ({size}))::int AS cy"
    )
