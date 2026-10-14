"""Read-only rollups over the stored region assignments (DEV-2570 / DEV-2604).

The rollup is an ordinary indexed ORM join against ``LocationRegion``. The spatial
work — deciding which region covers a point — happens once on the write side, in
``services``, not on every read.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Sequence

from django.db import connection
from django.db.models import Count, Exists, OuterRef, Q, QuerySet

from notes.models import Note

from .models import LocationRegion, Region, RegionKind


def region_counts(
    *,
    kind: str | None,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    codes: Sequence[str] | None = None,
    unassigned_only: bool = False,
    include_unassigned: bool = False,
) -> list[dict[str, Any]]:
    """Interactions per region, plus the unassigned buckets.

    ``kind`` may be ``None``, which counts **every dimension at once**. Codes are not
    unique across dimensions — ``"1"`` is a council district, an SPA and a supervisorial
    district in this data — so the ungrouped rollup groups by ``(kind, code)`` and
    returns the kind on every bucket. Grouping on the code alone would merge three
    unrelated regions into one row.

    Reads the stored assignment, so a location in no region of this dimension comes
    back with a NULL code rather than being dropped — an inner join to ``Region``
    would silently lose every Beverly Hills address in a city-council report.

    ``codes is not None`` throughout: an explicitly empty list means "no codes" and
    matches nothing, where a truthiness check treats it as absent, drops the
    predicate, and returns the whole dimension.
    """

    # Fill unresolved locations first. The read joins ``LocationRegion``, so a
    # location created since the last import would be absent from every bucket,
    # including unassigned, and the report would under-count with no error.
    # Incremental, so a NULL assignment (resolved, in no region) is not retried.
    from .services import ensure_location_regions

    ensure_location_regions(kind=kind)

    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)

    assignments = "location__region_assignments"
    rows = notes.filter(**{f"{assignments}__isnull": False})
    if kind is not None:
        rows = rows.filter(**{f"{assignments}__kind": kind})

    if unassigned_only:
        rows = rows.filter(**{f"{assignments}__region__isnull": True})
    elif codes is not None:
        codes_q = Q(**{f"{assignments}__region__code__in": list(codes)})
        if include_unassigned:
            # Joining on `region__code` already drops unassigned rows, so the
            # unassigned arm has to come from a separate query rather than an OR.
            codes_q |= Q(**{f"{assignments}__region__isnull": True})
        rows = rows.filter(codes_q)

    # Grouped by kind as well as code: without it, SPA 1, council district 1 and
    # supervisorial district 1 collapse into a single bucket.
    counts = (
        rows.values(f"{assignments}__kind", f"{assignments}__region__code")
        .annotate(count=Count("id"))
        .order_by()
    )
    buckets = [
        {
            "kind": row[f"{assignments}__kind"],
            "code": row[f"{assignments}__region__code"],
            "name": "",
            "count": row["count"],
        }
        for row in counts
    ]

    # Names come from the authoritative region row, one query rather than a join that
    # would widen the GROUP BY. Keyed by (kind, code), since a code alone is ambiguous.
    regions = Region.objects.all() if kind is None else Region.objects.filter(kind=kind)
    named = {(r_kind, r_code): r_name for r_kind, r_code, r_name in regions.values_list("kind", "code", "name")}
    for bucket in buckets:
        bucket["name"] = named.get((bucket["kind"], bucket["code"] or ""), "")

    return buckets


def region_totals_without_boundaries(*, start: datetime, end: datetime, organization_id: int | None = None) -> int:
    """Interactions in range that have no location at all.

    Separate from ``region_counts``, which can only classify notes that carry a point:
    a note with no location would otherwise vanish from every bucket and make the
    report totals disagree with the KPI row.
    """
    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end, location__isnull=True)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)
    return notes.count()


def available_kinds() -> list[str]:
    """Dimensions that actually have boundaries loaded, for the UI's picker.

    A kind the GraphQL enum does not know is filtered out rather than allowed to make
    ``regionDimensions`` fail wholesale.

    ``.order_by()`` is load-bearing: the model's default ordering is appended to the
    SELECT, so a bare ``.distinct()`` de-duplicates on ``(kind, code)`` and returns one
    row per region. See ``services.ensure_location_regions``.
    """
    kinds = Region.objects.order_by().values_list("kind", flat=True).distinct()
    return sorted(kind for kind in kinds if kind in RegionKind._value2member_map_)


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GeoJSON, for the map view.

    Serves ``geom_display`` (see ``Region.geom_display``), falling back to ``geom``
    where the importer has not set it, so a region is never invisible on the map.

    6 decimal places is ~10 cm — finer than the simplification tolerance, so nothing
    is lost in serialisation.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT kind, code, name, ST_AsGeoJSON(COALESCE(geom_display, geom), 6)::json
            FROM regions_region
            WHERE kind = ANY(%(kinds)s)
              AND (%(codes)s IS NULL OR code = ANY(%(codes)s))
            """,
            # `is not None`, not `or None`: an explicit empty list means "no codes"
            # and must match nothing, where collapsing to NULL drops the predicate and
            # returns the whole dimension.
            {"kinds": list(kinds), "codes": list(codes) if codes is not None else None},
        )
        rows = cursor.fetchall()

    return [{"kind": row[0], "code": row[1], "name": row[2] or "", "geometry": row[3]} for row in rows]


# Cap on points returned in one response. Past a few thousand the extra rows change
# nothing visible but do change the payload. Truncation is reported rather than
# silent: a partial map that looks complete is worse than a slow one.
POINT_LIMIT = 10_000
POINT_LIMIT_MAX = 50_000

# Density grid cell size, in degrees. 0.01 deg is ~1.1 km by ~0.9 km at Los Angeles —
# the granularity the density view is for.
DENSITY_GRID_DEGREES = 0.01


def interaction_points(
    *,
    start: datetime,
    end: datetime,
    organization_id: int | None = None,
    limit: int = POINT_LIMIT,
    notes: "QuerySet[Note] | None" = None,
) -> tuple[list[dict[str, Any]], bool]:
    """Individual interaction locations, for map pins.

    **Coordinates and a timestamp, and nothing else.** No client name, client id,
    note id, address, or note content: this answers "where were our interactions"
    without answering "who". `LocationType.point` is already readable wherever a
    location is, so this is not a new class of disclosure, but it stays minimal.

    Returns ``(rows, truncated)``. Asking for one row past the cap is what detects
    truncation, so the caller can say the map is a subset rather than let it read as
    complete.
    """
    limit = max(1, min(limit, POINT_LIMIT_MAX))
    params: dict[str, Any] = {"start": start, "end": end, "limit": limit + 1}
    # `notes` is already permission-filtered by the caller, which is how the map
    # inherits the note read scope rather than inventing its own.
    notes_clause = ""
    if notes is not None:
        notes_clause = "AND n.id = ANY(%(note_ids)s)"
        params["note_ids"] = list(notes.values_list("id", flat=True))
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
) -> list[dict[str, Any]]:
    """Interaction counts on a fixed grid, for the density view.

    Aggregated in the database rather than in the browser, so the payload is
    bounded by the grid rather than by the number of interactions. A grid cell with
    no interactions is simply absent; a caller draws only what it receives.
    """
    params: dict[str, Any] = {"start": start, "end": end, "cell": cell_degrees}
    # Bound array, not interpolated: `note_ids` never reaches the SQL text.
    notes_clause = ""
    if notes is not None:
        notes_clause = "AND n.id = ANY(%(note_ids)s)"
        params["note_ids"] = list(notes.values_list("id", flat=True))
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
        GROUP BY 1, 2
        ORDER BY count DESC, 1, 2
    """
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return [
            {"latitude": float(lat), "longitude": float(lon), "count": int(count)}
            for lat, lon, count in cursor.fetchall()
        ]


def scope_notes_to_regions(notes: QuerySet[Note], *, kind: str, codes: Sequence[str]) -> QuerySet[Note]:
    """Narrow a note queryset to those whose location falls in one of ``codes``.

    ``Exists`` rather than a reverse-relation join: a join yields one row per matching
    assignment and would need ``.distinct()``, which a semi-join cannot need.

    ``kind`` is required because codes are **not** unique across dimensions — in this
    data ``"1"`` is simultaneously a council district, an SPA and a supervisorial
    district — so filtering on the code alone returns up to three dimensions' worth of
    interactions, labelled as the one the caller asked for.
    """
    return notes.filter(
        Exists(
            LocationRegion.objects.filter(
                location=OuterRef("location_id"),
                kind=kind,
                region__code__in=list(codes),
            )
        )
    )
