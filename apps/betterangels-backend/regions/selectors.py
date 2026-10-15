"""Read-only rollups over the authoritative boundaries (DEV-2570 / DEV-2604).

The rollup is a **live spatial join**, not an indexed join against a precomputed
crosswalk. Deciding which region covers a point happens on every read, which is
affordable because the join is written in the one direction PostGIS can index: the
subdivided boundaries drive, and the GiST index on ``Location.point_geom`` is probed.

There is no derived table to keep fresh, so there is no backfill, no staleness window
and nothing to write from a read path.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Sequence

from django.contrib.gis.db.models import GeometryField, MultiPolygonField
from django.contrib.gis.db.models.functions import GeomOutputGeoFunc
from django.contrib.gis.geos import MultiPolygon
from django.db import connection
from django.db.models import BooleanField, F, FloatField, Func, QuerySet, Value
from django.db.models.expressions import RawSQL
from django.db.models.functions import Cast

from common.models import Location
from notes.models import Note

from .models import REGION_LOOKUP_VIEW, Region, RegionKind

#: Table names interpolated into the raw SQL below. Taken from the models rather than
#: written out, so a `db_table` override cannot leave the query pointing at a table that
#: no longer exists.
_NOTE_TABLE = Note._meta.db_table
_LOCATION_TABLE = Location._meta.db_table
_REGION_TABLE = Region._meta.db_table


def org_notes_in_range(*, organization_id: int, start: datetime, end: datetime) -> QuerySet[Note]:
    """The organization's notes in a half-open instant range — every read's starting point.

    Deliberately one function so the org predicate has exactly one home. Both
    client-data-bearing reads in this app start from this queryset. A caller that builds
    its own ``Note.objects.filter(...)`` reproduces the hole this closes:
    ``interactionMap`` once queried notes across **every** organization in the date window
    and relied on a later SQL clause (``interaction_points``'s ``organization_id``) to
    confine the result — which meant the note queryset handed to the permission filter was
    cross-org, and the map materialised every organization's note ids per request.
    """
    return Note.objects.filter(
        organization_id=organization_id,
        interacted_at__gte=start,
        interacted_at__lt=end,
    )


def _rollup_sql(*, organization_id: int | None) -> str:
    """The rollup statement, with the org predicate only when there is one.

    Paths with no organization scope are the ungrouped report, and they must **not** be
    spelled as a `%(organization_id)s IS NULL OR …` — that defeats the planner's ability
    to use the column, and it puts the confinement decision inside a SQL expression
    rather than at the call site.
    """
    org = "AND n.organization_id = %(organization_id)s" if organization_id is not None else ""
    return f"""
        SELECT rr.kind AS kind, rr.code AS code, count(n.id) AS count
        FROM {REGION_LOOKUP_VIEW} lu
        JOIN {_REGION_TABLE} rr ON rr.id = lu.region_id
        JOIN {_LOCATION_TABLE} l ON ST_Covers(lu.geom, l.point_geom)
        JOIN {_NOTE_TABLE} n ON n.location_id = l.id
        WHERE n.interacted_at >= %(start)s
          AND n.interacted_at < %(end)s
          {org}
        GROUP BY rr.kind, rr.code
    """


def _assigned_counts(*, start: datetime, end: datetime, organization_id: int | None) -> dict[str, dict[str, int]]:
    """Interactions per ``(kind, code)`` that a boundary actually contains.

    **The boundaries drive and the points are probed.** That is the whole trick and it is
    worth about 5x. Written the other way round — "for each interaction, find its region",
    a `LATERAL` over the pieces — the planner puts the points on the inner side and probes
    them once per interaction. Written this way it scans the lookup polygons and probes the
    GiST index on `point_geom` for each, which is the direction PostGIS can index: the plan
    shows `Index Cond: (point_geom @ lu.geom)`.

    Measured on the real LA layers (431 regions, 5,685 pieces, 4,000 locations, 20,000
    interactions), all six dimensions at once:

        this direction, no precomputation     39 ms
        per-location LATERAL over pieces     202 ms
        no subdivision at all              4,950 ms

    At 500,000 interactions it is 210 ms against 211 ms for the precomputed crosswalk this
    replaced — the spatial cost tracks *distinct locations*, not interactions, so it
    amortises as a report window grows. It is ~2.4x slower at the 20,000-interaction
    fixture, and that is the honest price of not maintaining a derived table.

    ``ST_Covers`` alone carries the index condition, so there is no explicit ``&&``. Adding
    one measures *slower* (91 ms against 45 ms): the redundant predicate constrains the
    join order the planner would otherwise pick for itself.

    No ``kind`` predicate. One pass over every dimension's pieces costs about what one
    dimension costs (39 ms against 28 ms), so a single-dimension rollup filters the same
    result in Python instead of paying for a second query shape.

    Grouped by kind **and** code: without the kind, SPA 1, council district 1 and
    supervisorial district 1 collapse into one bucket.
    """
    params: dict[str, Any] = {"start": start, "end": end}
    if organization_id is not None:
        params["organization_id"] = organization_id

    with connection.cursor() as cursor:
        cursor.execute(_rollup_sql(organization_id=organization_id), params)
        rows = cursor.fetchall()

    counts: dict[str, dict[str, int]] = {}
    for kind, code, count in rows:
        counts.setdefault(kind, {})[code] = count
    return counts


def _notes_with_a_location(*, start: datetime, end: datetime, organization_id: int | None) -> int:
    """Interactions in range that carry a point, whether or not a boundary contains it.

    The minuend of the unassigned subtraction. A note's location either falls in exactly
    one region of a dimension or in none, so ``unassigned = this - assigned`` — which is
    why the unassigned bucket needs no spatial query of its own. Written as a spatial
    anti-join instead, it measured **3.2 seconds** on 20,000 interactions.
    """
    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end, location__isnull=False)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)
    return notes.count()


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
    scopes = (sorted(loaded) if kind is None else [kind]) if (kind is None or kind in loaded) else []
    scopes = [scope for scope in scopes if scope in loaded]
    if not scopes:
        return []

    assigned = _assigned_counts(start=start, end=end, organization_id=organization_id)
    codes_set = None if codes is None else set(codes)

    buckets: list[dict[str, Any]] = []
    if not unassigned_only:
        for scope in scopes:
            for code, count in assigned.get(scope, {}).items():
                if codes_set is not None and code not in codes_set:
                    continue
                buckets.append({"kind": scope, "code": code, "name": "", "count": count})

    # `codes is None` means "no restriction", which includes the unassigned bucket, exactly
    # as an absent filter did when the unassigned rows were stored with a NULL region.
    if unassigned_only or include_unassigned or codes is None:
        with_location = _notes_with_a_location(start=start, end=end, organization_id=organization_id)
        for scope in scopes:
            # Every point resolves to at most one region per dimension, which is what makes
            # this a subtraction rather than a spatial query. Guarded with `> 0` rather than
            # emitted unconditionally: if a dimension's boundaries were ever to overlap
            # rather than partition, the total would exceed the number of points and a
            # negative "unassigned" bucket is not the way to say so.
            unassigned = with_location - sum(assigned.get(scope, {}).values())
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

    # Deterministic: by dimension, named regions in code order, unassigned last. The
    # previous implementation returned whatever order the GROUP BY produced.
    buckets.sort(key=lambda bucket: (bucket["kind"], bucket["code"] is None, bucket["code"] or ""))
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

    The ``kind__in`` filter runs in the database, so a kind the GraphQL enum does not know is
    excluded rather than making ``regionDimensions`` fail wholesale.

    ``Region`` carries no ``Meta.ordering``, so this de-duplicates on ``kind`` alone. It used
    to need an explicit ``.order_by()`` to defeat a model-level ordering that widened the
    ``DISTINCT`` to ``(kind, code)``; that ordering is gone, so the call is not.
    """
    known = list(RegionKind.values)
    kinds = Region.objects.filter(kind__in=known).values_list("kind", flat=True).distinct()
    return sorted(kinds)


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GEOS geometry, for the map view.

    Serves ``geom_display`` (see ``Region.geom_display``), which is a generated column, so it
    is always present for a row with geometry and there is nothing to fall back to.

    ``codes`` of ``None`` or ``[]`` both mean "no restriction". ``parse_region_code_filter``
    reads an empty list the other way for the rollup, so the two are not interchangeable.

    ``ST_ReducePrecision`` keeps coordinates at 6 dp (~10 cm) **in the database**: GEOS
    serialises at full IEEE-754 precision, measured at 1.58x the payload.

    The ``output_field`` below is load-bearing too; see ``RegionType.geometry``.
    """
    # An empty list means "no restriction", so it is normalised away before the filter —
    # see the docstring. If this ever needs to mean "match nothing", this line and
    # `useRegionMap`'s normalisation have to change together.
    queryset = Region.objects.filter(kind__in=list(kinds))
    if codes:
        queryset = queryset.filter(code__in=list(codes))

    # `ReducePrecision` rounds in the database rather than in Python. No `Coalesce`: since
    # `geom_display` became a generated column it cannot be NULL where `geom` is not.
    rows = (
        queryset.annotate(geometry=ReducePrecision(F("geom_display"), Value(GEOJSON_PRECISION_GRID)))
        .values("kind", "code", "name", "geometry")
        .order_by("kind", "code")
    )

    # The GEOS object goes on as-is; the schema's `MultiPolygon` scalar turns it into
    # coordinates. Converting here would defeat it — the scalar's serializer checks
    # `isinstance(v, MultiPolygon)` and passes anything else through untouched, so a tuple of
    # coordinates would be treated as an opaque value.
    return [
        {
            "kind": row["kind"],
            "code": row["code"],
            "name": row["name"] or "",
            "geometry": _as_multipolygon(row["geometry"]),
        }
        for row in rows
    ]


def _as_multipolygon(geometry: Any) -> Any:
    """The row's geometry as a ``MultiPolygon``, which is what the scalar requires.

    The annotation declares ``MultiPolygonField``, so the ORM coerces even a single-part
    result — which PostGIS returns as ``POLYGON`` — to a ``MultiPolygon``. Asserted for every
    loaded dimension by ``test_region_geometry_is_a_multipolygon``.

    This is not a defensive branch but a tripwire on a one-word dependency: without
    ``output_field`` the value is a ``Polygon``, the scalar's ``isinstance`` guard fails, and
    the raw GEOS object reaches the JSON encoder — which surfaces as a WKT *string* rather
    than an error, so nothing else would catch it.
    """
    assert isinstance(geometry, MultiPolygon), (
        f"expected a MultiPolygon from the annotation, got {type(geometry).__name__}; "
        "check that ReducePrecision still declares output_field=MultiPolygonField()"
    )
    return geometry


# Coordinate grid for region geometry, in degrees. `1e-6` is ~10 cm — finer than the
# simplification tolerance (`models.DISPLAY_SIMPLIFY_DEGREES`), so nothing visible is lost,
# and it is what keeps the payload at parity with the old `ST_AsGeoJSON(…, 6)`: GEOS
# serialises at full double precision otherwise, which measured 1.58x the size.
GEOJSON_PRECISION_GRID = 1e-6


class ReducePrecision(GeomOutputGeoFunc):
    """``ST_ReducePrecision(geometry, gridSize)`` — rounds coordinates onto a grid.

    A subclass rather than a call with ``function=``: ``GeomOutputGeoFunc`` resolves the SQL
    name from the class attribute, so passing it as a keyword emits a call to
    ``st_geomoutputgeofunc(...)`` instead. Django has no wrapper for this function, which is
    why it is declared here — the same reason ``ST_Multi`` and ``ST_Subdivide`` are raw SQL
    in ``services``.

    ``output_field`` is explicit so the ORM knows the result is a MultiPolygon rather than
    inferring it from the arguments.
    """

    function = "ST_ReducePrecision"
    arity = 2
    output_field = MultiPolygonField()


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
    # `notes` is folded in as a **subquery**, not as a materialised list of ids. The
    # previous version did `list(notes.values_list("id", flat=True))` and shipped the ids
    # back as a bind parameter — one round trip to read every id in the window, an
    # unbounded parameter list, and the whole thing thrown away again to answer the same
    # question the database could have answered inline. `__in=<queryset>` lets Postgres
    # plan it as a semi-join against the query the caller already built.
    queryset = Note.objects.filter(
        organization_id=organization_id,
        interacted_at__gte=start,
        interacted_at__lt=end,
        location__isnull=False,
    )
    if notes is not None:
        queryset = queryset.filter(pk__in=notes.values("pk"))

    # `ST_X`/`ST_Y` are called through `Func` because Django ships **no** wrapper for either —
    # its GeoDjango function set is Area, AsGeoJSON, Centroid, Distance, Envelope, Length,
    # Transform, Union and similar, and the only `ST_X`/`ST_Y` in the codebase is
    # Oracle-specific.
    #
    # The `Cast(…, GeometryField())` is **required, not cosmetic**: `point` is
    # `geography=True` (common/models.py) and PostGIS defines `ST_X`/`ST_Y` only for
    # geometry, so without it the query fails on the live database with
    # `function st_x(geography) does not exist`. The generated `point_geom` column would
    # also serve, but `point` is what the caller wrote and this keeps the cast in one place.
    point_geometry = Cast("location__point", GeometryField())
    rows = (
        queryset.annotate(
            latitude=Func(point_geometry, function="ST_Y", output_field=FloatField()),
            longitude=Func(point_geometry, function="ST_X", output_field=FloatField()),
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

    An ``EXISTS`` rather than a reverse-relation join: a join yields one row per matching
    assignment and would need the ``.distinct()`` a semi-join does not. Raw SQL because the
    predicate is a spatial one against the lookup view, which has no ORM model.

    Correlated on the **note**, with the location reached through ``notes_note.location_id``
    rather than by naming whatever alias Django happened to give the join. That keeps the
    fragment independent of the queryset it is attached to.

    ``kind`` is required because codes are not unique across dimensions — ``"1"`` is a council
    district, an SPA and a supervisorial district here — so a code alone would return up to
    three dimensions' worth, labelled as the one the caller asked for.

    An empty ``codes`` matches nothing, and is short-circuited rather than sent to the
    database: ``= ANY('{}')`` needs an array type Postgres cannot infer from an empty list,
    and the answer is known without asking.
    """
    if not codes:
        return notes.none()

    sql = f"""
        EXISTS (
            SELECT 1
            FROM {REGION_LOOKUP_VIEW} lu
            JOIN {_REGION_TABLE} rr ON rr.id = lu.region_id
            JOIN {_LOCATION_TABLE} l ON l.id = {_NOTE_TABLE}.location_id
            WHERE rr.kind = %s
              AND rr.code = ANY(%s)
              AND ST_Covers(lu.geom, l.point_geom)
        )
    """
    return notes.annotate(_in_region=RawSQL(sql, (kind, list(codes)), output_field=BooleanField())).filter(
        _in_region=True
    )
