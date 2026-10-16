"""Read-only rollups over the authoritative boundaries (DEV-2570 / DEV-2604).

The rollup is a **live spatial join**: deciding which region covers a point happens on every
read. That is affordable because the join is written in the one direction PostGIS can index —
the subdivided boundaries drive, and the GiST index on ``Location.point_geom`` is probed.

Nothing derived is stored, so a read writes nothing and there is nothing to keep fresh.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Sequence

from django.db import connection
from django.db.models import FloatField, Func, QuerySet
from django.db.models.expressions import RawSQL

from common.models import Location
from notes.models import Note

from .models import REGION_LOOKUP_VIEW, Region, RegionKind

#: Table names interpolated into the raw SQL below. Taken from the models rather than
#: written out, so a `db_table` override cannot leave the query pointing somewhere else.
_NOTE_TABLE = Note._meta.db_table
_LOCATION_TABLE = Location._meta.db_table
_REGION_TABLE = Region._meta.db_table

#: The point→region predicate, **boundaries-first**: the selected regions' lookup geometry
#: drives and the GiST index on ``Location.point_geom`` is probed.
#:
#: ``regions_regionlookup`` carries both arms — a region's subdivided pieces, plus the parent
#: boundary of a region that has none — so this fragment is the single definition of "this
#: point is in this region" that the rollup, the map's ``regionCodes`` filter and the density
#: tile read. The statements around it differ in what they project and group by; the predicate
#: they must agree on is here, once.
REGION_JOIN_SQL = f"""
    FROM {REGION_LOOKUP_VIEW} lu
    JOIN {_REGION_TABLE} rr ON rr.id = lu.region_id
    JOIN {_LOCATION_TABLE} l ON ST_Covers(lu.geom, l.point_geom)
"""

#: The location ids a ``(kind, codes)`` selection covers. Returns location ids, one row each.
#:
#: ``DISTINCT`` because a location may fall in more than one piece of the same region, which
#: would otherwise join that note once per piece and double-count it.
#:
#: The caller binds ``(kind, codes)`` positionally. Requests are org-confined before this
#: predicate sees them, so it narrows a scoped queryset rather than confining one.
REGION_LOCATIONS_SQL = f"""
    SELECT DISTINCT l.id
    {REGION_JOIN_SQL}
    WHERE rr.kind = %s AND rr.code = ANY(%s)
"""


def org_notes_in_range(
    *,
    organization_id: int | None,
    start: datetime,
    end: datetime,
    has_location: bool | None = None,
) -> QuerySet[Note]:
    """The organization's notes in a half-open instant range — the note-queryset reads' start.

    One home for the org and window predicate on every read that builds a **note queryset**:
    ``interactionMap``, the density tile, and the two rollup figures that count located and
    locationless notes. That order is load-bearing — ``filter_for_user`` is binary and has no
    organization notion, so confinement cannot come from it and has to be applied before it.

    ``has_location`` narrows to notes with a location (``True``) or without one (``False``);
    ``None`` leaves the queryset unnarrowed. The rollup subtracts one from the other, so both
    sides are taken from this one filter rather than two that could drift apart and silently
    stop reconciling.

    ``organization_id`` is optional because the ungrouped report has no organization scope. The
    predicate is then omitted rather than spelled as a null check, which would defeat the
    planner's use of the column.
    """
    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)
    if has_location is not None:
        notes = notes.filter(location__isnull=not has_location)
    return notes


def _rollup_sql(*, organization_id: int | None) -> str:
    """The rollup statement, with the org predicate only when there is one.

    Paths with no organization scope are the ungrouped report, and they must **not** be
    spelled as a `%(organization_id)s IS NULL OR …` — that defeats the planner's ability
    to use the column, and it puts the confinement decision inside a SQL expression
    rather than at the call site.

    ``GROUPING SETS`` returns the per-``(kind, code)`` rows **and** a per-``kind`` row (with
    ``code`` NULL), in one pass. The per-kind row is the count of *distinct* located notes
    covered by at least one region of that dimension, which is what makes the unassigned
    subtraction coherent when same-kind boundaries overlap: the per-bucket counts may sum to
    more than that figure, but it can never exceed the number of located notes.
    """
    org = "AND n.organization_id = %(organization_id)s" if organization_id is not None else ""
    return f"""
        SELECT rr.kind AS kind, rr.code AS code, count(DISTINCT n.id) AS count
        {REGION_JOIN_SQL}
        JOIN {_NOTE_TABLE} n ON n.location_id = l.id
        WHERE n.interacted_at >= %(start)s
          AND n.interacted_at < %(end)s
          {org}
        GROUP BY GROUPING SETS ((rr.kind, rr.code), (rr.kind))
    """


def _assigned_counts(
    *, start: datetime, end: datetime, organization_id: int | None
) -> tuple[dict[str, dict[str, int]], dict[str, int]]:
    """Interactions per ``(kind, code)`` that a boundary actually contains, plus per-kind totals.

    Returns ``(counts, totals)``: ``counts[kind][code]`` is the number of distinct notes whose
    point is covered by that region, and ``totals[kind]`` is the number of distinct notes
    covered by **any** region of that dimension.

    ``count(DISTINCT n.id)`` throughout. A note's location can fall in more than one piece of
    the same region — and, on the shipped layers, in two *overlapping regions of the same
    kind* — so a plain ``count(n.id)`` would report one interaction as several. The per-bucket
    counts can still exceed ``totals`` when regions overlap, because the same note genuinely
    belongs to both polygons; that is why the unassigned figure is derived from ``totals`` and
    not from the sum of the buckets.

    **The boundaries drive and the points are probed.** That is the whole trick: the scan is
    over the lookup polygons and the GiST index on ``point_geom`` is probed for each, which
    is the direction PostGIS can index — the plan shows
    ``Index Cond: (point_geom @ r.geom)``. Reversing it — a ``LATERAL`` keyed on the
    interaction, asking "which region is this point in" — puts the points on the inner side
    and probes them once per interaction instead.

    Measured on the real LA layers (431 regions, 5,685 pieces, 4,000 locations), all six
    dimensions at once: **~85 ms** for the 20,000-interaction window and **~48 ms** for a
    2,461-interaction one. The spatial cost tracks *distinct locations* rather than
    interactions, so the total grows sublinearly — 1.8× the time for 8× the notes — and the
    per-interaction cost falls as the window grows.

    **The view is what keeps the plan in this direction.** Pointed straight at
    ``regions_regionpiece`` the planner flips the join round on a selective window and drives
    from the notes instead — 206 ms against 39 ms for the same result. The view presents it
    one relation to drive from, which is what it needs to pick the indexed side.

    ``ST_Covers`` alone carries the index condition, so there is no explicit ``&&``. Adding
    one measures *slower* (342 ms against 70 ms): the redundant predicate constrains the
    join order the planner would otherwise pick for itself.

    No ``kind`` predicate. One pass over every dimension's pieces costs more than one
    dimension alone (85 ms against 46 ms for ``zip``), which is the price of one query shape
    serving both the grouped and the ungrouped view; the single-dimension rollup filters the
    same result in Python rather than paying for a second shape.

    Grouped by kind **and** code: without the kind, SPA 1, council district 1 and
    supervisorial district 1 collapse into one bucket.

    ``start``/``end``/``organization_id`` are bound into the statement as parameters; they are
    not applied in Python. They stay in the signature because the statement needs them.
    """
    params: dict[str, Any] = {"start": start, "end": end}
    if organization_id is not None:
        params["organization_id"] = organization_id

    with connection.cursor() as cursor:
        cursor.execute(_rollup_sql(organization_id=organization_id), params)
        rows = cursor.fetchall()

    counts: dict[str, dict[str, int]] = {}
    totals: dict[str, int] = {}
    for kind, code, count in rows:
        # `GROUPING SETS` marks the per-kind row with a NULL code; `Region.code` is NOT NULL,
        # so no per-region row can be mistaken for one.
        if code is None:
            totals[kind] = count
        else:
            counts.setdefault(kind, {})[code] = count
    return counts, totals


def _notes_with_a_location(*, start: datetime, end: datetime, organization_id: int | None) -> int:
    """Interactions in range that carry a point, whether or not a boundary contains it.

    The minuend of the unassigned subtraction. It is paired with ``_assigned_counts``'
    per-kind *distinct* total, not with the sum of the per-region buckets: a note whose point
    falls in two overlapping same-kind regions belongs to both buckets but subtracts once, so
    ``unassigned = this - totals[kind]`` stays coherent and can never go negative.
    """
    return org_notes_in_range(organization_id=organization_id, start=start, end=end, has_location=True).count()


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

    A location in no region of the dimension comes back as a bucket with ``code is None``
    rather than being dropped — an inner join to ``Region`` would silently lose every
    Beverly Hills address in a city-council report. That bucket is *computed*, not stored:
    see ``_notes_with_a_location``.

    **The invariant the counts hold.** Every count is of *distinct notes*. A note is counted
    in a named bucket when its point is covered by that region, so when two regions of the
    same kind overlap the same note is counted in both — it really is inside both — and the
    named buckets can sum to more than the located total. What never exceeds the located total
    is ``totals``: the unassigned bucket is ``located − (distinct notes covered by any region
    of this kind)``, which is well defined and non-negative regardless of overlap. To put it
    another way, the layer is assumed to *cover* points, not to partition them.

    ``codes is not None`` throughout: an explicitly empty list means "no codes" and
    matches nothing, where a truthiness check treats it as absent, drops the predicate,
    and returns the whole dimension.

    Narrowing by code happens here rather than in SQL. The rollup returns at most one row
    per region — 431 for the whole fixture — so pushing a code list into the query would
    buy nothing and cost a second statement shape to keep in step with this one.

    Only dimensions with boundaries loaded are reported. A dimension with none has no
    regions to bucket, and reporting every interaction as "unassigned" for it would be a
    claim about coverage that has not been loaded.
    """
    loaded = set(Region.objects.values_list("kind", flat=True).distinct())
    scopes = sorted(loaded) if kind is None else ([kind] if kind in loaded else [])
    if not scopes:
        return []

    assigned, totals = _assigned_counts(start=start, end=end, organization_id=organization_id)
    codes_set = None if codes is None else set(codes)

    buckets: list[dict[str, Any]] = []
    if not unassigned_only:
        for scope in scopes:
            for code, count in assigned.get(scope, {}).items():
                if codes_set is not None and code not in codes_set:
                    continue
                buckets.append({"kind": scope, "code": code, "name": "", "count": count})

    # `codes is None` means "no restriction", which is the one case that puts the unassigned
    # bucket in scope without the caller asking for it by name.
    if unassigned_only or include_unassigned or codes is None:
        with_location = _notes_with_a_location(start=start, end=end, organization_id=organization_id)
        for scope in scopes:
            # `totals` is the count of **distinct** located notes covered by at least one
            # region of this dimension, so this subtraction is coherent even when same-kind
            # boundaries overlap: a note counted in two buckets still subtracts once, and the
            # result cannot go negative. Deriving it from the sum of the buckets instead would
            # let an overlap swallow the whole unassigned count, which is the shape of bug
            # that hides an uncovered neighbourhood.
            unassigned = with_location - totals.get(scope, 0)
            if unassigned < 0:
                # Unreachable: `totals` is a subset of `with_location` under identical
                # org/date predicates. Loud rather than dropped, so a future change to either
                # query surfaces here instead of reporting a nonsensical bucket.
                raise ValueError(
                    f"{scope}: {totals.get(scope, 0)} located notes attributed to a region, "
                    f"but only {with_location} located note(s) in range"
                )
            if unassigned > 0:
                buckets.append({"kind": scope, "code": None, "name": "", "count": unassigned})

    # Names come from the authoritative region row, one query rather than a join that would
    # widen the GROUP BY. Keyed by (kind, code), since a code alone is ambiguous.
    kinds_present = sorted({bucket["kind"] for bucket in buckets if bucket["kind"]})
    if kinds_present:
        named = {
            (region_kind, region_code): region_name
            for region_kind, region_code, region_name in Region.objects.filter(kind__in=kinds_present).values_list(
                "kind", "code", "name"
            )
        }
        for bucket in buckets:
            bucket["name"] = named.get((bucket["kind"], bucket["code"] or ""), "")

    # Sorted so the client gets a stable order: by dimension, named regions in code order,
    # unassigned last. Without this the order is whatever the GROUP BY happened to produce.
    buckets.sort(key=lambda bucket: (bucket["kind"], bucket["code"] is None, bucket["code"] or ""))
    return buckets


def region_totals_without_boundaries(*, start: datetime, end: datetime, organization_id: int | None = None) -> int:
    """Interactions in range that have no location at all.

    Separate from ``region_counts``, which can only classify notes that carry a point:
    a note with no location would otherwise vanish from every bucket and make the
    report totals disagree with the KPI row.
    """
    return org_notes_in_range(organization_id=organization_id, start=start, end=end, has_location=False).count()


def available_kinds() -> list[str]:
    """Dimensions that actually have boundaries loaded, for the UI's picker.

    The ``kind__in`` filter runs in the database, so a kind the GraphQL enum does not know is
    excluded rather than making ``regionDimensions`` fail wholesale.

    ``Region`` carries no ``Meta.ordering``, so this de-duplicates on ``kind`` alone. A
    model-level ordering would be appended to the SELECT and widen the ``DISTINCT`` to
    ``(kind, code)``.
    """
    known = list(RegionKind.values)
    kinds = Region.objects.filter(kind__in=known).values_list("kind", flat=True).distinct()
    return sorted(kinds)


# Cap on points returned in one response. Past a few thousand the extra rows change
# nothing visible but do change the payload. Truncation is reported rather than
# silent: a partial map that looks complete is worse than a slow one.
POINT_LIMIT = 10_000
POINT_LIMIT_MAX = 50_000


def interaction_points(
    *,
    start: datetime,
    end: datetime,
    organization_id: int,
    limit: int = POINT_LIMIT,
    notes: "QuerySet[Note] | None" = None,
) -> tuple[list[dict[str, Any]], bool]:
    """Individual interaction locations, for map pins.

    Coordinates and a timestamp only — no client, note, or address field. This answers "where
    were our interactions" without answering "who".

    ``organization_id`` is required rather than defaulting to ``None``: a default of "no org
    filter" makes confinement a property of the call site that remembered to pass it.

    ``notes`` narrows further and is permission-filtered by the caller. It is **not** the org
    confinement — ``filter_for_user`` has no org notion, so without the clause below a
    cross-org queryset would stay cross-org.

    Returns ``(rows, truncated)``; one row past the cap is what detects truncation.
    """
    limit = max(1, min(limit, POINT_LIMIT_MAX))

    # Two independent controls, both applied, neither trusted to imply the other:
    # `organization_id` is the org scope, `notes` carries the note read scope.
    #
    # `notes` is folded in as a **subquery**, not as a materialised list of ids.
    # `__in=<queryset>` lets Postgres plan it as a semi-join against the query the caller
    # already built; reading the ids out first would cost a round trip, ship an unbounded
    # bind parameter, and answer the same question a second time.
    queryset = org_notes_in_range(organization_id=organization_id, start=start, end=end, has_location=True)
    if notes is not None:
        queryset = queryset.filter(pk__in=notes.values("pk"))

    # `ST_X`/`ST_Y` are called through `Func` because Django ships **no** wrapper for either —
    # its GeoDjango function set is Area, AsGeoJSON, Centroid, Distance, Envelope, Length,
    # Transform, Union and similar, and the only `ST_X`/`ST_Y` in the codebase is
    # Oracle-specific.
    #
    # They read the generated `point_geom`, not `point`, and that is load-bearing rather
    # than tidiness: `point` is `geography=True` (common/models.py) and PostGIS defines
    # `ST_X`/`ST_Y` only for geometry, so reading it directly fails on the live database
    # with `function st_x(geography) does not exist` unless every call site remembers to
    # cast. The generated column is already geometry, so the cast happens once per row
    # written instead of once per row read.
    rows = (
        queryset.annotate(
            latitude=Func("location__point_geom", function="ST_Y", output_field=FloatField()),
            longitude=Func("location__point_geom", function="ST_X", output_field=FloatField()),
        )
        .order_by("-interacted_at")
        .values("latitude", "longitude", "interacted_at")[: limit + 1]
    )

    # One row past the cap is what detects truncation. `.values()` yields a TypedDict, and
    # the function's contract is plain dicts (`InteractionPointType(**row)` unpacks them),
    # so the rows are materialised explicitly rather than relying on that being structural.
    fetched: list[dict[str, Any]] = [
        {"latitude": row["latitude"], "longitude": row["longitude"], "interacted_at": row["interacted_at"]}
        for row in rows
    ]
    truncated = len(fetched) > limit
    return fetched[:limit], truncated


def scope_notes_to_regions(notes: QuerySet[Note], *, kind: str, codes: Sequence[str]) -> QuerySet[Note]:
    """Narrow a note queryset to those whose location falls in one of ``codes``.

    **A boundaries-first semi-join, not a correlated ``EXISTS``.** ``REGION_LOCATIONS_SQL``
    drives from the selected regions and probes the GiST index on ``Location.point_geom``,
    which is the one direction PostGIS can index for this join, and the note is filtered with
    ``location_id IN (<that subquery>)``. A correlated ``EXISTS`` keyed on the note asks the
    same question once per note, which re-runs the ``regions_regionlookup`` arm — the parent
    boundary of a region with no piece — per note. The semi-join evaluates the region set
    once. The two answer identically; only the plan differs.

    Reads the same SQL the density tile splices in (``tiles._DENSITY_REGION``), so the
    rollup, the map and the tile cannot disagree about what "inside the region" means.

    ``kind`` is required because codes are not unique across dimensions — ``"1"`` is a council
    district, an SPA and a supervisorial district here — so a code alone would return up to
    three dimensions' worth, labelled as the one the caller asked for.

    An empty ``codes`` matches nothing, and is short-circuited rather than sent to the
    database: ``= ANY('{}')`` needs an array type Postgres cannot infer from an empty list,
    and the answer is known without asking.
    """
    if not codes:
        return notes.none()

    return notes.filter(location_id__in=RawSQL(REGION_LOCATIONS_SQL, (kind, list(codes))))
