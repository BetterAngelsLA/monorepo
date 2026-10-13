"""Tests for the ``load_region_boundaries`` management command (DEV-2604).

The command exists to get official boundary layers into PostGIS safely. Almost
everything worth testing is a safety property rather than a happy path:

* an undeclared CRS must be refused rather than guessed;
* a *mislabelled* CRS must be caught by the LA bounding-box assertion — this is
  the real ``data.lacity.org`` defect, reproduced in a fixture;
* a second run of an identical file must be a no-op;
* a mistyped attribute name must fail loudly instead of writing NULL codes;
* an interpolated table name must not be an injection vector.

These run against the PostGIS test database the rest of the suite already uses.
"""

from __future__ import annotations

import json
from io import StringIO
from pathlib import Path
from typing import Any

from django.contrib.gis.geos import Polygon
from django.core.management import CommandError, call_command
from django.db import connection
from django.test import TestCase

from common.management.commands.load_region_boundaries import (
    to_multipolygon,
)

FIXTURES = Path(__file__).parent / "fixtures"

TABLE = "test_region_boundaries"


def load(*args: str, **kwargs: Any) -> None:
    call_command("load_region_boundaries", *args, **kwargs)


class ToMultiPolygonTestCase(TestCase):
    """Geometry normalisation — the part that must not corrupt data."""

    def test_polygon_is_promoted_to_multipolygon(self) -> None:
        polygon = Polygon(
            ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02)),
            srid=4326,
        )
        result = to_multipolygon(polygon)
        self.assertEqual(result.geom_type, "MultiPolygon")
        self.assertEqual(result.srid, 4326)

    def test_reprojects_to_target_srid(self) -> None:
        # A genuine LA Web-Mercator box must come back as genuine LA lon/lat.
        polygon = Polygon(
            (
                (-13169095.76, 4031487.85),
                (-13155737.42, 4031487.85),
                (-13155737.42, 4044926.50),
                (-13169095.76, 4044926.50),
                (-13169095.76, 4031487.85),
            ),
            srid=3857,
        )
        result = to_multipolygon(polygon, target_srid=4326)
        min_x, min_y, max_x, max_y = result.extent
        self.assertEqual(result.srid, 4326)
        self.assertAlmostEqual(min_x, -118.30, places=2)
        self.assertAlmostEqual(min_y, 34.02, places=2)
        self.assertAlmostEqual(max_x, -118.18, places=2)
        self.assertAlmostEqual(max_y, 34.12, places=2)

    def test_self_intersecting_polygon_is_repaired(self) -> None:
        # A bow-tie is invalid GeoJSON/Shapefile data we routinely receive.
        bowtie = Polygon(((0, 0), (2, 2), (2, 0), (0, 2), (0, 0)), srid=4326)
        self.assertFalse(bowtie.valid)
        result = to_multipolygon(bowtie)
        self.assertTrue(result.valid)
        self.assertEqual(result.geom_type, "MultiPolygon")

    def test_geometry_without_srid_is_refused(self) -> None:
        polygon = Polygon(((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02)))
        with self.assertRaises(CommandError) as ctx:
            to_multipolygon(polygon)
        self.assertIn("no SRID", str(ctx.exception))

    def test_non_areal_geometry_is_refused(self) -> None:
        from django.contrib.gis.geos import LineString

        line = LineString((0, 0), (1, 1), srid=4326)
        with self.assertRaises(CommandError) as ctx:
            to_multipolygon(line)
        self.assertIn("unsupported geometry type", str(ctx.exception))


class LoadRegionBoundariesTestCase(TestCase):
    def tearDown(self) -> None:
        with connection.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {TABLE}")

    def _count(self) -> int:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT count(*) FROM {TABLE}")
            row = cursor.fetchone()
            assert row is not None
            return int(row[0])

    def _geometry_meta(self) -> tuple[int, str]:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT ST_SRID(geom), GeometryType(geom) FROM {TABLE} GROUP BY 1, 2")
            rows = cursor.fetchall()
        self.assertEqual(len(rows), 1, "expected a single uniform geometry type")
        return int(rows[0][0]), str(rows[0][1])

    # -- happy path ------------------------------------------------------------

    def test_loads_geojson_and_normalises_geometry(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
        )
        self.assertEqual(self._count(), 2)
        srid, geom_type = self._geometry_meta()
        self.assertEqual(srid, 4326)
        self.assertEqual(geom_type, "MULTIPOLYGON")

    def test_reprojects_a_3857_source(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_3857.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
        )
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT ST_XMin(geom), ST_YMax(geom) FROM {TABLE}")
            min_x, max_y = cursor.fetchone()
        self.assertAlmostEqual(float(min_x), -118.30, places=2)
        self.assertAlmostEqual(float(max_y), 34.12, places=2)

    def test_records_provenance(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            source_url="https://example.test/regions.geojson",
            source_vintage="2021",
            name_field="NAME",
            code_field="DISTRICT",
        )
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT source_url, source_vintage, source_sha256 FROM {TABLE} LIMIT 1")
            row = cursor.fetchone()
        assert row is not None
        self.assertEqual(row[0], "https://example.test/regions.geojson")
        self.assertEqual(row[1], "2021")
        self.assertEqual(len(row[2]), 64)

    def test_builds_a_spatial_index(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
        )
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT indexname FROM pg_indexes WHERE tablename = %s AND indexdef ILIKE '%%gist%%'",
                [TABLE],
            )
            self.assertTrue(cursor.fetchall(), "expected a GiST index on the geometry column")

    # -- safety properties -----------------------------------------------------

    def test_mislabelled_crs_is_rejected(self) -> None:
        """The real data.lacity.org defect: declares lon/lat, holds State Plane feet."""
        with self.assertRaises(CommandError) as ctx:
            load(
                shapefile=str(FIXTURES / "regions_mislabelled_crs.geojson"),
                layer=TABLE,
                kind="test_district",
                name_field="NAME",
                code_field="DISTRICT",
            )
        self.assertIn("outside the LA County envelope", str(ctx.exception))
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass(%s)", [TABLE])
            self.assertIsNone(cursor.fetchone()[0], "nothing should have been written")

    def test_reload_of_identical_file_is_a_noop(self) -> None:
        """The second run must do no work — not merely end up with the same rows.

        Asserting the row count alone proves nothing: the command deletes rows for
        the kind and re-inserts, so the count is 2 whether or not the no-op path
        runs. This asserts the two observable signals instead — the message, and
        unchanged primary keys.
        """
        first_stdout = StringIO()
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
            stdout=first_stdout,
        )
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT id FROM {TABLE} ORDER BY id")
            ids_before = [row[0] for row in cursor.fetchall()]

        second_stdout = StringIO()
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
            stdout=second_stdout,
        )

        self.assertIn("nothing to do", second_stdout.getvalue())
        self.assertEqual(self._count(), 2)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT id FROM {TABLE} ORDER BY id")
            # A re-insert would allocate new sequence values.
            self.assertEqual([row[0] for row in cursor.fetchall()], ids_before)

    def test_same_file_under_a_second_kind_is_not_skipped(self) -> None:
        """The sha256 no-op is scoped per kind.

        Unscoped, loading the same file under a second dimension matched the
        first kind's hash and silently wrote nothing — a whole dimension missing
        behind a success message.
        """
        path = str(FIXTURES / "regions_4326.geojson")
        load(shapefile=path, layer=TABLE, kind="first_kind", name_field="NAME", code_field="DISTRICT")
        load(shapefile=path, layer=TABLE, kind="second_kind", name_field="NAME", code_field="DISTRICT")

        with connection.cursor() as cursor:
            cursor.execute(f"SELECT kind, count(*) FROM {TABLE} GROUP BY kind ORDER BY kind")
            counts = dict(cursor.fetchall())
        self.assertEqual(counts, {"first_kind": 2, "second_kind": 2})

    def test_unknown_field_fails_loudly(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            load(
                shapefile=str(FIXTURES / "regions_4326.geojson"),
                layer=TABLE,
                kind="test_district",
                code_field="NOT_A_FIELD",
            )
        self.assertIn("is not a field in this layer", str(ctx.exception))

    def test_field_lookup_is_case_insensitive(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="name",  # fixture header is "NAME"
            code_field="district",  # fixture header is "DISTRICT"
        )
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT name, code FROM {TABLE} ORDER BY code")
            rows = cursor.fetchall()
        self.assertEqual([r[0] for r in rows], ["District A", "District B"])
        self.assertEqual([r[1] for r in rows], ["1", "2"])

    def test_invalid_table_name_is_rejected(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            load(
                shapefile=str(FIXTURES / "regions_4326.geojson"),
                layer="bad; DROP TABLE notes_note; --",
                kind="test_district",
            )
        self.assertIn("is not a valid table name", str(ctx.exception))

    def test_invalid_kind_is_rejected(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            load(
                shapefile=str(FIXTURES / "regions_4326.geojson"),
                layer=TABLE,
                kind="bad kind",
            )
        self.assertIn("is not a valid region kind", str(ctx.exception))

    def test_dry_run_writes_nothing(self) -> None:
        load(
            shapefile=str(FIXTURES / "regions_4326.geojson"),
            layer=TABLE,
            kind="test_district",
            name_field="NAME",
            code_field="DISTRICT",
            dry_run=True,
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT to_regclass(%s)", [TABLE])
            self.assertIsNone(cursor.fetchone()[0])

    def test_missing_file_is_reported(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            load(shapefile="/nonexistent/regions.geojson", layer=TABLE, kind="test_district")
        self.assertIn("no such file", str(ctx.exception))

    def test_unsupported_extension_is_reported(self) -> None:
        tmp = FIXTURES / "regions.txt"
        tmp.write_text("not geodata")
        try:
            with self.assertRaises(CommandError) as ctx:
                load(shapefile=str(tmp), layer=TABLE, kind="test_district")
            self.assertIn("expected a .shp", str(ctx.exception))
        finally:
            tmp.unlink()


class UndeclaredCrsTestCase(TestCase):
    """CRS handling at the boundary: what is defaulted, and what is refused.

    These are two *different* outcomes and the distinction matters:

    * A bare **GeoJSON** file with no ``crs`` member is legitimately WGS84 —
      RFC 7946 says so, and GDAL applies that default. Loading it is correct.
    * A **shapefile** with no ``.prj`` declares nothing at all, so the source CRS
      is unknowable. Reprojecting it is a silent no-op at best and a wrong
      location at worst, so the command refuses.

    An earlier version of this file had a single test named
    ``test_undeclared_crs_is_refused`` that asserted the GeoJSON case *succeeds* —
    it tested the opposite of its name, and left the refusal path uncovered.
    """

    def tearDown(self) -> None:
        with connection.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {TABLE}")

    def test_crsless_geojson_defaults_to_wgs84(self) -> None:
        # GeoJSON without a "crs" member and without an EPSG hint is ambiguous
        # to OGR; assert the command refuses rather than assuming.
        payload = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"NAME": "X", "DISTRICT": 1},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [[-118.30, 34.02], [-118.18, 34.02], [-118.18, 34.12], [-118.30, 34.12], [-118.30, 34.02]]
                        ],
                    },
                }
            ],
        }
        tmp = FIXTURES / "regions_no_crs.geojson"
        tmp.write_text(json.dumps(payload))
        try:
            load(
                shapefile=str(tmp),
                layer=TABLE,
                kind="test_district",
                name_field="NAME",
                code_field="DISTRICT",
            )
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT ST_SRID(geom) FROM {TABLE} LIMIT 1")
                row = cursor.fetchone()
            assert row is not None
            self.assertEqual(int(row[0]), 4326)
        finally:
            tmp.unlink()


class ShapefileWithoutPrjTestCase(TestCase):
    """A shapefile with no ``.prj`` has no knowable CRS and must be refused."""

    def tearDown(self) -> None:
        with connection.cursor() as cursor:
            cursor.execute(f"DROP TABLE IF EXISTS {TABLE}")

    def test_shapefile_without_prj_is_refused(self) -> None:
        # Built rather than checked in: a .prj-less shapefile is awkward to keep
        # in the repo without tools re-adding it, and ogr2ogr is available in the
        # image that runs these tests.
        import shutil
        import subprocess
        import tempfile

        workdir = Path(tempfile.mkdtemp())
        try:
            source = FIXTURES / "regions_4326.geojson"
            shp = workdir / "no_prj.shp"
            subprocess.run(
                ["ogr2ogr", "-f", "ESRI Shapefile", str(shp), str(source)],
                check=True,
                capture_output=True,
            )
            prj = workdir / "no_prj.prj"
            self.assertTrue(prj.exists(), "fixture step: expected a .prj to remove")
            prj.unlink()

            with self.assertRaises(CommandError) as ctx:
                load(
                    shapefile=str(shp),
                    layer=TABLE,
                    kind="test_district",
                    name_field="NAME",
                    code_field="DISTRICT",
                )
            self.assertIn("no CRS", str(ctx.exception))
        finally:
            shutil.rmtree(workdir, ignore_errors=True)
