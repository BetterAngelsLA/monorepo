"""Shared test helpers and fixtures for the regions app."""

from __future__ import annotations

from django.contrib.gis.geos import MultiPolygon, Polygon

from regions.services import build_region_pieces

# Two disjoint boxes: "A" around downtown LA, "B" well to the north-west. Shared rather than
# re-declared per module so a fixture that means the same box in two suites cannot drift.
BOX_A = ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02))
BOX_B = ((-118.60, 34.30), (-118.48, 34.30), (-118.48, 34.40), (-118.60, 34.40), (-118.60, 34.30))
# Deliberately outside both, the way Beverly Hills sits outside LA city limits.
OUTSIDE = (-118.41, 34.07)


def box(coords: tuple[tuple[float, float], ...], srid: int = 4326) -> MultiPolygon:
    """A rectangular ``MultiPolygon`` from a ring of coordinates."""
    return MultiPolygon(Polygon(coords, srid=srid), srid=srid)


def build_pieces(kind: str | None = None) -> int:
    """Subdivide the boundaries, the way ``import_regions`` does. Returns pieces written.

    Only tests exercising the **production** lookup arm need this. A region created with
    ``Region.objects.create`` has no pieces and resolves through ``regions_regionlookup``'s
    parent-boundary fallback instead — both arms are correct, and the fallback is the one
    most fixtures here take.
    """
    return build_region_pieces(kind=kind)
