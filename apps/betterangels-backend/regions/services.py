"""Business logic for the regions app (DEV-2570 / DEV-2604).

``python.md`` puts business logic in services rather than in models, signals or GraphQL
resolvers. Two kinds live here:

* the **write** side of derived data — subdividing boundaries and resolving
  locations to regions, each with an invariant stated next to it;
* the **report queries** — interpreting ``regionCodes`` and assembling a rollup or a
  map payload, which is a decision about what to count rather than a thin passthrough.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import TYPE_CHECKING, Sequence

from django.db import connection, transaction

from .models import (
    SUBDIVIDE_MAX_VERTICES,
    SUBDIVIDE_VERTEX_THRESHOLD,
    Region,
)
from .selectors import (
    interaction_points,
    region_counts,
    region_totals_without_boundaries,
)
from .types import (
    InteractionMapType,
    InteractionPointType,
    RegionCountType,
    UnassignedReason,
)

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from notes.models import Note

# This is raw SQL because Django cannot express it, for two independent reasons — both
# verified against Django 6.1, so a future reviewer does not "clean this up":
#
# 1. `ST_Subdivide` is **set-returning** and appears in `LEFT JOIN LATERAL … AS p(geom)`.
#    Django has no `ST_Subdivide` wrapper (there is no `Subdivide` anywhere in
#    `django/contrib/gis/`), no `LATERAL`, and no set-returning `Func`; `django-cte` is not
#    installed and `django.db.models` exports no `Union` or `CTE` expression.
# 2. `ST_Subdivide` on a MULTIPOLYGON yields **POLYGON**, and the column is
#    `MultiPolygonField`. Measured on the three largest regions:
#    `GeometryType(ST_Subdivide(geom, 256)) = 'POLYGON'` against `'MULTIPOLYGON'` after
#    `ST_Multi` — so the `ST_Multi` wrapper is load-bearing, and Django has no wrapper for
#    `ST_Multi` either.
_BUILD_PIECES_SQL = """
INSERT INTO regions_regionpiece (region_id, kind, geom, created_at, updated_at)
SELECT r.id, r.kind,
       -- COALESCE is load-bearing: ST_Subdivide is set-returning and may yield
       -- ZERO rows for a degenerate ring, and with the LEFT JOIN's ON predicate
       -- true that produces a NULL-extended row which the CASE would select --
       -- inserting NULL into a NOT NULL column. Falling back to the parent
       -- boundary keeps the region visible instead of aborting the import.
       ST_Multi(COALESCE(CASE WHEN ST_NPoints(r.geom) > %(threshold)s THEN p.geom END, r.geom)),
       NOW(),
       NOW()
FROM regions_region r
LEFT JOIN LATERAL ST_Subdivide(r.geom, %(max_vertices)s) AS p(geom)
       ON ST_NPoints(r.geom) > %(threshold)s
WHERE %(kind)s IS NULL OR r.kind = %(kind)s
"""


def build_region_pieces(*, kind: str | None = None) -> int:
    """(Re)build the lookup geometry for one dimension, or all of them.

    Called by ``import_regions`` after it replaces a dimension. Not called from
    ``Region.save``: a bulk derived-data write does not belong behind a single-row
    save. The assignment builder falls back to the full boundary for a region with
    no pieces, so a region created outside the importer resolves slower rather than
    being invisible.

    DELETE-then-INSERT, not a bare INSERT. Calling an INSERT twice accumulates
    duplicate pieces, and because the lookup dedupes on region the counts stay
    correct — the damage is a bloating GiST index and a longer per-location sort,
    with nothing to show for it.
    """
    with transaction.atomic(), connection.cursor() as cursor:
        if kind is not None:
            cursor.execute("DELETE FROM regions_regionpiece WHERE kind = %(kind)s", {"kind": kind})
        else:
            cursor.execute("DELETE FROM regions_regionpiece")
        cursor.execute(
            _BUILD_PIECES_SQL,
            {
                "kind": kind,
                "threshold": SUBDIVIDE_VERTEX_THRESHOLD,
                "max_vertices": SUBDIVIDE_MAX_VERTICES,
            },
        )
        return int(cursor.rowcount or 0)


def ensure_location_regions(*, kind: str | None = None, force: bool = False) -> int:
    """Resolve locations to regions and store the answer.

    The write side of the trade :class:`LocationRegion` describes: spatial work once, then an
    ordinary indexed join.

    **Incremental, and that is the point.** Without ``force`` the scan is guarded by
    ``NOT EXISTS`` per kind, so only locations with no assignment are considered — cost tracks
    *new* locations, not table size. Measured on 20k notes over 4,000 locations: ~450 ms once,
    then a no-op. That is why the read path can call it and forget it, with no schedule.

    A location that resolved to nothing is stored with a NULL ``region_id`` so it is not
    re-resolved forever — the NULL is an answer, not a gap.

    ``force`` clears the scope first, which is what the importer wants after replacing a
    dimension: the boundaries moved, so every prior answer for that kind may be wrong.

    Returns the number of assignments written.
    """
    # `.order_by()` is load-bearing: `Region.Meta.ordering` is added to the SELECT
    # list, so a bare `.distinct()` de-duplicates on (kind, code) and returns one row
    # per region instead of one per kind — 431 scopes rather than 6, measured at 260 s
    # for a rebuild that should take seconds.
    scopes = [kind] if kind else list(Region.objects.order_by().values_list("kind", flat=True).distinct())
    written = 0

    for scope in scopes:
        with transaction.atomic(), connection.cursor() as cursor:
            if force:
                cursor.execute("DELETE FROM regions_locationregion WHERE kind = %s", [scope])
            else:
                # Nothing to resolve if this dimension has no regions loaded.
                cursor.execute("SELECT 1 FROM regions_region WHERE kind = %s LIMIT 1", [scope])
                if cursor.fetchone() is None:
                    continue
            # Raw SQL for the same reason as `_BUILD_PIECES_SQL`, plus a measured one.
            #
            # `ST_Covers(src.geom, l.point::geometry)` — **the cast is a PostGIS
            # overload-resolution requirement, not a micro-optimisation.** `Location.point`
            # is `geography=True` (common/models.py), `geography → geometry` is an explicit-only
            # cast, and `geometry → geography` is implicit. So a mixed call silently resolves
            # to the spheroidal geography overload, and `ST_X(geography)` does not exist at
            # all. Do not remove the casts.
            #
            # The ORM form measures ~650x slower on real data (3,000 locations / 5,685
            # pieces): `ST_Covers(p.geom, l.point::geometry)` gives
            # `Index Scan using regions_regionpiece_geom, 0.30 ms`, while the ORM
            # `geom__covers` orientation gives `Filter: st_covers((geom)::geography, …)`
            # with 2,840 rows removed and 196.5 ms. The ORM also cannot carry the
            # `UNION ALL` piece-less fallback below — `QuerySet.union()` requires matching
            # `values()`, and the two arms select different columns.
            cursor.execute(
                """
                INSERT INTO regions_locationregion (location_id, kind, region_id, created_at, updated_at)
                SELECT l.id,
                       %(kind)s,
                       (
                         -- Prefers the subdivided pieces, because that is what makes
                         -- this fast on a real layer; falls back to the whole boundary
                         -- when a region has no pieces (a region created directly by a
                         -- test, the admin, or a script). Without the fallback the
                         -- caller would silently get NULL — "in no region" — for a
                         -- region that plainly contains the point.
                         SELECT src.region_id
                         FROM (
                           SELECT p.region_id, p.geom
                           FROM regions_regionpiece p
                           WHERE p.kind = %(kind)s
                           UNION ALL
                           SELECT rr.id, rr.geom
                           FROM regions_region rr
                           WHERE rr.kind = %(kind)s
                             AND NOT EXISTS (SELECT 1 FROM regions_regionpiece q WHERE q.region_id = rr.id)
                         ) src
                         JOIN regions_region rr ON rr.id = src.region_id
                         WHERE ST_Covers(src.geom, l.point::geometry)
                         -- Deterministic on a shared boundary. Ordered by `code`
                         -- rather than id: ids follow creation order, so ordering on
                         -- them re-attributes boundary coordinates whenever a
                         -- dimension is re-imported.
                         ORDER BY rr.code, rr.id
                         -- LIMIT 1 is load-bearing, not tidiness. Without it the
                         -- subquery returns one row per overlapping piece instead of
                         -- the single winning region: measured 2,843 rows per location
                         -- against the city layer, which both inflated `rowcount` to
                         -- 431x the truth and made the whole assignment take minutes.
                         LIMIT 1
                       ),
                       NOW(),
                       NOW()
                FROM common_location l
                WHERE NOT EXISTS (
                    SELECT 1 FROM regions_locationregion lr
                    WHERE lr.location_id = l.id AND lr.kind = %(kind)s
                )
                -- Belt and braces with the NOT EXISTS above: `unique_location_kind_assignment`
                -- is the real guarantee, and this makes a concurrent or repeated fill a
                -- no-op instead of an IntegrityError. This function is reachable from a
                -- management command and from the importer, both of which can overlap with
                -- each other or with a re-run.
                ON CONFLICT ON CONSTRAINT unique_location_kind_assignment DO NOTHING
                """,
                {"kind": scope},
            )
            written += cursor.rowcount or 0

    return written


# ---------------------------------------------------------------------------
# Report queries
#
# The resolvers in ``schema.py`` parse inputs, check permissions and delegate here.
# What lives below is the part that decides *what* to count, which is business logic
# and therefore not the API layer's job (``python.md``).
# ---------------------------------------------------------------------------


# Sentinel code the client sends to ask for interactions that fall in no region. It is
# not a real code: a location's `code` is NULL when it resolved to nothing.
UNASSIGNED = "__unassigned__"


@dataclass(frozen=True)
class RegionCodeFilter:
    """``regionCodes`` interpreted for one dimension.

    Three shapes, and conflating the first two is the bug this prevents:

    * absent                                -> unfiltered
    * ``["__unassigned__"]`` alone          -> only rows matching no region
    * real codes (with or without sentinel) -> those regions, plus unassigned if asked

    ``query_unassigned`` and ``keep_unassigned`` are separate on purpose: the query needs the
    unassigned arm only when real codes are *also* requested, while the result filter keeps
    unassigned rows whenever the rollup is unfiltered or the sentinel was sent. One flag for
    both silently drops every unassigned bucket from an unfiltered rollup.
    """

    codes: list[str] | None
    unassigned_only: bool
    query_unassigned: bool
    keep_unassigned: bool
    include_locationless: bool


def parse_region_code_filter(region_codes: Sequence[str] | None) -> RegionCodeFilter:
    requested = list(region_codes or [])
    sentinel_requested = UNASSIGNED in requested
    wanted = [code for code in requested if code != UNASSIGNED]
    return RegionCodeFilter(
        # `is not None`, not `or None`: an explicit empty list means "no codes" and
        # must match nothing.
        codes=wanted if region_codes is not None else None,
        unassigned_only=sentinel_requested and not wanted,
        query_unassigned=sentinel_requested and bool(wanted),
        keep_unassigned=region_codes is None or sentinel_requested,
        include_locationless=(region_codes is None or sentinel_requested) or (not sentinel_requested and not wanted),
    )


def region_rollup(
    *,
    kind: str | None,
    start: datetime,
    end: datetime,
    organization_id: int,
    region_codes: Sequence[str] | None = None,
) -> list[RegionCountType]:
    """Interaction counts per region, ready to return from the resolver.

    Includes a "no location recorded" row when in scope, because those notes are
    invisible to a spatial rollup and would otherwise make the report total disagree
    with the KPI row above it.
    """
    codes = parse_region_code_filter(region_codes)
    rows = region_counts(
        kind=kind,
        start=start,
        end=end,
        organization_id=organization_id,
        codes=codes.codes,
        unassigned_only=codes.unassigned_only,
        include_unassigned=codes.query_unassigned,
    )

    buckets = [
        RegionCountType(
            # Empty when the rollup is scoped to one dimension — the request already
            # implies it, so repeating it on every row is noise. Populated when the
            # rollup spans all of them, where it is what disambiguates a code.
            kind="" if kind is not None else (row["kind"] or ""),
            code=row["code"] or "",
            name=row["name"] or "",
            count=row["count"],
            is_unassigned=row["code"] is None,
            unassigned_reason=(UnassignedReason.OUTSIDE_ALL_REGIONS if row["code"] is None else None),
        )
        for row in rows
        if row["code"] is not None or codes.keep_unassigned
    ]

    if codes.include_locationless:
        locationless = region_totals_without_boundaries(start=start, end=end, organization_id=organization_id)
        if locationless:
            buckets.append(
                RegionCountType(
                    kind="",
                    code="",
                    name="No location recorded",
                    count=locationless,
                    is_unassigned=True,
                    unassigned_reason=UnassignedReason.NO_LOCATION,
                )
            )

    return buckets


def interaction_map_data(
    *,
    start: datetime,
    end: datetime,
    organization_id: int,
    notes: "QuerySet[Note]",
    limit: int,
) -> InteractionMapType:
    """The interaction points for the given scope, as map pins.

    ``notes`` arrives already org-confined **and** already permission-filtered **and**
    already region-scoped — the resolver applies all three before calling this, because
    each is a rule about *what the caller may see* rather than about what to count, and
    re-applying any of them here would be a second copy that could drift from the first.

    ``organization_id`` is passed through to ``interaction_points`` as well, which applies
    it as its own predicate. That is deliberate duplication, not an oversight: the note
    permission filter has no org awareness, so the SQL clause is what actually confines
    the result, and it should not depend on the caller's queryset being correct.
    """
    points, truncated = interaction_points(
        start=start, end=end, organization_id=organization_id, limit=limit, notes=notes
    )
    return InteractionMapType(
        points=[InteractionPointType(**row) for row in points],
        truncated=truncated,
    )
