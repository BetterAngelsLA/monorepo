"""Business logic for the regions app (DEV-2570 / DEV-2604).

``python.md`` puts business logic in services rather than in models, signals or GraphQL
resolvers. Two kinds live here:

* the **write** side — subdividing boundaries into the point-lookup geometry, with the
  invariant stated next to it. This is the only derived data the app keeps, and it is
  rebuilt from ``Region.geom`` by the importer rather than maintained incrementally;
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
INSERT INTO regions_regionpiece (region_id, geom, created_at, updated_at)
SELECT r.id,
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
    """(Re)build the point-lookup geometry for one dimension, or all of them.

    Called by ``import_regions`` after it replaces a dimension. Not called from
    ``Region.save``: a bulk derived-data write does not belong behind a single-row save.

    A region with no piece is not invisible — ``regions_regionlookup`` falls back to its
    parent boundary — but the importer writes at least one piece for every region, so that
    arm only fires for a region created outside it.

    DELETE-then-INSERT, and the DELETE is **load-bearing**. The rollup is a plain join
    against the lookup view, so a duplicated piece would join a note twice and double-count
    it. (It also bloats the GiST index.) Rebuilding a dimension is therefore safe to repeat,
    which is what lets the importer replace a dimension and rebuild in one transaction.
    """
    with transaction.atomic(), connection.cursor() as cursor:
        if kind is not None:
            # Scoped through `region_id`: the piece no longer carries a denormalised kind,
            # so a rename or a re-import cannot leave pieces behind under a stale one.
            cursor.execute(
                "DELETE FROM regions_regionpiece WHERE region_id IN "
                "(SELECT id FROM regions_region WHERE kind = %(kind)s)",
                {"kind": kind},
            )
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

    Four shapes, and conflating any two of them is the bug this prevents:

    * absent                                -> unfiltered, including unassigned and
                                               locationless
    * ``[]``                                -> **matches nothing**, including those buckets
    * ``["__unassigned__"]`` alone          -> only rows matching no region, both causes
    * real codes (with or without sentinel) -> those regions, plus unassigned if asked

    There used to be two flags here — ``query_unassigned`` and ``keep_unassigned`` — because
    the stored crosswalk needed an extra ``OR`` arm in its join to reach unassigned rows, and
    that arm was only wanted when real codes were *also* requested. The bucket is computed by
    subtraction now, so there is no arm to gate and the two questions collapsed into one:
    ``keep_unassigned`` is what ``region_counts`` emits on and what the caller reads back.

    ``include_locationless`` is separate again, because "notes with no location" is a third
    bucket with a third reason to be in or out of scope. It is true for an absent list and
    for the sentinel, and false for everything else — an empty list asks for no regions and
    must not smuggle in a bucket a real code filter would have excluded.
    """

    codes: list[str] | None
    unassigned_only: bool
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
        keep_unassigned=region_codes is None or sentinel_requested,
        # True for an absent list **and** for an explicitly empty one, deliberately, and the
        # opposite reading from `keep_unassigned` directly above: a note with no location was
        # never attributable to a region, so a filter asking for no regions still cannot
        # exclude it. `test_an_empty_list_matches_nothing_rather_than_everything` pins the
        # pair. It does make `[]` and `["does-not-exist"]` differ — the second matches nothing
        # at all, this one reports the locationless total — so change it only with that test.
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
        include_unassigned=codes.keep_unassigned,
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
