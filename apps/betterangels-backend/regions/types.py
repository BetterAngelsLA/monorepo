"""Strawberry types for the region queries (DEV-2570 / DEV-2604).

Split out of ``schema.py`` per ``python.md``: the schema module holds resolvers, the
types live here.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import List, Optional

import strawberry
from django.contrib.gis.geos import MultiPolygon

from common.graphql.types import LatitudeScalar, LongitudeScalar

from .models import RegionKind


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

    latitude: LatitudeScalar
    longitude: LongitudeScalar
    interacted_at: datetime


@strawberry.type
class InteractionMapType:
    """Both views of the same interactions, so the client can toggle without refetching.

    ``truncated`` is set when the point cap was reached — the map is then a subset
    of the period's interactions and the UI must say so, because a partial map that
    looks complete is worse than no map.
    """

    points: List[InteractionPointType]
    truncated: bool


@strawberry.type
class RegionType:
    """A boundary polygon.

    ``geometry`` uses strawberry-django's built-in ``MultiPolygon`` scalar — the same one
    ``LocationType.point`` uses via ``Point`` — so the schema says what the field is rather
    than publishing an opaque ``JSON!``. It serialises to the ``coordinates`` of a GeoJSON
    MultiPolygon as nested ``[lng, lat]`` pairs, which a client reads directly.

    **The scalar's serialiser is one level deep and guarded on the exact GEOS type:**

        lambda v: v.tuple if isinstance(v, geos.MultiPolygon) else v

    so it only produces coordinates when the value really is a ``MultiPolygon``. PostGIS
    returns ``POLYGON`` for a single-part result, so correctness rests on
    ``selectors.region_features`` declaring ``output_field=MultiPolygonField()``, which makes
    the ORM coerce the row to a ``MultiPolygon`` regardless. Drop that and the ``else v``
    branch hands a raw GEOS object to the JSON encoder. ``test_region_geometry_is_a_multipolygon``
    pins it, because the failure is a WKT string rather than an error.
    """

    kind: RegionKind
    code: str
    name: str
    geometry: MultiPolygon  # type: ignore[valid-type]
