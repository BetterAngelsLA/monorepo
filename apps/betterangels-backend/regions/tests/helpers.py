"""Shared test helpers for the regions app."""

from __future__ import annotations

from regions.services import ensure_location_regions


def assign_locations() -> int:
    """Resolve every location, the way ``import_regions`` does.

    Only needed to assert on a stale assignment or control when resolution happens:
    the rollup fills unresolved locations itself. Returns the number written.
    """
    return ensure_location_regions(force=True)
