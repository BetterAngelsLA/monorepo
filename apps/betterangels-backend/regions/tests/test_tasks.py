"""Tests for the periodic region fill (``regions.tasks``).

The task exists to close a correctness gap, so the test that matters is the *effect*:
a location created since the last import ends up counted by the rollup after the task runs,
and does not before. Asserting only that the task returns a string would pass while the
task did nothing.
"""

from __future__ import annotations

from datetime import UTC, datetime

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from notes.models import Note
from regions.models import LocationRegion, Region, RegionKind
from regions.selectors import region_counts
from regions.tasks import fill_location_regions

BOX_A = ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02))


def box(coords: tuple[tuple[float, float], ...]) -> MultiPolygon:
    return MultiPolygon(Polygon(coords, srid=4326), srid=4326)


class FillLocationRegionsTaskTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))

    def _note_with_unassigned_location(self) -> Note:
        """The state the task is for: a location created after the last import."""
        return baker.make(
            Note,
            organization=self.org,
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
        )

    def _counts(self) -> dict[str | None, int]:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT,
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
        )
        return {row["code"]: row["count"] for row in rows}

    def test_it_fills_a_location_created_since_the_last_import(self) -> None:
        """The gap this task closes: without it the rollup under-counts, silently.

        The precondition is asserted rather than assumed — an unassigned location must be
        invisible to the rollup *first*, or this passes for the wrong reason.
        """
        self._note_with_unassigned_location()
        self.assertEqual(self._counts(), {}, "precondition: an unassigned location is in no bucket")

        fill_location_regions()

        self.assertEqual(self._counts().get("1"), 1, "the task must make the interaction countable")

    def test_it_writes_an_assignment_row(self) -> None:
        """The mechanism, not just the count — an empty ``LocationRegion`` means not filled."""
        self._note_with_unassigned_location()
        self.assertFalse(LocationRegion.objects.exists())

        fill_location_regions()

        self.assertTrue(LocationRegion.objects.filter(kind=RegionKind.COUNCIL_DISTRICT, region__code="1").exists())

    def test_it_is_incremental_and_idempotent(self) -> None:
        """A second run must not re-resolve, rewrite, or double-count.

        The task runs every 15 minutes, so a run that recomputed everything — or added a
        second assignment for the same location — would be a recurring cost and a wrong
        number rather than a one-off mistake.
        """
        self._note_with_unassigned_location()
        fill_location_regions()
        first = LocationRegion.objects.get()

        fill_location_regions()

        self.assertEqual(LocationRegion.objects.count(), 1, "a repeated run must not write a second assignment")
        self.assertEqual(LocationRegion.objects.get().pk, first.pk)
        self.assertEqual(self._counts().get("1"), 1, "and must not double-count")

    def test_it_resolves_nothing_when_there_is_no_dimension_loaded(self) -> None:
        """No regions for a dimension means nothing to resolve, not an error."""
        Region.objects.all().delete()
        self._note_with_unassigned_location()

        result = fill_location_regions()

        self.assertEqual(result, "filled 0 location assignment(s)")
        self.assertFalse(LocationRegion.objects.exists())
