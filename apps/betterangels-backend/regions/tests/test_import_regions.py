"""``import_regions`` provenance: a local ``--source`` must not probe the network.

``--source`` exists so a dimension with no service — or an offline machine — can still be
loaded. The publisher's ``copyrightText`` is only meaningful for a file that came *from* that
service, so reading it for a local file is both a misattribution and, with a 60-second timeout,
a minute of stall on every offline run.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from typing import Any
from unittest import mock

from django.core.management.base import CommandError
from django.test import TestCase

from regions.management.commands import import_regions as command_module
from regions.management.commands.import_regions import SOURCES, Command

from .helpers import BOX_A

#: One feature carrying the code/name fields the first configured source reads.
FEATURE_COLLECTION: dict[str, Any] = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"District": "1", "District_Name": "District 1"},
            "geometry": {"type": "Polygon", "coordinates": [[list(point) for point in BOX_A]]},
        }
    ],
}

#: A polygon with no coordinates. GDAL reads this as ``POLYGON EMPTY``, which
#: ``ST_IsValid`` accepts, so only the importer can refuse it.
EMPTY_GEOMETRY: dict[str, Any] = {"type": "Polygon", "coordinates": []}

#: A non-polygonal feature, and the case ``make_valid`` introduces: a GeometryCollection
#: whose only part is a line, from which there is no polygon to extract.
NON_POLYGON_GEOMETRIES: dict[str, dict[str, Any]] = {
    "point": {"type": "Point", "coordinates": [-118.24, 34.05]},
    "line collection": {
        "type": "GeometryCollection",
        "geometries": [{"type": "LineString", "coordinates": [[-118.24, 34.05], [-118.20, 34.10]]}],
    },
}


def _geojson_path(collection: dict[str, Any]) -> Path:
    handle = tempfile.NamedTemporaryFile(suffix=".geojson", mode="w", delete=False, encoding="utf-8")
    with handle:
        json.dump(collection, handle)
    return Path(handle.name)


class ImportRegionsProvenanceTestCase(TestCase):
    def _local_source(self) -> Path:
        handle = tempfile.NamedTemporaryFile(suffix=".geojson", mode="w", delete=False, encoding="utf-8")
        with handle:
            json.dump(FEATURE_COLLECTION, handle)
        return Path(handle.name)

    def test_a_local_source_does_not_probe_the_publisher(self) -> None:
        path = self._local_source()
        try:
            with mock.patch.object(
                command_module,
                "fetch_service_metadata",
                side_effect=AssertionError("a local --source must not call the publisher's endpoint"),
            ):
                written = Command()._ingest(SOURCES[0], path=path, dry_run=True, fetched=False)
        finally:
            path.unlink()
        self.assertEqual(written, 1)

    def test_a_fetched_source_does_read_the_publishers_provenance(self) -> None:
        """The positive control: the metadata call is not simply never made."""
        path = self._local_source()
        try:
            with mock.patch.object(
                command_module,
                "fetch_service_metadata",
                return_value={"attribution": "Publisher", "item_id": "abc"},
            ) as metadata:
                Command()._ingest(SOURCES[0], path=path, dry_run=True, fetched=True)
        finally:
            path.unlink()
        metadata.assert_called_once_with(SOURCES[0])


class ImportRegionsBadGeometryTestCase(TestCase):
    """A feature with no boundary to import aborts the dimension instead of being written.

    ``ST_IsValid('POLYGON EMPTY')`` is true, so ``regions_region_geom_valid`` accepts an
    empty boundary: the region would be stored, cover no point and count nothing, while
    the command reported success. The outcome is a ``CommandError``, which rolls back the
    run's transaction and exits non-zero rather than loading a dimension with a hole in it.
    """

    def _ingest(self, geometry: Any) -> None:
        collection = {
            "type": "FeatureCollection",
            "features": [
                {"type": "Feature", "properties": {"District": "9", "District_Name": "Bad"}, "geometry": geometry}
            ],
        }
        path = _geojson_path(collection)
        try:
            Command()._ingest(SOURCES[0], path=path, dry_run=True, fetched=False)
        finally:
            path.unlink()

    def test_an_empty_polygon_is_refused(self) -> None:
        with self.assertRaises(CommandError) as caught:
            self._ingest(EMPTY_GEOMETRY)
        self.assertIn("council_district code '9'", str(caught.exception))
        self.assertIn("normalises to nothing", str(caught.exception))

    def test_a_non_polygonal_feature_is_refused(self) -> None:
        """The message pins that the *type* check refused it, not the empty/zero-area guard.

        Both refuse a ``Point`` — every non-areal geometry has area 0 — so an assertion that
        only "something raised" would stay green if the type check were deleted.
        """
        with self.assertRaises(CommandError) as caught:
            self._ingest(NON_POLYGON_GEOMETRIES["point"])
        self.assertIn("council_district code '9'", str(caught.exception))
        self.assertIn("unsupported geometry type 'Point'", str(caught.exception))

    def test_a_geometry_collection_without_a_polygonal_part_is_refused(self) -> None:
        """``make_valid`` can widen a broken polygon to a GeometryCollection, so extracting
        the polygonal parts can legitimately come back with nothing to import."""
        with self.assertRaises(CommandError) as caught:
            self._ingest(NON_POLYGON_GEOMETRIES["line collection"])
        self.assertIn("council_district code '9'", str(caught.exception))
        self.assertIn("normalises to nothing", str(caught.exception))
