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
from django.db.models import Count, Q, QuerySet

from notes.models import Note

from .models import Region, RegionKind

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
# subquery (`piece.filter(geom__covers=Cast(OuterRef("location__point"), ...))`) and
# it returns identical buckets. An adversarial review could not reproduce the 10-26x
# gap this comment used to claim, and was right to push back: the quoted plan
# (`rows=15 loops=2000`) cannot come from the subdivided pieces table, and the
# "10-26x" header contradicted the table printed beneath it (24x/206x/738x).
#
# What is actually established: both forms resolve per note for realistic data (see
# the note on materialization above), so neither has a structural advantage, and the
# raw form exists because it is clearer about the lateral, the tie-break and the
# unassigned arms than the equivalent nest of subqueries. It is not kept for a
# demonstrated speed win, and nobody should cite one.
#
# Two consequences that are load-bearing:
#
# 1. The lateral returns exactly one ``region_id``. A point can coincide with two
#    pieces of the SAME region (interior or on a seam), so the row it picks must
#    be identified by region, not by piece — otherwise two pieces of one region
#    both match and the LIMIT 1 makes the *name* nondeterministic between them.
# 2. Grouping is by region, so a location matching several pieces of one region
#    still contributes exactly once — the ``LIMIT 1`` is the dedupe.
# The rollup was raw SQL for as long as it had to work out "which region contains this
# point" in a LATERAL join, which Django cannot express. It no longer has to: the
# assignment is stored in ``LocationRegion``, so the read is an ordinary join and is
# expressed in the ORM like the rest of this module.
#
# ``services.ensure_location_regions`` is where the spatial work went. It still needs
# the pieces table (that is what makes it fast), but it runs at import and
# incrementally for new locations, not once per report.


def _code_predicate(codes: Sequence[str] | None, include_unassigned: bool) -> Q:
    """The ``code`` filter, with the unassigned arm written out explicitly.

    ``code = ANY(...)`` evaluates to NULL for an unassigned row, so an unassigned
    bucket cannot be selected by putting a sentinel in the list — it needs its own
    ``IS NULL`` arm. That is why ``codes`` and ``include_unassigned`` are separate
    arguments rather than one list with a marker in it.
    """
    if codes is None:
        return Q()
    if include_unassigned:
        return Q(region_code__in=list(codes)) | Q(region_code__isnull=True)
    return Q(region_code__in=list(codes))


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
    """Interactions per region of ``kind``, plus the unassigned buckets.

    Reads the stored assignment, so a location in no region of this dimension comes
    back with a NULL code rather than being dropped — an inner join to ``Region``
    would silently lose every Beverly Hills address in a city-council report.

    ``codes is not None`` throughout: an explicitly empty list means "no codes" and
    matches nothing, where a truthiness check treats it as absent, drops the
    predicate, and returns the whole dimension.
    """

    # Fill any location this dimension has never resolved before counting. The
    # read joins ``LocationRegion``, so a location created since the last import
    # has no row and would be absent from *every* bucket — including the
    # outside-everything one — making the report under-count with no error and no
    # obvious symptom beyond a total that stops reconciling.
    #
    # Doing it here rather than in each caller is deliberate: the join is what
    # creates the obligation, so every path through this function is covered.
    # Incremental (no ``force``), so it only touches locations with no row for this
    # kind, and a location that resolved to nothing has a NULL row rather than none
    # — so it is not retried on every read.
    from .services import ensure_location_regions

    ensure_location_regions(kind=kind)

    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)

    # The assignment is reached through the FK, so this is an ordinary join.
    rows = notes.filter(location__region_assignments__kind=kind)

    if unassigned_only:
        rows = rows.filter(location__region_assignments__region__isnull=True)
    elif codes is not None:
        codes_q = Q(location__region_assignments__region__code__in=list(codes))
        if include_unassigned:
            # Joining on `region__code` already drops unassigned rows, so the
            # unassigned arm has to come from a separate query rather than an OR.
            codes_q |= Q(location__region_assignments__region__isnull=True)
        rows = rows.filter(codes_q)

    counts = rows.values("location__region_assignments__region__code").annotate(count=Count("id")).order_by()
    buckets = [
        {
            "code": row["location__region_assignments__region__code"],
            "name": "",
            "count": row["count"],
        }
        for row in counts
    ]

    # Names come from the authoritative region row, one query for the handful of
    # codes rather than a join that would widen the GROUP BY.
    named = {code: name for code, name in Region.objects.filter(kind=kind).values_list("code", "name")}
    for bucket in buckets:
        bucket["name"] = named.get(bucket["code"] or "", "")

    return buckets


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

    The UI uses this to avoid offering a grouping the database cannot answer, so a
    kind the GraphQL enum does not know is filtered out rather than allowed to make
    ``regionDimensions`` fail wholesale — one unrecognised row used to break the
    dimension picker for every user.

    ``.order_by()`` is load-bearing for the same reason as in
    ``ensure_location_regions``: the model's default ordering is appended to the
    SELECT, so a bare ``.distinct()`` de-duplicates on ``(kind, code)`` and returns
    one row per region.
    """
    kinds = Region.objects.order_by().values_list("kind", flat=True).distinct()
    return sorted(kind for kind in kinds if kind in RegionKind._value2member_map_)


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GeoJSON, for the map view.

    Serves ``geom_display`` -- the boundary simplified once at import to a tolerance
    below what the map can draw (see ``Region.geom_display``). Serving the
    authoritative ``geom`` instead meant 21 MB across six dimensions, with ZIP alone
    at 9,960 kB of detail rendering at 0.2 px.

    Falls back to ``geom`` for any row where the importer has not set the display
    copy, so a region is never invisible on the map merely because it was created
    outside the importer.

    ``ST_AsGeoJSON`` is asked for 6 decimal places (~10 cm), which is finer than the
    simplification tolerance, so no precision is lost in serialisation.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT kind, code, name, ST_AsGeoJSON(COALESCE(geom_display, geom), 6)::json
            FROM regions_region
            WHERE kind = ANY(%(kinds)s)
              AND (%(codes)s IS NULL OR code = ANY(%(codes)s))
            """,
            # `codes if codes is not None` rather than `codes or None`: an explicit
            # empty list means "no codes", and must match nothing. Collapsing it to
            # NULL removes the predicate entirely and returns the whole dimension —
            # the same bug class as the unassigned sentinel.
            {"kinds": list(kinds), "codes": list(codes) if codes is not None else None},
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


def _region_scope_clause(region_codes: Sequence[str] | None, params: dict[str, Any]) -> str:
    """Restrict to interactions whose location falls in one of ``region_codes``.

    Uses the stored assignment rather than a spatial test, so this is an indexed
    lookup on ``regions_locationregion`` — the whole point of keeping that table.
    ``kind`` is not a parameter: a code alone identifies the region, and the caller
    has already chosen a dimension, so the codes it passes are that dimension's.
    """
    if not region_codes:
        return ""
    params["region_codes"] = list(region_codes)
    return (
        "AND EXISTS (SELECT 1 FROM regions_locationregion lr "
        "JOIN regions_region rr ON rr.id = lr.region_id "
        "WHERE lr.location_id = n.location_id AND rr.code = ANY(%(region_codes)s))"
    )


def interaction_points(
    *,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    limit: int = POINT_LIMIT,
    notes: "QuerySet[Note] | None" = None,
    region_codes: Sequence[str] | None = None,
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
    # `notes` is an already-permission-filtered queryset when the caller has one,
    # which is how the map inherits the note read scope rather than inventing its
    # own. `org_id` remains for callers that only scope by organization.
    # `note_ids` is a bound array parameter, not interpolated text: the scoped
    # queryset decides *which* ids, and the placeholder keeps them out of the SQL.
    notes_clause = ""
    if notes is not None:
        notes_clause = "AND n.id = ANY(%(note_ids)s)"
        params["note_ids"] = list(notes.values_list("id", flat=True))
    region_clause = _region_scope_clause(region_codes, params)
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
          {notes_clause}
          {region_clause}
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
    notes: "QuerySet[Note] | None" = None,
    region_codes: Sequence[str] | None = None,
) -> list[dict[str, Any]]:
    """Interaction counts on a fixed grid, for the density view.

    Aggregated in the database rather than in the browser, so the payload is
    bounded by the grid rather than by the number of interactions. A grid cell with
    no interactions is simply absent; a caller draws only what it receives.
    """
    params: dict[str, Any] = {"start": start, "end": end, "cell": cell_degrees}
    # `note_ids` is a bound array parameter, not interpolated text: the scoped
    # queryset decides *which* ids, and the placeholder keeps them out of the SQL.
    notes_clause = ""
    if notes is not None:
        notes_clause = "AND n.id = ANY(%(note_ids)s)"
        params["note_ids"] = list(notes.values_list("id", flat=True))
    region_clause = _region_scope_clause(region_codes, params)
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
          {notes_clause}
          {region_clause}
        GROUP BY 1, 2
        ORDER BY count DESC, 1, 2
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return [
            {"latitude": float(lat), "longitude": float(lon), "count": int(count)}
            for lat, lon, count in cursor.fetchall()
        ]
