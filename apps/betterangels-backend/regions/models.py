"""Region boundary models (DEV-2570 / DEV-2604).

A ``Region`` is one polygon of one geographic dimension — a council district, a
ZIP, a city, an SPA. Interactions already carry a point (``Note.location`` →
``common.Location.point``), so aggregation is a spatial join against this table
rather than anything captured from users.

Design notes that are load-bearing:

* ``MultiPolygonField``, **not** ``geography``. Django's ``within`` lookup maps to
  ``ST_Within`` without ``geography=True`` and so appends ``::geometry`` to a
  geography operand, which discards the GiST index. ``ST_Covers`` against a
  ``geometry`` column keeps it. (Measured; see docs/gis/.)
* Shapefile layers are single-type by construction, so a dataset that is
  ``Polygon`` on disk cannot hold a multi-part feature. Everything is promoted to
  ``MultiPolygon`` at import.
* Boundaries are canonical EPSG:4326 so they join directly against
  ``Location.point`` without a per-query reprojection.
"""

from __future__ import annotations

from django.contrib.gis.db.models import MultiPolygonField
from django.db import models

from common.models import BaseModel

# Tolerance for the map's display geometry, in degrees. 0.0005 deg is ~46 m at Los
# Angeles, which is 0.2 px at zoom 9 and 0.7 px at zoom 11 -- below what the map can
# draw. Measured: it takes the full boundary payload from 21 MB to 817 kB.
DISPLAY_SIMPLIFY_DEGREES = 0.0005

SUBDIVIDE_VERTEX_THRESHOLD = 2000
# Passed to ST_Subdivide as the target size, NOT a guaranteed ceiling. The PostGIS
# docs say it cuts with rectilinear lines so each part holds "no more than
# max_vertices", but a compact ring with more vertices than the target cannot be
# cut smaller — measured output here reaches ~1,900 vertices on the heavy layers.
# The win is smaller *bounding boxes*, which is what the GiST index scans. It is
# not a vertex cap; do not describe it as one.
SUBDIVIDE_MAX_VERTICES = 256


class RegionKind(models.TextChoices):
    """The geographic dimensions we aggregate by.

    Values are the wire/DB identifiers; they are what the GraphQL enum and the
    loader's ``--kind`` argument both use, so keep them stable.
    """

    ZIP = "zip", "ZIP Code"
    CITY = "city", "City"
    COUNCIL_DISTRICT = "council_district", "City Council District"
    SUPERVISORIAL_DISTRICT = "supervisorial_district", "Supervisorial District"
    SPA = "spa", "Service Planning Area"
    COC = "coc", "Continuum of Care"


class Region(BaseModel):
    """One boundary polygon belonging to one geographic dimension."""

    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    # The region's stable identifier within its kind: "13" for council district
    # 13, "90012" for a ZIP, "CA-600" for a CoC. Text because the formats differ.
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255, blank=True, default="")
    # Provenance, so a stale boundary set is identifiable after the fact.
    source_url = models.URLField(max_length=1024, blank=True, default="")
    source_vintage = models.CharField(max_length=32, blank=True, default="")
    # The publisher's own claim of ownership, captured verbatim from the service's
    # `copyrightText`. This is the field that answers "is this authoritative?" from
    # the database instead of by re-probing the endpoint: e.g. supervisorial
    # districts say "maintained by the Los Angeles County Department of
    # Registrar-Recorder/County Clerk", SPAs say "Department of Public Health".
    #
    # Two of our layers publish none — LA City council districts and the county
    # city layer — which is worth recording: for
    # those, authority is not evidenced by the service.
    source_attribution = models.TextField(blank=True, default="")
    # The ArcGIS item id, which identifies the exact hosted layer rather than just
    # its URL (URLs get reorganised; item ids do not).
    source_item_id = models.CharField(max_length=64, blank=True, default="")

    # The authoritative boundary: full resolution. Used for area, exports, and any
    # question where the real line matters.
    geom = MultiPolygonField(srid=4326)

    # Simplified copy of ``geom``, solely for the map view, built by the importer.
    #
    # Three consumers want three different tolerances, so there are three columns
    # rather than one compromise:
    #
    #   geom         authoritative, full resolution (area, disputes, exports)
    #   geom_display ST_SimplifyPreserveTopology(geom, DISPLAY_SIMPLIFY_DEGREES) (map)
    #   RegionPiece  subdivided parts (the spatial join; see below)
    #
    # Serving ``geom`` to the map shipped 9,960 kB of ZIP geometry whose finest
    # detail is 0.2 px on screen -- 21 MB across all six dimensions. Simplifying per
    # request fixed the payload (817 kB) but cost 310 ms on every map load, so it is
    # done once at import instead.
    #
    # Nullable because a region created directly (tests, admin, a script) may not set
    # it; ``region_features`` falls back to ``geom`` in that case.
    #
    # It is NOT derivable from ``RegionPiece``: subdivision clips parts at
    # subdivision boundaries, so reassembling pieces does not reproduce the parent --
    # measured across the imported layers, reuniting a region from its pieces is
    # geometrically equal to the parent for only 334 of 431 regions (23% differ).
    geom_display = MultiPolygonField(srid=4326, null=True, blank=True)

    objects = models.Manager()

    class Meta:
        constraints = [
            # One row per (dimension, code). Makes the loader idempotent and
            # stops a re-import from doubling every count.
            models.UniqueConstraint(fields=["kind", "code"], name="regions_region_kind_code_uniq"),
        ]
        # No explicit index on `kind`: `db_index=True` on the field already
        # creates one, and declaring both produced two identical indexes. The
        # GiST index on `geom` comes from `spatial_index=True` (the default).
        ordering = ["kind", "code"]

    def __str__(self) -> str:
        label = self.name or self.code
        return f"{self.get_kind_display()} {label}"


class RegionPiece(BaseModel):
    """A sub-polygon of a :class:`Region`, sized for fast point lookup.

    ``Region.geom`` is the authoritative boundary: full resolution, used for
    display, area and any geometry the caller actually reads. It is the wrong
    thing to test a point against, though. A single city multipolygon can be
    hundreds of thousands of vertices in one row, so the GiST index hands the
    planner one enormous bounding box that matches nearly every point in Los
    Angeles and the real work happens in the vertex recheck.

    PostGIS's own guidance is to pre-condition geometry this way: *"By chopping
    up objects, while retaining a reference back to the original table via a
    primary key, you can effectively 'normalize' your geometries into a more
    homogeneous object size, for faster spatial searching. Users universally
    report good results from pre-conditioning their geometry in this way."*
    (https://postgis.net/documentation/faq/big-objects-performance/)

    Measured on the real LA layers, 20,000 interactions, identical query shape on
    both sides (including the tie-break, which an earlier comparison of mine got
    wrong), warm cache, three runs:

        dimension                 full boundary    subdivided
        supervisorial_district      9,153 ms        556 ms     (16x)
        spa                         4,867 ms        601 ms      (8x)
        city                        2,871 ms        723 ms      (4x)
        coc                         1,264 ms        578 ms      (2x)
        zip                           836 ms        887 ms      (-6%)
        council_district              592 ms        614 ms      (-4%)

    The shape of the result is the point: subdivision buys an order of magnitude
    for the dimensions with a few very large boundaries, and costs a few percent
    for the ones already made of many small polygons — a ZIP polygon's bounding box
    is already tight, so splitting it adds pieces without adding discrimination.

    It is applied uniformly because the failing case is the tail, not the median:
    an API whose slowest dimension takes nine seconds is unusable, and the price of
    protecting it is single-digit percent elsewhere on a query that finishes in
    under a second either way. If that trade ever stops being worth it, gate
    ``build_region_pieces`` on region size — the rollup needs no change, because a
    region with one piece behaves identically to a region with many.

    Every region has at least one piece, including small ones, so the lookup is a
    single uniform join rather than a "pieces if present, else the parent"
    special case. Simple regions get one piece that is a copy of the boundary;
    the duplication is a few hundred bytes and buys a query with no branches.

    Subdivision is gated on complexity: a layer of small boundaries would only
    multiply rows, since there is little bounding-box area to reclaim. The LA
    layers are all far above the threshold, so in practice every dimension here
    is chopped.
    """

    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="pieces")
    # Denormalised from the parent so a lookup can filter to one dimension without
    # joining Region first. ``import_regions`` is the only writer: it deletes and
    # recreates a whole dimension, so pieces cascade and are rebuilt from the same
    # source row. Nothing else writes this table, so a piece cannot disagree with
    # its parent's ``kind``.
    #
    # Known gap: updating an existing region's ``geom`` or ``kind`` does not rebuild
    # its pieces, so the rollup keeps using the old geometry. Re-run
    # ``import_regions`` for that dimension, or call ``build_region_pieces``.
    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    geom = MultiPolygonField(srid=4326)

    class Meta:
        # No explicit indexes: `region` is covered by the FK index, `kind` by
        # `db_index`, and the GiST index on `geom` comes from
        # `spatial_index=True` — that last one is what the point lookup uses.
        pass

    def __str__(self) -> str:
        return f"piece of {self.region_id}"


class LocationRegion(BaseModel):
    """Which region each location falls in, per dimension — resolved once, not per query.

    The rollup used to work out "which region contains this point" on every read, in
    a ``LATERAL`` join against :class:`RegionPiece`. That is correct but it puts a
    spatial operation in the read path, which means the report query cannot be
    expressed in the ORM and its cost scales with the *notes* in range rather than the
    locations they belong to.

    Resolving the assignment once and storing it turns the rollup into an ordinary
    join, which is both simpler and faster: measured on the real layers at 120,000
    notes across the six dimensions, 410-894 ms here against 781-1,312 ms for the
    live spatial join. It is also the only way the read path can be plain ORM, since
    Django cannot express ``LATERAL``.

    ``region`` is nullable **on purpose**: NULL means "resolved, and this location is
    in no region of this dimension". That is a real answer — a Beverly Hills address
    has no LA city council district — and recording it is what lets the resolver tell
    "already worked out, outside everything" apart from "not worked out yet" without
    re-running the spatial join to find out which it is.

    Cost of the trade: this is derived state, so it has to be rebuilt when boundaries
    change (``import_regions`` does it) and when a location moves (``ensure_location_regions``
    fills gaps). That obligation is the price of the simpler, faster read.
    """

    location = models.ForeignKey("common.Location", on_delete=models.CASCADE, related_name="region_assignments")
    # Denormalised from the region so a lookup filters to one dimension without
    # joining first, the same way RegionPiece does it, and for the same reason.
    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True, blank=True, related_name="assignments")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "kind"], name="unique_location_kind_assignment"),
        ]

    def __str__(self) -> str:
        return f"{self.kind} for location {self.location_id}"
