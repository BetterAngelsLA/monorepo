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
from django.db import models


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

    def __str__(self) -> str:
        label = self.name or self.code
        return f"{self.get_kind_display()} {label}"
