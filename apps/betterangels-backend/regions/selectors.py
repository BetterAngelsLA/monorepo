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

from .models import Region, RegionKind

# The lateral join shared by every rollup. ``%(kind)s`` is a bound parameter;
# ``kind`` is never concatenated into the SQL text.
_REGION_ROLLUP_SQL = """
WITH region_of_location AS (
    SELECT l.id AS location_id, r.code, r.name
    FROM {location_table} l
    LEFT JOIN LATERAL (
        SELECT r.code, r.name
        FROM regions_region r
        WHERE r.kind = %(kind)s
          AND ST_Covers(r.geom, l.point::geometry)
        LIMIT 1
    ) r ON true
    WHERE l.point IS NOT NULL
)
SELECT rr.code, rr.name, count(n.id) AS count
FROM {note_table} n
JOIN region_of_location rr ON rr.location_id = n.location_id
WHERE n.interacted_at >= %(start)s
  AND n.interacted_at < %(end)s
  {org_clause}
{code_clause}
GROUP BY 1, 2
ORDER BY count DESC, rr.code
"""


def region_counts(
    *,
    kind: str,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    codes: Sequence[str] | None = None,
) -> list[dict[str, Any]]:
    """Interactions per region of ``kind``, including an unassigned bucket.

    ``organization_id`` scopes the count to one org (the report is org-scoped).
    ``codes`` narrows to specific regions, which is the filter half of the
    feature — a caller passes the codes the user selected.
    """
    params: dict[str, Any] = {"kind": kind, "start": start, "end": end}
    org_clause = ""
    if organization_id is not None:
        org_clause = "AND n.organization_id = %(org_id)s"
        params["org_id"] = organization_id

    code_clause = ""
    if codes:
        code_clause = "AND rr.code = ANY(%(codes)s)"
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


def region_codes_for_kind(kind: str) -> list[str]:
    """Every known code for a dimension — lets callers validate filter input."""
    return list(Region.objects.filter(kind=kind).order_by("code").values_list("code", flat=True))


def available_kinds() -> list[str]:
    """Dimensions that actually have boundaries loaded.

    The UI uses this to avoid offering a grouping the database cannot answer.
    """
    return list(Region.objects.order_by("kind").values_list("kind", flat=True).distinct())


def all_kinds() -> list[str]:
    """Every dimension the code supports, whether or not boundaries are loaded."""
    return [choice.value for choice in RegionKind]


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GeoJSON, for the map view.

    ``ST_AsGeoJSON`` is asked for 6 decimal places (~10 cm) and
    ``ST_SimplifyPreserveTopology`` is available to callers that need a cheaper
    payload; simplification is left to the caller so the API stays explicit.
    """
    queryset = Region.objects.filter(kind__in=list(kinds))
    if codes:
        queryset = queryset.filter(code__in=list(codes))

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
