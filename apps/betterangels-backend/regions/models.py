"""Region boundary models (DEV-2570 / DEV-2604).

``MultiPolygonField`` in EPSG:4326, so boundaries join ``Location.point`` with no
per-query reprojection. Geometry rather than geography on purpose: Django's
``within`` lookup appends ``::geometry`` to a geography operand, discarding the GiST
index.
"""

from __future__ import annotations

import strawberry
from django.contrib.gis.db.models import MultiPolygonField
from django.db import models

from common.models import BaseModel

# ~46 m at Los Angeles: below what the map can draw, and it takes the six-dimension
# payload from 21 MB to 817 kB.
DISPLAY_SIMPLIFY_DEGREES = 0.0005

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

    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
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

    # Nullable because a region created directly (tests, admin, a script) may not set
    # it; `region_features` falls back to `geom`. Not derivable from `RegionPiece`:
    # subdivision clips at subdivision boundaries, so reuniting a region from its
    # pieces equals the parent for only 334 of 431.
    geom_display = MultiPolygonField(srid=4326, null=True, blank=True)

    objects = models.Manager()

    class Meta:
        constraints = [
            # Makes the loader idempotent.
            models.UniqueConstraint(fields=["kind", "code"], name="regions_region_kind_code_uniq"),
        ]
        # No explicit index on `kind`: `db_index=True` already creates one, and
        # declaring both produced two identical indexes. The GiST index on `geom` is
        # `spatial_index=True`, the default.
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

    Measured on the real LA layers, 20,000 interactions, identical query shape both
    sides, warm cache, three runs:

        dimension                 full boundary    subdivided
        supervisorial_district      9,153 ms        556 ms     (16x)
        spa                         4,867 ms        601 ms      (8x)
        city                        2,871 ms        723 ms      (4x)
        coc                         1,264 ms        578 ms      (2x)
        zip                           836 ms        887 ms      (-6%)
        council_district              592 ms        614 ms      (-4%)

    Subdivision buys an order of magnitude where a dimension has a few very large
    boundaries and costs a few percent where it is already many small polygons — a
    ZIP's bounding box is already tight, so splitting it adds pieces without adding
    discrimination. It is applied uniformly because the failing case is the tail: a
    nine-second dimension makes the API unusable, and the price of protecting it is
    single-digit percent elsewhere. Gate it on region size if that ever changes.

    Every region gets at least one piece, including simple ones, so the lookup is one
    uniform join with no "pieces if present, else parent" branch. The duplication is
    a few hundred bytes.
    """

    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="pieces")
    # Denormalised from the parent so a lookup filters to one dimension without
    # joining Region. `import_regions` is the only writer, so a piece cannot
    # disagree with its parent's `kind`.
    #
    # Known gap: changing an existing region's `geom` or `kind` does not rebuild its
    # pieces, so the rollup keeps the old geometry. Re-run `import_regions`, or call
    # `build_region_pieces` for that dimension.
    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    geom = MultiPolygonField(srid=4326)

    class Meta:
        # The FK covers `region`, `db_index` covers `kind`, and the GiST index on
        # `geom` is the default — see the note on `Region.Meta`.
        pass

    def __str__(self) -> str:
        return f"piece of {self.region_id}"


class LocationRegion(BaseModel):
    """Which region each location falls in, per dimension — resolved once, not per query.

    Storing the answer turns the rollup into an ordinary indexed join. Django cannot
    express the ``LATERAL`` spatial join it replaces, so this is also what lets the
    read path be plain ORM.

    ``region`` is nullable **on purpose**: NULL means "resolved, and in no region of
    this dimension" — a real answer, since a Beverly Hills address has no LA city
    council district. Recording it is what tells "already resolved, outside
    everything" apart from "not resolved yet".

    Derived state, so it is rebuilt when boundaries change (``import_regions``) and
    ``ensure_location_regions`` fills gaps for locations created since.
    """

    location = models.ForeignKey("common.Location", on_delete=models.CASCADE, related_name="region_assignments")
    # Denormalised from Region, as on RegionPiece, and for the same reason.
    kind = models.CharField(max_length=32, choices=RegionKind.choices, db_index=True)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True, blank=True, related_name="assignments")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["location", "kind"], name="unique_location_kind_assignment"),
        ]

    def __str__(self) -> str:
        return f"{self.kind} for location {self.location_id}"
