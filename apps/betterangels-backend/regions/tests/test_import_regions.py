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
