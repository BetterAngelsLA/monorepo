from django.contrib.gis.geos import MultiPolygon, Polygon
from django.db import connection, transaction
from django.test import TestCase

from regions.models import Region, RegionKind


class GeneratedColumnTestCase(TestCase):
    def test_the_column_is_generated_by_the_database(self) -> None:
        with connection.cursor() as c:
            c.execute(
                """SELECT is_generated, generation_expression FROM information_schema.columns
                   WHERE table_name = %s AND column_name = %s""",
                ["regions_region", "geom_display"],
            )
            gen, expr = c.fetchone()
        self.assertEqual(gen, "ALWAYS")
        self.assertIn("st_simplifypreservetopology", expr)

    def test_a_region_written_without_it_gets_one(self) -> None:
        """A region created without `geom_display` must still get one.

        The importer does not set it, so `Region.objects.create(geom=...)` is the contract:
        the row has to come back with a simplified display geometry, or every map and tile
        read serves unsimplified geometry.
        """
        ring = [(-118.3, 34.0), (-118.2, 34.0), (-118.2, 34.1), (-118.3, 34.1), (-118.3, 34.0)]
        region = Region.objects.create(
            kind=RegionKind.SPA,
            code="__probe__",
            name="Probe",
            geom=MultiPolygon(Polygon(ring, srid=4326), srid=4326),
        )
        region.refresh_from_db()
        self.assertIsNotNone(region.geom_display)
        self.assertEqual(region.geom_display.srid, 4326)

    def test_editing_the_boundary_updates_the_display_with_no_app_code(self) -> None:
        """The whole point of a generated column: no backfill, no importer involvement."""
        ring = [(-118.3, 34.0), (-118.2, 34.0), (-118.2, 34.1), (-118.3, 34.1), (-118.3, 34.0)]
        region = Region.objects.create(
            kind=RegionKind.SPA,
            code="__probe2__",
            name="Probe",
            geom=MultiPolygon(Polygon(ring, srid=4326), srid=4326),
        )
        before = Region.objects.get(pk=region.pk).geom_display
        with transaction.atomic():
            Region.objects.filter(pk=region.pk).update(
                geom=MultiPolygon(Polygon([(x + 0.5, y) for x, y in ring], srid=4326), srid=4326)
            )
        after = Region.objects.get(pk=region.pk).geom_display
        self.assertNotEqual(before.extent, after.extent, "the display geometry must follow geom")
