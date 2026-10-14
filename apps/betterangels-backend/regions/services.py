"""Write operations for the regions app (DEV-2570 / DEV-2604).

Both functions here write derived data, which is why they are services rather than
selectors (read-only) or model methods. ``python.md`` puts business logic in
``services.py`` and keeps models lean; a bulk derived-data write behind a
single-row ``save()`` is exactly the shape that caused trouble before.

They are also the only writers of their respective tables, so the invariants each
depends on are stated in one place.
"""

from __future__ import annotations

from django.db import connection, transaction

from .models import (
    SUBDIVIDE_MAX_VERTICES,
    SUBDIVIDE_VERTEX_THRESHOLD,
    Region,
)

_BUILD_PIECES_SQL = """
INSERT INTO regions_regionpiece (region_id, kind, geom)
SELECT r.id, r.kind,
       -- COALESCE is load-bearing: ST_Subdivide is set-returning and may yield
       -- ZERO rows for a degenerate ring, and with the LEFT JOIN's ON predicate
       -- true that produces a NULL-extended row which the CASE would select --
       -- inserting NULL into a NOT NULL column. Falling back to the parent
       -- boundary keeps the region visible instead of aborting the import.
       ST_Multi(COALESCE(CASE WHEN ST_NPoints(r.geom) > %(threshold)s THEN p.geom END, r.geom))
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

    This is the *write* side of the trade :class:`LocationRegion` describes: the
    spatial work happens here, once, instead of on every report read.

    ``force`` clears the stored answers for the scope first, which is what the
    importer wants after replacing a dimension — the boundaries changed, so every
    previous answer for that kind may now be wrong, and recomputing the still-correct
    ones is cheaper than working out which moved.

    Without ``force`` only *unresolved* locations are processed: a location created
    since the last import has no row at all. A location that resolved to nothing is
    stored as a row with a NULL ``region_id`` precisely so it is not re-resolved
    forever — the NULL is an answer, not a gap.

    Returns the number of assignments written.
    """
    # `.order_by()` is load-bearing. ``Region.Meta.ordering`` is ["kind", "code"], and
    # a default ordering is added to the SELECT list and the ORDER BY — so a bare
    # `.distinct()` de-duplicates on (kind, code) and returns one row PER REGION
    # rather than one per kind. That silently turned a 6-iteration loop into 431
    # iterations: measured, it made one rebuild take 260 s and report 2,155,000
    # assignments (431 x 5,000) for 30,000 rows of actual work. Clearing the ordering
    # is what makes DISTINCT mean what it reads as.
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
                """,
                {"kind": scope},
            )
            written += cursor.rowcount or 0

    return written
