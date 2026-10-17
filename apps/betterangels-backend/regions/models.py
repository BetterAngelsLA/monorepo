"""Region boundary models (DEV-2570 / DEV-2604).

``MultiPolygonField`` in EPSG:4326, so boundaries join ``Location.point_geom`` with no
per-query reprojection. Geometry rather than geography on purpose: Django's ``within``
lookup appends ``::geometry`` to a geography operand, discarding the GiST index.
"""

from __future__ import annotations

import strawberry
from django.contrib.gis.db.models import MultiPolygonField
from django.contrib.gis.db.models.functions import GeomOutputGeoFunc, IsValid
from django.contrib.postgres.indexes import GistIndex
from django.db import models

from common.models import BaseModel

# ~46 m east–west at 34°N (~56 m north–south): below what the map can draw. Measured on the
# dev fixture (431 regions, all six dimensions) this takes the payload from 27.8 MB of GeoJSON
# to 1.04 MB — 15.0 MB of stored geometry to 573 kB (`pg_column_size`).
DISPLAY_SIMPLIFY_DEGREES = 0.0005


class SimplifyPreserveTopology(GeomOutputGeoFunc):
    """``ST_SimplifyPreserveTopology(geometry, tolerance)``.

    Declared as a named subclass because Django compares field expressions **by class**
    (``BaseExpression.__eq__``), so an inline copy in a migration is a different class and
    ``makemigrations --check`` would report a pending change forever. ``0002`` imports this
    helper for that reason rather than redefining it.

    A ``function=`` keyword would emit the same SQL — ``Func.as_sql`` seeds its template data
    from ``self.extra`` before falling back to the class attribute — so the subclass is about
    expression identity, not about how the function name reaches the statement.
    """

    function = "ST_SimplifyPreserveTopology"
    arity = 2
    output_field = MultiPolygonField()


SUBDIVIDE_VERTEX_THRESHOLD = 2000
# A target for ST_Subdivide, not a ceiling: a compact ring with more vertices than
# this cannot be cut smaller, and measured output reaches ~1,900. The win is tighter
# bounding boxes, which is what GiST scans.
SUBDIVIDE_MAX_VERTICES = 256


@strawberry.enum(name="RegionDimension")
class RegionKind(models.TextChoices):
    """The geographic dimensions we aggregate by — the one definition of them.

    Values are the wire and DB identifiers, so keep them stable. The GraphQL enum is published
    as ``RegionDimension`` (the ``name=`` above), the name clients already select against, and
    ``label`` is the display name. Both are published to clients through
    ``RegionDimensionInfo``, so a client renders them rather than keeping a second copy that a
    seventh dimension would silently fall through. This is the house pattern for a dimension
    carried into GraphQL — see ``shelters/enums.py``.
    """

    ZIP = "zip", "ZIP Code"
    CITY = "city", "City"
    COUNCIL_DISTRICT = "council_district", "City Council District"
    SUPERVISORIAL_DISTRICT = "supervisorial_district", "Supervisorial District"
    SPA = "spa", "Service Planning Area"
    COC = "coc", "Continuum of Care"


#: Plural display names, for the picker's "All …" control. Written out rather than derived from
#: ``RegionKind.label``: "City" + "s" is not a word, and neither is "Continuum of Care" + "s".
#: Published alongside the labels so the client does not keep its own copy of either.
REGION_KIND_PLURALS: dict[str, str] = {
    RegionKind.ZIP: "ZIP Codes",
    RegionKind.CITY: "Cities",
    RegionKind.COUNCIL_DISTRICT: "City Council Districts",
    RegionKind.SUPERVISORIAL_DISTRICT: "Supervisorial Districts",
    RegionKind.SPA: "Service Planning Areas",
    RegionKind.COC: "Continuums of Care",
}


class Region(BaseModel):
    """One boundary polygon belonging to one geographic dimension."""

    kind = models.CharField(max_length=32, choices=RegionKind.choices)
    # The stable identifier within `kind`: "13", "90012", "CA-600". Text because the
    # formats differ.
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255, blank=True, default="")
    # Provenance. Paired with `source_item_id` so a stale boundary set is identifiable.
    source_url = models.URLField(max_length=1024, blank=True, default="")
    source_vintage = models.CharField(max_length=32, blank=True, default="")
    # The publisher's own `copyrightText`, verbatim. Answers "is this authoritative?"
    # from the database. LA City council districts and the county city layer publish
    # none, so for those the service does not evidence authority.
    source_attribution = models.TextField(blank=True, default="")
    # Item ids are stable; the URLs they came from are not.
    source_item_id = models.CharField(max_length=64, blank=True, default="")

    # **No spatial index on this column.** It is the authoritative full-resolution boundary,
    # and no read puts a spatial predicate on it: the importer reads it to subdivide (a full
    # scan) and the admin's detail page reads it by primary key. Every indexed spatial read in
    # the app goes through `geom_display` (the tiles) or `RegionPiece.geom` (the point lookup),
    # so a GiST index here would be rebuilt on every import and probed by nothing.
    geom = MultiPolygonField(srid=4326, spatial_index=False)

    # A **generated column**: the database derives and maintains it, so there is no
    # backfill to run, no chance of it drifting from `geom`, and no fallback needed
    # (it cannot be NULL while `geom` is not). `ST_SimplifyPreserveTopology` is
    # IMMUTABLE, which is what makes this legal.
    #
    # Not derived from `RegionPiece`: subdivision clips at subdivision boundaries, so
    # reuniting a region from its pieces does not equal the parent.
    geom_display = models.GeneratedField(
        expression=SimplifyPreserveTopology(models.F("geom"), models.Value(DISPLAY_SIMPLIFY_DEGREES)),
        output_field=MultiPolygonField(srid=4326, null=True),
        db_persist=True,
    )

    objects = models.Manager()

    class Meta:
        constraints = [
            # Makes the loader idempotent.
            models.UniqueConstraint(
                fields=["kind", "code"],
                name="regions_region_kind_code_uniq",
                violation_error_message="A region with this kind and code already exists.",
            ),
            # The one thing that makes a tile query safe against a bad row. `ST_Covers`
            # tolerates an invalid geometry, but `ST_AsMVTGeom` and `ST_Intersection` do not —
            # an invalid boundary fails an `ST_Intersection` outright with
            # `TopologyException: Nested shells`, which would take down a whole dimension's
            # tiles. `ST_IsValid` is IMMUTABLE, so it is legal in a CHECK.
            models.CheckConstraint(
                condition=models.Q(IsValid("geom")),
                name="regions_region_geom_valid",
                violation_error_message="Region geometry must be a valid OGC geometry.",
            ),
        ]
        # **One** index on `kind`, declared here rather than with `db_index=True`.
        # `db_index=True` on a `CharField` also creates a `varchar_pattern_ops` twin for
        # prefix `LIKE`s, which nothing in this app performs — two indexes where one is
        # meant. `geom` carries no spatial index (see the field), and `geom_display` needs
        # one declared by hand because a `GeneratedField` is never indexed automatically:
        # `PostGISSchemaEditor._field_should_be_indexed` looks for `spatial_index`, which a
        # generated column does not carry, so the `geom_display && <envelope>` predicate in
        # the boundary tile would otherwise scan every row of the dimension for every tile.
        indexes = [
            models.Index(fields=["kind"], name="regions_region_kind_idx"),
            GistIndex(fields=["geom_display"], name="regions_region_geom_display_gix"),
        ]
        #
        # **No model-level `ordering`, deliberately.** Django appends it to every SELECT, so a
        # bare `.distinct()` de-duplicates on `(kind, code)` and yields one row per region
        # instead of one per kind. Callers that want an order ask for one.

    def __str__(self) -> str:
        label = self.name or self.code
        return f"{self.get_kind_display()} {label}"


class RegionPiece(BaseModel):
    """A sub-polygon of a :class:`Region`, sized for fast point lookup.

    ``Region.geom`` is the authoritative boundary: full resolution, the source for
    ``geom_display`` (which is what the tiles read), for area, and for the admin's detail
    page. It is the wrong thing to test a point against. The
    largest boundary row — a supervisorial district — holds 77,918 vertices, and the
    largest city row 32,273, so the GiST index hands the planner a bounding box that
    matches far more points than the polygon encloses and the real work lands in the
    vertex recheck: against the whole boundaries the rollup measures **~127 ms** at
    20,000 interactions.

    Subdivided, the same work is **~85 ms**. PostGIS's own guidance is this one: *"when you
    have very large polygons, but are doing queries in small areas, you 'denormalize' your
    geometric data into smaller chunks so that the index can effectively subquery parts of
    the object"* (Data Management §4.3.4.4, which points at ``ST_Subdivide``).

    ``SUBDIVIDE_MAX_VERTICES`` is a tuned target, not a "smaller is better" knob. Measured
    on the full rollup, all six dimensions, over the 20,000-interaction window:

        max_vertices     pieces     rollup
        256 (this)        5,685      85 ms
        128              11,149      91 ms
        64               22,136     113 ms
        32               44,719     140 ms

    Tighter pieces have smaller bounding boxes but there are more of them, and a point
    falls inside more of their boxes; the extra index entries cost more than the thinner
    recheck saves. The penalty is real but mild — 1.6× across the whole range — so 256 is
    the cheap end of a shallow curve rather than a cliff. **All four produce identical
    answers** — subdivision is exact, so this is purely a performance dial. Re-measure
    before changing it.

    ``SUBDIVIDE_VERTEX_THRESHOLD`` is the other half of the tuning, and the less obvious one:
    **only** regions above it are subdivided at all. Subdividing everything instead — the same
    256-vertex target, no threshold — produces 8,156 pieces against 5,685 and measures the
    same (85 ms either way). The threshold therefore buys fewer rows to store, index and
    rebuild, not a faster query: a region that is already a handful of vertices is not worth
    splitting, but splitting it costs little.

    Read through ``regions_regionlookup`` (see ``0004``), never directly. The view adds the
    parent boundary back for a region that has no piece, so a region created outside
    ``import_regions`` still resolves instead of disappearing from the rollup. **That
    fallback, not the plan shape, is why the view is kept.** Pointing the rollup straight at
    this table lets the planner drive from the notes on a small window, and re-measured that
    is not uniformly worse: at ~660 notes it costs 42 ms against 29 ms through the view, but
    at ~100 it costs 8 ms against 28 ms, and at 10 notes 1.5 ms against 7.7 ms. At 20,000 the
    two agree (82 ms against 85 ms), so neither shape is a blanket win.

    The FK covers ``region``; the GiST index on ``geom`` is the ``spatial_index=True`` default.
    There is deliberately **no** denormalised ``kind``: every reader joins ``Region`` to read
    the code anyway, so a copy would be a second source of truth that can disagree with its
    parent.
    """

    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="pieces")
    geom = MultiPolygonField(srid=4326)

    def __str__(self) -> str:
        return f"piece of {self.region_id}"


#: SQL name of the point-lookup view, which migration ``0004`` creates. Read with raw SQL
#: (``selectors``), never through the ORM: the view has no primary key for a model to
#: declare.
REGION_LOOKUP_VIEW = "regions_regionlookup"
