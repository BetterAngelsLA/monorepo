"""Shared test helpers for the regions app."""

from __future__ import annotations

from regions.services import build_region_pieces


def build_pieces(kind: str | None = None) -> int:
    """Subdivide the boundaries, the way ``import_regions`` does. Returns pieces written.

    Only tests exercising the **production** lookup arm need this. A region created with
    ``Region.objects.create`` has no pieces and resolves through ``regions_regionlookup``'s
    parent-boundary fallback instead — both arms are correct, and the fallback is the one
    most fixtures here take.
    """
    return build_region_pieces(kind=kind)
