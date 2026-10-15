"""Shared test helpers for the regions app."""

from __future__ import annotations

from regions.services import build_region_pieces


def build_pieces(kind: str | None = None) -> int:
    """Subdivide the boundaries, the way ``import_regions`` does. Returns pieces written.

    Only needed by tests that want to exercise the **production** lookup arm. A region
    created with ``Region.objects.create`` — which is what most fixtures here do — has no
    pieces and resolves through ``regions_regionlookup``'s parent-boundary fallback instead.
    Both arms are correct and both are pinned, by
    ``test_a_region_with_no_pieces_resolves_through_the_lookup_view`` and
    ``test_a_region_with_pieces_resolves_through_them``.

    There is no equivalent of the old ``assign_locations``: the rollup does the spatial
    join itself, so there is no location-to-region state to build.
    """
    return build_region_pieces(kind=kind)
