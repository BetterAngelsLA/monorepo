"""Strawberry types for the region queries (DEV-2570 / DEV-2604).

Split out of ``schema.py`` per ``python.md``: the schema module holds resolvers, the
types live here.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

import strawberry

from common.graphql.types import LatitudeScalar, LongitudeScalar
from regions.models import RegionKind


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

    At most one bucket per ``(kind, code)``, plus **one unassigned bucket per dimension** —
    ``OUTSIDE_ALL_REGIONS`` is computed per dimension, so an ungrouped rollup can return one
    of those for each loaded dimension, and a grouped one returns at most one. Add at most one
    ``NO_LOCATION`` bucket, which is not per dimension. ``code`` is empty for an unassigned
    bucket; use ``is_unassigned``/``unassigned_reason`` to identify it, never ``code`` alone —
    several unassigned buckets can appear in a single response.

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

    latitude: LatitudeScalar
    longitude: LongitudeScalar
    interacted_at: datetime


@strawberry.type
class RegionDimensionInfo:
    """One dimension the report can group by, with the names to render it.

    ``label`` and ``plural`` travel with the value rather than being left to each client: a
    client that spells them out holds a second copy of the vocabulary, and a dimension added
    later falls through its lookup instead of appearing.
    """

    value: RegionKind
    label: str
    plural: str


@strawberry.type
class InteractionMapType:
    """The map payload: the pins for one period, and whether they are all of them.

    ``truncated`` is set when the point cap was reached — the map is then a subset
    of the period's interactions and the UI must say so, because a partial map that
    looks complete is worse than no map.

    ``withheld`` is set when the note read scope removed **every** pin while the
    period had interactions to show. The payload is then an empty list for a reason
    that is not "there were none", and a client that cannot tell the two apart
    reports a permission answer as a fact about the neighbourhood. It is computed by
    the resolver, the only place that knows what the scope removed; the service
    assembles what it is given.

    It reports the **all-or-nothing** case only. The note scope can in principle narrow
    rather than exclude (an object grant), and a boolean cannot say "some"; see
    ``interaction_map``'s docstring.
    """

    points: List[InteractionPointType]
    truncated: bool
    withheld: bool


@strawberry.type
class InteractionScopeType:
    """Whether the caller may see individual interactions for a window.

    One boolean, because it is the one thing a client cannot work out for itself: the density
    tile answers 204 for "nothing here" and for "withheld" alike, and an MVT has no field to
    say which. Kept separate from ``InteractionMapType`` so a view that draws no points can
    ask the question without asking for a payload.
    """

    withheld: bool
