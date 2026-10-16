"""Region and RegionPiece storage rules (DEV-2570 / DEV-2604).

These are properties of the schema itself, not of any query: what the uniqueness
constraint permits, which spatial indexes exist, and that geometry is stored the way
the spatial index needs.
"""

from __future__ import annotations

from django.db import connection, transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from regions.models import Region, RegionKind

from .helpers import BOX_A, BOX_B, box


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

    def test_an_invalid_geometry_is_rejected_by_the_database(self) -> None:
        """The CHECK is what keeps one bad row from taking out a whole dimension's tiles.

        ``ST_Covers`` tolerates invalid geometry, so the rollup would not notice; ``ST_AsMVTGeom``
        and ``ST_Intersection`` are not tolerant, and the tile path reads this table. A bowtie
        ring is the smallest self-intersection that proves the constraint fires.
        """
        bowtie = ((0.0, 0.0), (1.0, 1.0), (1.0, 0.0), (0.0, 1.0), (0.0, 0.0))
        with self.assertRaises(IntegrityError), transaction.atomic():
            Region.objects.create(kind=RegionKind.CITY, code="bowtie", name="invalid", geom=box(bowtie))


class RegionIndexTestCase(TestCase):
    """The spatial indexes the app's read paths depend on, asserted structurally.

    A migration is the only place these can go wrong silently: dropping the generated column's
    index in ``0002`` is exactly what happened once, and no query-level test could tell.
    """

    @staticmethod
    def _gist_indexes() -> list[str]:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT indexdef FROM pg_indexes WHERE tablename = 'regions_region' AND indexdef ILIKE '%USING gist%'"
            )
            return [row[0] for row in cursor.fetchall()]

    def test_geom_display_has_a_gist_index(self) -> None:
        """The boundary tile's ``geom_display && <envelope>`` predicate needs one."""
        definitions = self._gist_indexes()
        self.assertTrue(
            any("(geom_display)" in definition for definition in definitions),
            f"no GiST index on regions_region.geom_display: {definitions}",
        )

    def test_geom_has_no_gist_index(self) -> None:
        """Deliberate: no read puts a spatial predicate on the full-resolution column.

        The tiles read ``geom_display`` and the point lookup reads ``RegionPiece.geom``; an
        index on ``geom`` would only be rebuilt on every import.
        """
        definitions = self._gist_indexes()
        self.assertFalse(
            any("(geom)" in definition for definition in definitions),
            f"regions_region.geom is not queried spatially but carries an index: {definitions}",
        )
