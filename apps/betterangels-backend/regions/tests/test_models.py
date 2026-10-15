"""Region and RegionPiece storage rules (DEV-2570 / DEV-2604).

These are properties of the schema itself, not of any query: what the uniqueness
constraint permits, and that geometry is stored the way the spatial index needs.
"""

from __future__ import annotations

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from regions.models import Region, RegionKind


def box(coords: tuple[tuple[float, float], ...], srid: int = 4326) -> MultiPolygon:
    return MultiPolygon(Polygon(coords, srid=srid), srid=srid)


BOX_A = ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02))
BOX_B = ((-118.60, 34.30), (-118.48, 34.30), (-118.48, 34.40), (-118.60, 34.40), (-118.60, 34.30))


class RegionModelTestCase(TestCase):
    def test_kind_and_code_are_unique(self) -> None:
        Region.objects.create(kind=RegionKind.CITY, code="Los Angeles", name="LA", geom=box(BOX_A))
        # The atomic() block is what makes the assertion safe: a constraint error
        # poisons the surrounding transaction, and any query afterwards would
        # raise TransactionManagementError rather than the expected result.
        with self.assertRaises(IntegrityError), transaction.atomic():
            Region.objects.create(kind=RegionKind.CITY, code="Los Angeles", name="dupe", geom=box(BOX_B))

    def test_same_code_in_a_different_dimension_is_allowed(self) -> None:
        Region.objects.create(kind=RegionKind.CITY, code="1", name="city", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="district", geom=box(BOX_B))
        self.assertEqual(Region.objects.filter(code="1").count(), 2)

    def test_geometry_is_stored_as_multipolygon_4326(self) -> None:
        region = Region.objects.create(kind=RegionKind.SPA, code="4", name="Metro", geom=box(BOX_A, srid=4326))
        region.refresh_from_db()
        self.assertEqual(region.geom.srid, 4326)
        self.assertEqual(region.geom.geom_type, "MultiPolygon")
