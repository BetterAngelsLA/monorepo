"""Region boundary models (DEV-2570 / DEV-2604).

A ``Region`` is one polygon of one geographic dimension — a council district, a
ZCTA, a city, an SPA. Interactions already carry a point (``Note.location`` →
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
from django.db import connection, models
from django.db.utils import OperationalError, ProgrammingError


# Subdivision is gated: only regions above the threshold are chopped.
SUBDIVIDE_VERTEX_THRESHOLD = 2000
# Passed to ST_Subdivide as the target size, NOT a guaranteed ceiling. The PostGIS
# docs say it cuts with rectilinear lines so each part holds "no more than
# max_vertices", but a compact ring with more vertices than the target cannot be
# cut smaller — measured output here reaches ~1,900 vertices on the heavy layers.
# The win is smaller *bounding boxes*, which is what the GiST index scans. It is
# not a vertex cap; do not describe it as one.
SUBDIVIDE_MAX_VERTICES = 256

# One INSERT that gives every region at least one piece: subdivided when the
# boundary is complex, copied whole when it is not. Set-returning ST_Subdivide is
# why this is SQL and not Python.
_BUILD_PIECES_SQL = """
INSERT INTO regions_regionpiece (region_id, kind, geom)
SELECT r.id, r.kind,
       ST_Multi(CASE WHEN ST_NPoints(r.geom) > %(threshold)s THEN p.geom ELSE r.geom END)
FROM regions_region r
LEFT JOIN LATERAL ST_Subdivide(r.geom, %(max_vertices)s) AS p(geom)
       ON ST_NPoints(r.geom) > %(threshold)s
WHERE %(kind)s IS NULL OR r.kind = %(kind)s
"""


def build_region_pieces(*, kind: str | None = None) -> int:
    """(Re)build the lookup geometry for one dimension, or all of them.

    Called by ``import_regions`` after it replaces a dimension, and by
    ``Region.save`` when a region has no pieces yet — without that second caller a
    region created through the ORM is silently invisible to the rollup, which is a
    trap rather than a design.
    """
    with connection.cursor() as cursor:
        cursor.execute(
            _BUILD_PIECES_SQL,
            {"kind": kind, "threshold": SUBDIVIDE_VERTEX_THRESHOLD, "max_vertices": SUBDIVIDE_MAX_VERTICES},
        )
        return int(cursor.rowcount or 0)


class RegionKind(models.TextChoices):
    """The geographic dimensions we aggregate by.

    Values are the wire/DB identifiers; they are what the GraphQL enum and the
    loader's ``--kind`` argument both use, so keep them stable.
    """

    ZCTA = "zcta", "ZIP Code Tabulation Area"
    CITY = "city", "City"
    COUNCIL_DISTRICT = "council_district", "City Council District"
    SUPERVISORIAL_DISTRICT = "supervisorial_district", "Supervisorial District"
    SPA = "spa", "Service Planning Area"
    COC = "coc", "Continuum of Care"


class Region(models.Model):
    """One boundary polygon belonging to one geographic dimension."""

    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    # The region's stable identifier within its kind: "13" for council district
    # 13, "90012" for a ZCTA, "CA-600" for a CoC. Text because the formats differ.
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=255, blank=True, default="")
    # Provenance, so a stale boundary set is identifiable after the fact.
    source_url = models.URLField(max_length=1024, blank=True, default="")
    source_vintage = models.CharField(max_length=32, blank=True, default="")

    geom = MultiPolygonField(srid=4326)

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

    def save(self, *args: object, **kwargs: object) -> None:
        """Save, and make sure the row is reachable by the spatial rollup.

        The rollup joins ``RegionPiece``, never ``Region.geom``, so a region with
        no pieces would be silently absent from every count. ``import_regions``
        builds pieces itself (subdividing the heavy boundaries); this covers every
        other writer — tests, the admin, a shell, a future one-off script.

        Guarded two ways: it only fires for a *new* region (so replacing a
        dimension's geometry is the importer's job, not a per-row surprise), and
        it tolerates the table not existing yet, which is the case while
        migrations are still building the app's tables.
        """
        creating = self._state.adding
        super().save(*args, **kwargs)  # type: ignore[arg-type]
        if not creating:
            return
        try:
            build_region_pieces(kind=self.kind)
        except (ProgrammingError, OperationalError):
            # The pieces table does not exist yet (mid-migrate). The importer or a
            # later save will build them.
            pass

    def __str__(self) -> str:
        label = self.name or self.code
        return f"{self.get_kind_display()} {label}"


class RegionPiece(models.Model):
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

    Measured on real LA geometry at 20,000 interactions: the city rollup went
    from 10,560 ms to 375 ms, with identical counts.

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
    # Denormalised from the parent so a lookup can filter to one dimension inside
    # the same index scan, rather than joining Region first and then probing
    # pieces per candidate region. Kept honest by the importer, which writes both
    # from the same source row; ``Region.save`` is not the only writer.
    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    geom = MultiPolygonField(srid=4326)

    class Meta:
        # No explicit indexes: `region` is covered by the FK index, `kind` by
        # `db_index`, and the GiST index on `geom` comes from
        # `spatial_index=True` — that last one is what the point lookup uses.
        pass

    def __str__(self) -> str:
        return f"piece of {self.region_id}"

