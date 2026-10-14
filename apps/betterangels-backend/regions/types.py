"""Strawberry types for the region queries (DEV-2570 / DEV-2604).

Split out of ``schema.py`` per ``python.md``: the schema module holds resolvers, the
types live here.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

import strawberry


class RegionDimension(enum.Enum):
    """The geographic dimensions interactions can be grouped or filtered by.

    Values mirror ``RegionKind`` so the enum, the DB and the loader agree.
    """

    ZIP = "zip"
    CITY = "city"
    COUNCIL_DISTRICT = "council_district"
    SUPERVISORIAL_DISTRICT = "supervisorial_district"
    SPA = "spa"
    COC = "coc"


@strawberry.enum
class UnassignedReason(enum.Enum):
    """Why a bucket could not be attributed to a named region.

    Two conditions, kept distinct because they mean different things: a point that no
    polygon contains is a coverage signal, and a note with no location at all is a
    data-completeness signal.
    """

    OUTSIDE_ALL_REGIONS = "OUTSIDE_ALL_REGIONS"
    NO_LOCATION = "NO_LOCATION"


@strawberry.type
class RegionCountType:
    """One bucket of the rollup.

    At most one bucket per ``(kind, code)``, plus at most one of each
    ``unassigned_reason``. ``code`` is empty for an unassigned bucket; use
    ``is_unassigned``/``unassigned_reason`` to identify it, never ``code`` alone —
    there can be two unassigned buckets in a single response.

    ``kind`` is empty when the rollup covers a single dimension, and names the
    dimension on every bucket when it spans all of them. It is needed there because a
    code alone is ambiguous: ``"1"`` is a council district, an SPA and a supervisorial
    district.
    """

    kind: str
    code: str
    name: str
    count: int
    is_unassigned: bool
    # Set only on unassigned buckets, so a client can tell the two causes apart
    # without parsing the display name.
    unassigned_reason: Optional[UnassignedReason]


@strawberry.type
class InteractionPointType:
    """One interaction's location, for a map pin.

    Coordinates and a timestamp only. There is deliberately no client, note, or
    address field: the map answers "where were our interactions", not "who".
    """

    latitude: float
    longitude: float
    interacted_at: datetime


@strawberry.type
class DensityCellType:
    """Interactions counted on a fixed grid cell, for the density view.

    Aggregated in the database, so the payload is bounded by the grid rather than
    by the number of interactions.
    """

    latitude: float
    longitude: float
    count: int


@strawberry.type
class InteractionMapType:
    """Both views of the same interactions, so the client can toggle without refetching.

    ``truncated`` is set when the point cap was reached — the map is then a subset
    of the period's interactions and the UI must say so, because a partial map that
    looks complete is worse than no map.
    """

    points: List[InteractionPointType]
    density: List[DensityCellType]
    truncated: bool


@strawberry.type
class RegionType:
    """A boundary polygon, as GeoJSON text."""

    kind: RegionDimension
    code: str
    name: str
    geometry: str
