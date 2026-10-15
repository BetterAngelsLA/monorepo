"""Read-only rollups over the stored region assignments (DEV-2570 / DEV-2604).

The rollup is an ordinary indexed ORM join against ``LocationRegion``. The spatial
work — deciding which region covers a point — happens once on the write side, in
``services``, not on every read.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Sequence

from django.contrib.gis.db.models import GeometryField, MultiPolygonField
from django.contrib.gis.db.models.functions import GeomOutputGeoFunc
from django.contrib.gis.geos import MultiPolygon
from django.db.models import Count, Exists, FloatField, Func, OuterRef, Q, QuerySet, Value
from django.db.models.functions import Cast, Coalesce

from notes.models import Note

from .models import LocationRegion, Region, RegionKind


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

    **This writes, deliberately.** ``ensure_location_regions`` is incremental, so the fill is
    ~450 ms once after new locations appear and a no-op afterwards. ``python.md`` calls
    selectors read-only; this tops up a derived index without mutating anything a caller
    passed, and the alternative (a beat job) buys nothing but a staleness window.
    """
    from .services import ensure_location_regions

    ensure_location_regions(kind=kind)

    notes = Note.objects.filter(interacted_at__gte=start, interacted_at__lt=end)
    if organization_id is not None:
        notes = notes.filter(organization_id=organization_id)

    assignments = "location__region_assignments"

    # **Every predicate on this relation goes into ONE `filter()` call.**
    #
    # Django builds a *separate join* per `filter()` on a multi-valued relation, so chaining
    # two filters on this one multiplies rows: a note with a `council_district` row *and* an
    # `spa` row is counted twice in the `spa` rollup. Combining with `Q` makes one join, which
    # is what lets the count below be a plain `count`.
    predicate = Q(**{f"{assignments}__isnull": False})
    if kind is not None:
        predicate &= Q(**{f"{assignments}__kind": kind})

    if unassigned_only:
        predicate &= Q(**{f"{assignments}__region__isnull": True})
    elif codes is not None:
        # The kind is part of the predicate, not just a filter applied earlier: codes are not
        # unique across dimensions — "1" is a council district, an SPA and a supervisorial
        # district — so matching on the code alone pulls in regions from dimensions the caller
        # did not ask for.
        codes_q = Q(**{f"{assignments}__region__code__in": list(codes)})
        if include_unassigned:
            # Joining on `region__code` already drops unassigned rows, so the unassigned arm
            # has to be an OR inside the same predicate rather than a second filter.
            codes_q |= Q(**{f"{assignments}__region__isnull": True})
        predicate &= codes_q

    rows = notes.filter(predicate)

    # Grouped by kind as well as code: without it, SPA 1, council district 1 and
    # supervisorial district 1 collapse into a single bucket.
    counts = (
        rows.values(f"{assignments}__kind", f"{assignments}__region__code")
        # Plain `count`, which is correct *because the filter above is a single join*:
        # `unique_location_kind_assignment` means a location has one row per dimension, and one
        # join therefore yields one row per note per dimension. `DISTINCT` was not free — it
        # forced a Sort+GroupAggregate over every note in range (23.2 ms against 9.7 ms on 20k
        # notes) — but it was load-bearing against the chained-filter cross-product above, so
        # it could only be dropped after that was fixed. Anyone tempted to split the predicate
        # back into separate `filter()` calls must put `distinct=True` back with it.
        #
        # `interaction_points` is a different case and does need `DISTINCT`: it joins notes
        # directly, with no per-dimension constraint in between.
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

    # Names come from the authoritative region row, one query rather than a join that would
    # widen the GROUP BY. Keyed by (kind, code), since a code alone is ambiguous.
    #
    # Narrowed to the kinds actually present in the result. For a single-dimension rollup that
    # is the same `kind=`, but for the ungrouped one it fetches only the dimensions that
    # returned a bucket instead of every loaded region — 431 rows before, a handful after.
    kinds_present = sorted({bucket["kind"] for bucket in buckets if bucket["kind"]})
    if not kinds_present:
        return buckets
    regions = Region.objects.filter(kind__in=kinds_present)
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

    The ``kind__in`` filter runs in the database, so a kind the GraphQL enum does not know is
    excluded rather than making ``regionDimensions`` fail wholesale.

    ``.order_by()`` is load-bearing: the model's default ordering is appended to the SELECT, so
    a bare ``.distinct()`` de-duplicates on ``(kind, code)`` and returns one row per region. See
    ``services.ensure_location_regions``.
    """
    known = list(RegionKind.values)
    kinds = Region.objects.order_by().filter(kind__in=known).values_list("kind", flat=True).distinct()
    return sorted(kinds)


def region_features(*, kinds: Iterable[str], codes: Iterable[str] | None = None) -> list[dict[str, Any]]:
    """Region polygons as GEOS geometry, for the map view.

    Serves ``geom_display`` (see ``Region.geom_display``), falling back to ``geom`` where the
    importer has not set it, so a region is never invisible on the map.

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

    # `Coalesce` expresses the `geom_display` fallback, and `ReducePrecision` rounds in the
    # database rather than in Python.
    rows = (
        queryset.annotate(geometry=ReducePrecision(Coalesce("geom_display", "geom"), Value(GEOJSON_PRECISION_GRID)))
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
    # `function st_x(geography) does not exist`. There is no implicit
    # geography→geometry cast, which is the same reason the raw SQL this replaced wrote
    # `l.point::geometry`, and the same reason ``ensure_location_regions`` still does.
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

    ``Exists`` rather than a reverse-relation join: a join yields one row per matching
    assignment and would need the ``.distinct()`` a semi-join does not.

    ``kind`` is required because codes are not unique across dimensions — ``"1"`` is a council
    district, an SPA and a supervisorial district here — so a code alone would return up to
    three dimensions' worth, labelled as the one the caller asked for.

    Tops the cache up first; see ``region_counts``.
    """
    from .services import ensure_location_regions

    ensure_location_regions(kind=kind)

    return notes.filter(
        Exists(
            LocationRegion.objects.filter(
                location=OuterRef("location_id"),
                kind=kind,
                region__code__in=list(codes),
            )
        )
    )
