"""Shared test helpers for the regions app."""

from __future__ import annotations

from regions.selectors import ensure_location_regions


def assign_locations() -> int:
    """Resolve every location to its region, the way ``import_regions`` does.

    ``region_counts`` reads the stored ``LocationRegion`` assignment rather than
    doing the spatial join itself, so a test that creates regions and locations
    directly has to run this before the rollup can see anything. Tests that forget
    get every interaction reported as unassigned, which looks like a broken query
    rather than a missing setup step — hence one helper rather than a comment.

    Returns the number of assignments written.
    """
    return ensure_location_regions(force=True)
