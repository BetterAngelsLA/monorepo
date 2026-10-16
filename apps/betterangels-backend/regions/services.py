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

import zlib
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

#: Namespace for the advisory lock that serialises piece rebuilds: the high 32 bits of the lock
#: key, with a CRC of the dimension in the low 32. Advisory locks are a shared namespace on the
#: database, so the constant keeps this app's rebuild locks from colliding with any other
#: feature's — the ASCII "REPS" is only a mnemonic.
_PIECES_LOCK_NAMESPACE = 0x52455053  # "REPS"


def _pieces_lock_key(kind: str) -> int:
    """The advisory-lock key for one dimension's piece rebuild."""
    return (_PIECES_LOCK_NAMESPACE << 32) | (zlib.crc32(kind.encode()) & 0xFFFFFFFF)


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

    **The rebuild is serialised with a transaction-scoped advisory lock.** The DELETE alone
    does not make it safe against a *concurrent* rebuild: under READ COMMITTED a second run
    cannot see the first run's uncommitted INSERTs, so both DELETEs run first and both
    INSERTs follow, leaving two sets of pieces — the double-count the DELETE exists to
    prevent. ``pg_advisory_xact_lock`` is held until the enclosing transaction commits or
    rolls back, and one lock is taken per dimension touched: a rebuild of a single kind
    conflicts with a rebuild of every kind, and the kinds are locked in sorted order so two
    "all" runs cannot deadlock each other.
    """
    with transaction.atomic(), connection.cursor() as cursor:
        lock_kinds = sorted(Region.objects.values_list("kind", flat=True).distinct()) if kind is None else [kind]
        for lock_kind in lock_kinds:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [_pieces_lock_key(lock_kind)])

        if kind is not None:
            # Scoped through `region_id`, because the piece carries no kind of its own —
            # reading it from `Region` is what keeps a rename from orphaning pieces.
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


# Sentinel code the client sends to ask for interactions that fall in no region. It is not a
# real code: a bucket standing for one comes back with a NULL ``code``.
UNASSIGNED = "__unassigned__"


class RegionScopeError(ValueError):
    """A ``(dimension, codes)`` pair that cannot be interpreted.

    Raised by :func:`resolve_region_scope`. Each surface translates it into its own channel —
    a GraphQL error, an HTTP 400 — but the *contract* is expressed once, here.
    """


def resolve_region_scope(*, dimension: str | None, codes: Sequence[str] | None) -> tuple[str | None, list[str] | None]:
    """The one reading of a ``(dimension, codes)`` pair for a code-scoped read.

    Three shapes, and conflating any two of them is the failure to avoid:

    * ``codes is None`` -> **no restriction**. A ``dimension`` alongside it is refused rather
      than ignored: a caller who named a dimension meant to narrow by it, and silently
      returning every region would answer a question they did not ask.
    * ``[]`` -> **matches nothing**, and it needs no dimension: the answer cannot depend on
      one, so demanding a dimension for it would turn "show me nothing" into an error.
    * a non-empty list -> **requires a dimension**, because a code is not unique across them:
      ``"1"`` is a council district, an SPA and a supervisorial district in this data.

    Returns ``(dimension, codes)`` when a restriction applies — ``codes`` empty means it
    matches nothing — or ``(None, None)`` when there is no restriction at all.
    """
    if codes is None:
        if dimension is not None:
            raise RegionScopeError("dimension requires regionCodes")
        return None, None
    if not codes:
        return dimension, []
    if dimension is None:
        raise RegionScopeError("regionCodes requires a dimension")
    return dimension, list(codes)


@dataclass(frozen=True)
class RegionCodeFilter:
    """``regionCodes`` interpreted for one dimension.

    Four shapes, and conflating any two of them is the failure to avoid:

    * absent                                -> unfiltered, including unassigned and
                                               locationless
    * ``[]``                                -> **matches nothing**, including those buckets
    * ``["__unassigned__"]`` alone          -> only rows matching no region, both causes
    * real codes (with or without sentinel) -> those regions, plus unassigned if asked

    ``keep_unassigned`` is the single answer to "is the unassigned bucket in scope": it is
    both what ``region_counts`` emits on and what the caller reads back.

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
    """The rollup's own reading of ``regionCodes`` — the only caller that has a sentinel.

    ``resolve_region_scope`` is the shared contract for the *code-scoped* surfaces (the pins
    filter and the density tile): a non-empty list needs a dimension, an empty list matches
    nothing, an absent list is no restriction. This function is separate because
    ``interactionsByRegion`` adds ``__unassigned__`` and a "no location recorded" bucket on top,
    which are bucket-selection decisions rather than code parsing. It keeps the same reading of
    ``None`` versus ``[]``.
    """
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
