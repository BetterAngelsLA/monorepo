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
from django.db import connection, models, transaction
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
       -- COALESCE is load-bearing: ST_Subdivide is set-returning and may yield
       -- ZERO rows for a degenerate ring, and with the LEFT JOIN's ON predicate
       -- true that produces a NULL-extended row which the CASE would select —
       -- inserting NULL into a NOT NULL column. Falling back to the parent
       -- boundary keeps the region visible instead of aborting the import.
       ST_Multi(COALESCE(CASE WHEN ST_NPoints(r.geom) > %(threshold)s THEN p.geom END, r.geom))
FROM regions_region r
LEFT JOIN LATERAL ST_Subdivide(r.geom, %(max_vertices)s) AS p(geom)
       ON ST_NPoints(r.geom) > %(threshold)s
WHERE (%(region_id)s IS NOT NULL AND r.id = %(region_id)s)
   OR (%(region_id)s IS NULL AND (%(kind)s IS NULL OR r.kind = %(kind)s))
"""


def _region_pieces_missing(region_id: int | None = None, kind: str | None = None) -> bool:
    """Whether any in-scope region currently has zero pieces."""
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1 FROM regions_region r
                WHERE ((%(region_id)s IS NOT NULL AND r.id = %(region_id)s)
                    OR (%(region_id)s IS NULL AND (%(kind)s IS NULL OR r.kind = %(kind)s)))
                  AND NOT EXISTS (SELECT 1 FROM regions_regionpiece p WHERE p.region_id = r.id)
            )
            """,
            {"region_id": region_id, "kind": kind},
        )
        row = cursor.fetchone()
    return bool(row and row[0])


def build_region_pieces(*, region_id: int | None = None, kind: str | None = None) -> int:
    """(Re)build the lookup geometry for one region, one dimension, or everything.

    The DELETE-and-INSERT is the whole point: an earlier version was a bare INSERT,
    so calling it repeatedly accumulated duplicates — measured, five regions saved
    one at a time produced 15 piece rows instead of 5, and the count kept growing
    with every save. Counts stayed correct because the rollup's ``LIMIT 1`` dedupes,
    so the damage was silent: a bloating GiST index and a longer per-location sort.

    Prefer ``region_id`` — it is what ``Region.save`` needs, it is O(1) in the
    dimension's size, and rebuilding a whole dimension from a single-row write is
    the quadratic behaviour above. ``kind``/``None`` are for ``import_regions``,
    which has just replaced an entire dimension and must rebuild it once.
    """
    with transaction.atomic(), connection.cursor() as cursor:
        if region_id is not None:
            # Replace this region's pieces only, so the DELETE and the INSERT see
            # the same target set.
            cursor.execute(
                "DELETE FROM regions_regionpiece WHERE region_id = %(region_id)s", {"region_id": region_id}
            )
        elif kind is not None:
            cursor.execute("DELETE FROM regions_regionpiece WHERE kind = %(kind)s", {"kind": kind})
        else:
            cursor.execute("DELETE FROM regions_regionpiece")
        cursor.execute(
            _BUILD_PIECES_SQL,
            {
                "region_id": region_id,
                "kind": kind,
                "threshold": SUBDIVIDE_VERTEX_THRESHOLD,
                "max_vertices": SUBDIVIDE_MAX_VERTICES,
            },
        )
        return int(cursor.rowcount or 0)


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


class Region(models.Model):
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
    # city layer — which is itself worth recording rather than papering over: for
    # those, authority is not evidenced by the service.
    source_attribution = models.TextField(blank=True, default="")
    # The ArcGIS item id, which identifies the exact hosted layer rather than just
    # its URL (URLs get reorganised; item ids do not).
    source_item_id = models.CharField(max_length=64, blank=True, default="")

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
        # Scoped to this row. Rebuilding the whole dimension here was quadratic:
        # N single-row saves produced N(N+1)/2 piece rows.
        #
        # The table may not exist yet while migrations build the app, and catching
        # the resulting ProgrammingError is NOT safe — in PostgreSQL a failed
        # statement aborts the surrounding transaction, so a try/except would
        # leave the caller's transaction dead. Ask the catalog instead.
        if self._pieces_table_exists():
            build_region_pieces(region_id=self.pk)

    @staticmethod
    def _pieces_table_exists() -> bool:
        """Whether ``regions_regionpiece`` is present yet (false mid-migrate)."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass('regions_regionpiece') IS NOT NULL")
            row = cursor.fetchone()
        return bool(row and row[0])

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
    # joining Region first. Two writers keep it consistent — ``import_regions``
    # (which deletes and recreates the whole dimension, so pieces cascade) and
    # ``Region.save`` (which rebuilds this row's pieces on create). Both write
    # ``kind`` from the parent, so they cannot disagree.
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

