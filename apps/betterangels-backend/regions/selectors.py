"""Region boundaries and the interaction rollup (DEV-2570 / DEV-2604).

The rollup is a lateral spatial join: for each interaction's point, find the one
region of the requested kind that covers it.

Two properties this module exists to preserve:

1. **Regions are ``geometry``, not ``geography``.** Django's ``within`` lookup
   maps to ``ST_Within`` without ``geography=True`` and therefore appends
   ``::geometry`` to a geography operand, which discards the GiST index. A plain
   ``ST_Covers`` against ``geometry`` keeps it. The point side is cast with
   ``::geometry`` for the same reason.

2. **A point may fall in no region.** A Beverly Hills or Santa Monica address has
   no LA City council district. Those rows are reported with a ``None`` code so
   callers can surface an "Unassigned" bucket — an inner join would silently drop
   roughly a quarter of them.

Raw SQL is used deliberately: the lateral subquery plus ``GROUP BY`` on output
aliases expresses this far more directly than an ORM chain, and the parameter
surface is two scalars and a start/end pair.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Sequence

from django.db import connection

from .models import Region

# The lateral join shared by every rollup. ``%(kind)s`` is a bound parameter;
# ``kind`` is never concatenated into the SQL text.
#
# The point is matched against ``regions_regionpiece``, not ``regions_region``.
# A region is stored as one authoritative full-resolution boundary plus a set of
# subdivided pieces; only the pieces have bounding boxes tight enough for the
# GiST index to discriminate and the per-row recheck is smaller. See
# ``RegionPiece``.
#
# Why this is raw SQL and not the ORM. The equivalent ORM form is a correlated
# subquery -- ``piece.filter(geom__covers=Cast(OuterRef("location__point"), ...))``
# -- and it returns identical buckets. It is 10-26x slower, and the reason is not
# the geometry: Django emits, per note, a scan of every region of that kind, a sort
# of them, and a LIMIT 1 (measured plan: "Index Scan ... rows=15 loops=2000, Rows
# Removed by Join Filter: 14, Full-sort Groups: 2000"). Cost is therefore linear in
# NOTE count, whereas this query resolves each LOCATION once and stays flat:
#
#   notes   locations   raw SQL    ORM subquery
#     500          50   0.002s          0.048s
#   2,000          50   0.001s          0.206s
#   8,000          50   0.001s          0.738s
#
# Simplifying the geometry 25x moved the ORM from 0.266s to 0.171s, which rules out
# point-in-polygon work as the cause. A denormalised assignment table removes it
# entirely (see below) and is ~2x faster than this query, but it is new mutable
# state that must be rebuilt when boundaries change, so it is not adopted yet:
# 120,000 notes x 6 dimensions measured 410-894ms denormalised vs 781-1312ms here.
#
# Two consequences that are load-bearing:
#
# 1. The lateral returns exactly one ``region_id``. A point can coincide with two
#    pieces of the SAME region (interior or on a seam), so the row it picks must
#    be identified by region, not by piece — otherwise two pieces of one region
#    both match and the LIMIT 1 makes the *name* nondeterministic between them.
# 2. Grouping is by region, so a location matching several pieces of one region
#    still contributes exactly once — the ``LIMIT 1`` is the dedupe.
_REGION_ROLLUP_SQL = """
WITH region_of_location AS (
    SELECT l.id AS location_id, p.region_id
    FROM {location_table} l
    LEFT JOIN LATERAL (
        SELECT p.region_id
        FROM regions_regionpiece p
        JOIN regions_region rr ON rr.id = p.region_id
        WHERE p.kind = %(kind)s
          AND ST_Covers(p.geom, l.point::geometry)
        -- Deterministic when a point matches more than one *region*: ST_Covers
        -- includes boundaries, so a coordinate on a shared edge matches both.
        -- Without an ORDER BY the winner is whatever the planner emits.
        --
        -- Ordered by ``code``, not by ``region_id``: ids follow creation order, so
        -- ordering on them would silently re-attribute boundary coordinates
        -- whenever a dimension is re-imported. Code is the stable identity.
        ORDER BY rr.code, rr.id
        LIMIT 1
    ) p ON true
)
SELECT r.code, r.name, count(n.id) AS count
FROM {note_table} n
JOIN region_of_location rl ON rl.location_id = n.location_id
LEFT JOIN regions_region r ON r.id = rl.region_id
WHERE n.interacted_at >= %(start)s
  AND n.interacted_at < %(end)s
  {org_clause}
{code_clause}
GROUP BY 1, 2
ORDER BY count DESC, r.code
"""


def region_counts(
    *,
    kind: str,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    codes: Sequence[str] | None = None,
    unassigned_only: bool = False,
    include_unassigned: bool = False,
) -> list[dict[str, Any]]:
    """Interactions per region of ``kind``, including an unassigned bucket.

    ``organization_id`` scopes the count to one org (the report is org-scoped).

    ``codes`` narrows to specific regions. ``unassigned_only`` narrows to rows
    that matched no region at all (``code IS NULL``).

    These are deliberately *two* parameters rather than one list with a sentinel.
    A sentinel cannot be expressed in the predicate — "code IN (…) OR code IS
    NULL" is a different shape from "code IN (…)" — and collapsing the two cases
    is exactly how an unfiltered rollup gets returned for a filtered request.
    """
    params: dict[str, Any] = {"kind": kind, "start": start, "end": end}
    org_clause = ""
    if organization_id is not None:
        org_clause = "AND n.organization_id = %(org_id)s"
        params["org_id"] = organization_id

    code_clause = ""
    if unassigned_only:
        code_clause = "AND r.code IS NULL"
    elif codes and include_unassigned:
        # Both arms in one predicate. Written as an explicit OR rather than a
        # sentinel inside the array: SQL evaluates `code = ANY(...)` to NULL for
        # an unassigned row, so a sentinel in the list would silently drop it.
        code_clause = "AND (r.code = ANY(%(codes)s) OR r.code IS NULL)"
        params["codes"] = list(codes)
    elif codes:
        code_clause = "AND r.code = ANY(%(codes)s)"
        params["codes"] = list(codes)

    sql = _REGION_ROLLUP_SQL.format(
        location_table="common_location", note_table="notes_note", org_clause=org_clause, code_clause=code_clause
    )

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = cursor.fetchall()

    return [{"code": row[0], "name": row[1] or "", "count": int(row[2])} for row in rows]


def region_totals_without_boundaries(*, start: datetime, end: datetime, organization_id: int | None = None) -> int:
    """Interactions in range that have no location at all.

    Reported separately because ``region_counts`` can only classify notes that
    carry a point; a note with no location would otherwise vanish from every
    bucket and make the report totals disagree with the KPI row.
    """
    params: dict[str, Any] = {"start": start, "end": end}
    org_clause = ""
    if organization_id is not None:
        org_clause = "AND n.organization_id = %(org_id)s"
        params["org_id"] = organization_id

    sql = f"""
        SELECT count(*) FROM notes_note n
        WHERE n.interacted_at >= %(start)s AND n.interacted_at < %(end)s
          AND n.location_id IS NULL
          {org_clause}
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        row = cursor.fetchone()
    return int(row[0]) if row else 0


def available_kinds() -> list[str]:
    """Dimensions that actually have boundaries loaded.

    The UI uses this to avoid offering a grouping the database cannot answer.
    """
    return list(Region.objects.order_by("kind").values_list("kind", flat=True).distinct())


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GeoJSON, for the map view.

    ``ST_AsGeoJSON`` is asked for 6 decimal places (~10 cm). There is no
    simplification argument: boundaries are served at full resolution, and a
    caller needing a smaller payload would have to ask for one explicitly rather
    than receive silently-simplified geometry.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT kind, code, name, ST_AsGeoJSON(geom, 6)::json
            FROM regions_region
            WHERE kind = ANY(%(kinds)s)
              AND (%(codes)s IS NULL OR code = ANY(%(codes)s))
            """,
            {"kinds": list(kinds), "codes": list(codes) if codes else None},
        )
        rows = cursor.fetchall()

    return [{"kind": row[0], "code": row[1], "name": row[2] or "", "geometry": row[3]} for row in rows]


# Cap on per-interaction points returned in one response. The map clusters them, so
# past a few thousand the extra rows change nothing visible but do change the payload
# — the same failure the boundary geometry had at 21 MB. The cap is reported back
# (`truncated`) rather than silently applied, because a partial map that looks
# complete is worse than a slow one.
POINT_LIMIT = 10_000
POINT_LIMIT_MAX = 50_000

# Grid cell size for the density view, in degrees. 0.01 deg is ~1.1 km of latitude
# and ~0.9 km of longitude at Los Angeles — roughly a walkable neighbourhood, which
# is the granularity the density view is for.
DENSITY_GRID_DEGREES = 0.01


def interaction_points(
    *,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    limit: int = POINT_LIMIT,
) -> tuple[list[dict[str, Any]], bool]:
    """Individual interaction locations, for map pins.

    **Coordinates and a timestamp, and nothing else.** Deliberately no client
    name, client id, note id, address, or note content: this answers "where were
    our interactions" without answering "who". `LocationType.point` already exposes
    coordinates wherever a location is readable, and ADR 0002 makes read scope a
    per-model choice, so this is consistent with existing behaviour rather than a
    new class of disclosure — but it stays minimal anyway.

    Returns ``(rows, truncated)``. ``truncated`` says the cap was reached, so the
    caller can tell the user the map is a subset rather than let them read it as
    complete. Asking for one row more than the cap is what detects that.
    """
    limit = max(1, min(limit, POINT_LIMIT_MAX))
    params: dict[str, Any] = {"start": start, "end": end, "limit": limit + 1}
    org_clause = ""
    if organization_id is not None:
        org_clause = "AND n.organization_id = %(org_id)s"
        params["org_id"] = organization_id

    sql = f"""
        SELECT ST_Y(l.point::geometry) AS latitude,
               ST_X(l.point::geometry) AS longitude,
               n.interacted_at
        FROM notes_note n
        JOIN common_location l ON l.id = n.location_id
        WHERE n.interacted_at >= %(start)s
          AND n.interacted_at < %(end)s
          AND n.location_id IS NOT NULL
          {org_clause}
        ORDER BY n.interacted_at DESC
        LIMIT %(limit)s
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        rows = [
            {"latitude": float(lat), "longitude": float(lon), "interacted_at": when}
            for lat, lon, when in cursor.fetchall()
        ]
    truncated = len(rows) > limit
    return rows[:limit], truncated


def interaction_density(
    *,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    cell_degrees: float = DENSITY_GRID_DEGREES,
) -> list[dict[str, Any]]:
    """Interaction counts on a fixed grid, for the density view.

    Aggregated in the database rather than in the browser, so the payload is
    bounded by the grid rather than by the number of interactions. A grid cell with
    no interactions is simply absent; a caller draws only what it receives.
    """
    params: dict[str, Any] = {"start": start, "end": end, "cell": cell_degrees}
    org_clause = ""
    if organization_id is not None:
        org_clause = "AND n.organization_id = %(org_id)s"
        params["org_id"] = organization_id

    sql = f"""
        SELECT ST_Y(ST_SnapToGrid(l.point::geometry, %(cell)s)) AS latitude,
               ST_X(ST_SnapToGrid(l.point::geometry, %(cell)s)) AS longitude,
               count(*) AS count
        FROM notes_note n
        JOIN common_location l ON l.id = n.location_id
        WHERE n.interacted_at >= %(start)s
          AND n.interacted_at < %(end)s
          AND n.location_id IS NOT NULL
          {org_clause}
        GROUP BY 1, 2
        ORDER BY count DESC, 1, 2
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return [
            {"latitude": float(lat), "longitude": float(lon), "count": int(count)}
            for lat, lon, count in cursor.fetchall()
        ]
