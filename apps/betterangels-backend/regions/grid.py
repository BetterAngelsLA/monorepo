"""Density grid geometry shared by the tile SQL and the per-zoom colour scale.

The grid is sized to a **ground distance**, not a fixed fraction of a tile: a fixed 64×64
grid shrinks a cell to ~127 m by z12, where a single interaction reads as a huge density and
every occupied cell turns red. The tile uses as many cells as it takes to keep a cell near
``DENSITY_TARGET_CELL_M``, capped for the county view.

Both the tile endpoint and the scale query use this module, so the cells whose counts the
scale summarises are exactly the cells the map paints.
"""

from __future__ import annotations

import math

#: Target ground width of one density cell, in metres.
DENSITY_TARGET_CELL_M = 500
#: Cap for the county view; a z8 tile would otherwise ask for 260 cells across.
DENSITY_MAX_CELLS_PER_TILE = 64
#: LA's latitude. The target is a ground size, so the tile width is scaled by ``cos(lat)``;
#: the admin report is LA-specific and one reference keeps the server and client equal.
DENSITY_REFERENCE_LATITUDE = 34.05
EARTH_CIRCUMFERENCE_M = 40_075_016.686
#: Web Mercator's half-width, the origin of the global grid.
MERCATOR_HALF_WORLD = 20_037_508.342789244


def density_cells_per_tile(z: int) -> int:
    """Cells across a z tile, targeting ``DENSITY_TARGET_CELL_M`` at LA's latitude."""
    tile_width: float = float(EARTH_CIRCUMFERENCE_M * math.cos(math.radians(DENSITY_REFERENCE_LATITUDE)) / 2**z)
    cells: int = int(math.floor(tile_width / DENSITY_TARGET_CELL_M + 0.5))
    return int(max(1, min(DENSITY_MAX_CELLS_PER_TILE, cells)))


def density_cell_size_mercator(z: int) -> float:
    """One cell's width in Web Mercator units; the global grid's cell size at z."""
    return float((2 * MERCATOR_HALF_WORLD) / 2**z / density_cells_per_tile(z))
