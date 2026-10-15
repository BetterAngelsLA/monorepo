"""Region boundary models (DEV-2570 / DEV-2604).

``MultiPolygonField`` in EPSG:4326, so boundaries join ``Location.point`` with no
per-query reprojection. Geometry rather than geography on purpose: Django's
``within`` lookup appends ``::geometry`` to a geography operand, discarding the GiST
index.
"""

from __future__ import annotations

import strawberry
from django.contrib.gis.db.models import MultiPolygonField
from django.contrib.gis.db.models.functions import GeomOutputGeoFunc
from django.db import models

from common.models import BaseModel

# ~46 m at Los Angeles: below what the map can draw, and it takes the six-dimension
# payload from 21 MB to 817 kB.
DISPLAY_SIMPLIFY_DEGREES = 0.0005


class SimplifyPreserveTopology(GeomOutputGeoFunc):
    """``ST_SimplifyPreserveTopology(geometry, tolerance)``.

    Declared for the generated column below. A subclass rather than a call with
    ``function=``: ``GeomOutputGeoFunc`` resolves the SQL name from the class attribute, so
    passing it as a keyword emits a call to the class's own name — the same trap
    ``selectors.ReducePrecision`` documents.
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
    ``label`` is the single place the display names live. This is the house pattern for a
    dimension carried into GraphQL — see ``shelters/enums.py``.
    """

    ZIP = "zip", "ZIP Code"
    CITY = "city", "City"
    COUNCIL_DISTRICT = "council_district", "City Council District"
    SUPERVISORIAL_DISTRICT = "supervisorial_district", "Supervisorial District"
    SPA = "spa", "Service Planning Area"
    COC = "coc", "Continuum of Care"


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

    geom = MultiPolygonField(srid=4326)

    # A **generated column**: the database derives and maintains it, so there is no
    # backfill to run, no chance of it drifting from `geom`, and no fallback needed
    # (it cannot be NULL while `geom` is not). `ST_SimplifyPreserveTopology` is
    # IMMUTABLE, which is what makes this legal.
    #
    # It was hand-maintained until this, kept in step by `import_regions`, with
    # `region_features` coalescing back to `geom` for rows a test or script created
    # without it. Verified byte-identical to what the importer used to write — 0 of 583
    # rows differed — so the change is invisible to consumers.
    #
    # Not derived from `RegionPiece`: subdivision clips at subdivision boundaries, so
    # reuniting a region from its pieces equals the parent for only 334 of 431.
    geom_display = models.GeneratedField(
        expression=SimplifyPreserveTopology(models.F("geom"), models.Value(DISPLAY_SIMPLIFY_DEGREES)),
        output_field=MultiPolygonField(srid=4326, null=True),
        db_persist=True,
    )

    objects = models.Manager()

    class Meta:
        constraints = [
            # Makes the loader idempotent.
            models.UniqueConstraint(fields=["kind", "code"], name="regions_region_kind_code_uniq"),
        ]
        # **One** index on `kind`, declared here rather than with `db_index=True`.
        # `db_index=True` on a `CharField` also creates a `varchar_pattern_ops` twin for
        # prefix `LIKE`s, which nothing in this app performs — two indexes where one is
        # meant. The GiST index on `geom` is `spatial_index=True`, the default.
        indexes = [models.Index(fields=["kind"], name="regions_region_kind_idx")]
        #
        # **No model-level `ordering`, deliberately.** It is appended to every SELECT, so a
        # bare `.distinct()` de-duplicates on `(kind, code)` and returns one row per region
        # instead of one per kind — which silently broke two call sites, each of which now
        # carries an `order_by()` plus a comment explaining it. Callers that want an order
        # ask for one.

    def __str__(self) -> str:
        label = self.name or self.code
        return f"{self.get_kind_display()} {label}"


class RegionPiece(BaseModel):
    """A sub-polygon of a :class:`Region`, sized for fast point lookup.

    ``Region.geom`` is the authoritative boundary: full resolution, used for display,
    area, and the vector tiles. It is the wrong thing to test a point against. A single
    city multipolygon can be hundreds of thousands of vertices in one row, so the GiST
    index hands the planner one enormous bounding box that matches nearly every point in
    Los Angeles and the real work lands in the vertex recheck — measured at **4,950 ms**
    for the supervisorial dimension against 20,000 interactions.

    Subdivided, the same work is **45 ms**. PostGIS's own guidance is this one: *"when you
    have very large polygons, but are doing queries in small areas, you 'denormalize' your
    geometric data into smaller chunks so that the index can effectively subquery parts of
    the object"* (Data Management §4.3.4.4, which points at ``ST_Subdivide``).

    ``SUBDIVIDE_MAX_VERTICES`` is a tuned target, not a "smaller is better" knob. Measured
    on the full rollup, all six dimensions:

        max_vertices     pieces     rollup
        256 (this)        5,685      45 ms
        128              11,149     210 ms
        64               22,136     231 ms
        32               44,719     250 ms

    Tighter pieces have smaller bounding boxes but there are more of them, and a point
    falls inside more of their boxes; the extra index entries cost more than the thinner
    recheck saves. **All four produce identical answers** — subdivision is exact, so this
    is purely a performance dial. Re-measure before changing it.

    ``SUBDIVIDE_VERTEX_THRESHOLD`` is the other half of the tuning, and the less obvious one:
    **only** regions above it are subdivided at all. Subdividing everything instead — the same
    256-vertex target, no threshold — is 1,867 ms against 39 ms for the rollup, on 8,156
    pieces against 5,685. A region that is already a handful of vertices is not worth
    splitting, and the pieces the split produces cost more to search than the single original
    did. This is why "the boundaries are slow, subdivide more" is the wrong instinct twice
    over.

    Read through ``regions_regionlookup`` (see ``0004``), never directly. The view adds the
    parent boundary back for a region that has no piece, so a region created outside
    ``import_regions`` resolves slower rather than disappearing from the rollup — and it is
    also what keeps the planner driving from the boundaries rather than from the notes, which
    is worth 3x on a selective window.
    """

    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="pieces")
    geom = MultiPolygonField(srid=4326)

    class Meta:
        # The FK covers `region`; the GiST index on `geom` is `spatial_index=True`, the
        # default. There is deliberately **no** denormalised `kind` here: the rollup joins
        # `Region` anyway to read the code, so a copy bought nothing and could disagree
        # with its parent.
        pass

    def __str__(self) -> str:
        return f"piece of {self.region_id}"


#: SQL name of the point-lookup view. Defined in migration ``0004``; read with raw SQL
#: (``selectors._ROLLUP_SQL``), never through the ORM.
REGION_LOOKUP_VIEW = "regions_regionlookup"
