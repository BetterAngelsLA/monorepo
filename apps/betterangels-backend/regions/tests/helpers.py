"""Shared test helpers for the regions app."""

from __future__ import annotations

from regions.services import ensure_location_regions


def assign_locations() -> int:
    """Resolve every location to its region, the way ``import_regions`` does.

    Only needed when a test asserts on a *stale* assignment, or wants to control
    when resolution happens. The rollup fills unresolved locations itself before
    counting, so a test that creates regions and locations and then queries will
    see them without calling this.

    Returns the number of assignments written.
    """
    return ensure_location_regions(force=True)
