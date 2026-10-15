"""``load_report_test_data --with-locations``.

The flag exists so a reviewer can see the region report with something in it: without points
every interaction lands in the "No location recorded" bucket and the rollup, map and heatmap all
come up empty.

Which makes the *opt-in* half the part worth pinning. This command also seeds the CSV export and
the chart rollups, and those have no use for coordinates — so a default that placed them would
quietly change what they see.
"""

from __future__ import annotations

from typing import Any

from django.contrib.gis.geos import Point
from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker
from organizations.models import Organization

from accounts.models import User
from accounts.signals import TEST_ORG_NAME
from common.models import Location
from notes.models import Note
from reports.management.commands.load_report_test_data import SAMPLE_POINTS


class LoadReportTestDataLocationsTestCase(TestCase):
    def setUp(self) -> None:
        # `test_org` is provisioned by a post_migrate signal whenever IS_LOCAL_DEV is on, which
        # it is in the local compose environment — and that is how the command finds it for real.
        # Created here only when that signal did not run, so the test holds either way.
        self.org = Organization.objects.filter(name=TEST_ORG_NAME).first() or baker.make(
            Organization, name=TEST_ORG_NAME
        )
        self.user = baker.make(User)
        self.org.add_user(self.user)

    def _run(self, *args: str) -> None:
        call_command("load_report_test_data", "--notes", "20", *args, verbosity=0)

    def _notes(self) -> Any:
        return Note.objects.filter(organization=self.org)

    def test_notes_carry_no_location_by_default(self) -> None:
        """Placing points by default would change the CSV export and the chart rollups."""
        self._run()

        self.assertEqual(self._notes().count(), 20)
        self.assertFalse(
            self._notes().filter(location__isnull=False).exists(),
            "a default that places points changes what the report's other consumers see",
        )

    def test_with_locations_places_nine_notes_in_ten(self) -> None:
        """The tenth is deliberate: 'No location recorded' is a bucket the report must show."""
        self._run("--with-locations")

        self.assertEqual(self._notes().filter(location__isnull=False).count(), 18)
        self.assertEqual(self._notes().filter(location__isnull=True).count(), 2)

    def test_placed_notes_use_the_reviewed_sample_points(self) -> None:
        """Not arbitrary coordinates — the set is chosen so every dimension has spread.

        Includes places outside LA city limits, which is what exercises the unassigned buckets.
        """
        self._run("--with-locations")

        used = {
            (round(location.point.x, 4), round(location.point.y, 4))
            for location in Location.objects.filter(notes__organization=self.org)
        }
        reviewed = {(round(lon, 4), round(lat, 4)) for lon, lat in SAMPLE_POINTS}

        self.assertTrue(used, "no locations were created")
        self.assertLessEqual(used, reviewed, f"locations outside the reviewed set: {used - reviewed}")

    def test_the_sample_points_are_distinct(self) -> None:
        """A duplicate would silently reduce the spread the set exists to provide."""
        self.assertEqual(len(set(SAMPLE_POINTS)), len(SAMPLE_POINTS))
        for lon, lat in SAMPLE_POINTS:
            Point(lon, lat, srid=4326)  # raises if a coordinate is out of range
