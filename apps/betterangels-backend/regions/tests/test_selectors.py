"""Tests for region rollup and filtering (DEV-2570 / DEV-2604).

These assert the properties the report depends on, not just that SQL runs:

* a point inside a region is counted in it;
* a point in **no** region comes back as an unassigned bucket rather than being
  dropped (a Beverly Hills address has no LA City council district);
* a note with no location at all is still reported, so the regional total can be
  reconciled against the KPI row;
* filtering by code narrows the rollup;
* boundaries are served as GeoJSON with the right SRID.

Boundaries are created directly rather than downloaded: the importer's network
behaviour is not what these tests are about, and a unit test must not depend on
an external service.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db.utils import IntegrityError
from django.test import TestCase
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from notes.models import Note
from regions.models import Region, RegionKind
from regions.selectors import (
    available_kinds,
    region_counts,
    region_features,
    region_totals_without_boundaries,
)

# Two disjoint boxes: "A" around downtown LA, "B" well to the north-west.
BOX_A = ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02))
BOX_B = ((-118.60, 34.30), (-118.48, 34.30), (-118.48, 34.40), (-118.60, 34.40), (-118.60, 34.30))
# Deliberately outside both, the way Beverly Hills sits outside LA city limits.
OUTSIDE = (-118.41, 34.07)


def box(coords: tuple[tuple[float, float], ...], srid: int = 4326) -> MultiPolygon:
    return MultiPolygon(Polygon(coords, srid=srid), srid=srid)


class RegionRollupTestCase(TestCase):
    def setUp(self) -> None:
        self.a = Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        self.b = Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="2", name="District 2", geom=box(BOX_B))
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        self.org = organization_recipe.make()

    def _note_at(self, lon: float, lat: float, *, when: datetime | None = None, location: bool = True) -> Note:
        note = baker.make(
            Note,
            organization=self.org,
            interacted_at=when or datetime(2026, 1, 15, tzinfo=UTC),
            location=None if not location else baker.make(Location, point=Point(lon, lat, srid=4326)),
        )
        return note

    def _counts(self, **kwargs: Any) -> dict[str | None, int]:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id, **kwargs
        )
        return {row["code"]: row["count"] for row in rows}

    def test_point_inside_a_region_is_counted_in_it(self) -> None:
        self._note_at(-118.24, 34.05)
        self._note_at(-118.24, 34.06)
        self.assertEqual(self._counts()["1"], 2)

    def test_point_outside_every_region_is_reported_as_unassigned(self) -> None:
        self._note_at(*OUTSIDE)
        counts = self._counts()
        self.assertIn(None, counts, "a point in no region must not be dropped")
        self.assertEqual(counts[None], 1)

    def test_points_are_attributed_to_the_right_region(self) -> None:
        self._note_at(-118.24, 34.05)  # A
        self._note_at(-118.54, 34.35)  # B
        self._note_at(*OUTSIDE)  # neither
        counts = self._counts()
        self.assertEqual(counts["1"], 1)
        self.assertEqual(counts["2"], 1)
        self.assertEqual(counts[None], 1)

    def test_filtering_by_code_narrows_the_rollup(self) -> None:
        self._note_at(-118.24, 34.05)  # A
        self._note_at(-118.54, 34.35)  # B
        counts = self._counts(codes=["2"])
        self.assertEqual(counts, {"2": 1})

    def test_notes_outside_the_date_range_are_excluded(self) -> None:
        self._note_at(-118.24, 34.05, when=datetime(2025, 12, 31, tzinfo=UTC))
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id
        )
        self.assertEqual(rows, [])

    def test_another_orgs_notes_are_excluded(self) -> None:
        other = organization_recipe.make()
        baker.make(
            Note,
            organization=other,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id
        )
        self.assertEqual(rows, [])

    def test_note_without_a_location_is_counted_separately(self) -> None:
        """A locationless note is invisible to a spatial join, so it is reported apart."""
        self._note_at(0, 0, location=False)
        self._note_at(-118.24, 34.05)
        self.assertEqual(
            region_totals_without_boundaries(start=self.start, end=self.end, organization_id=self.org.id), 1
        )
        # ...and the spatial rollup sees only the one that has a point.
        self.assertEqual(self._counts()["1"], 1)

    def test_unrelated_dimension_is_not_counted(self) -> None:
        Region.objects.create(kind=RegionKind.SPA, code="4", name="Metro", geom=box(BOX_A))
        self._note_at(-118.24, 34.05)
        rows = region_counts(kind=RegionKind.SPA, start=self.start, end=self.end, organization_id=self.org.id)
        self.assertEqual({r["code"]: r["count"] for r in rows}, {"4": 1})


class RegionMetadataTestCase(TestCase):
    def setUp(self) -> None:
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.SPA, code="4", name="Metro", geom=box(BOX_B))

    def test_available_kinds_reports_only_loaded_dimensions(self) -> None:
        self.assertEqual(sorted(available_kinds()), ["council_district", "spa"])

    def test_region_features_returns_geojson(self) -> None:
        rows = region_features(kinds=[RegionKind.SPA])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["code"], "4")
        # ST_AsGeoJSON gives a geometry object; the schema serialises it.
        geometry = rows[0]["geometry"]
        self.assertIn("coordinates", geometry if isinstance(geometry, dict) else {})

    def test_region_features_can_filter_by_code(self) -> None:
        self.assertEqual(region_features(kinds=[RegionKind.SPA], codes=["nope"]), [])


class RegionModelTestCase(TestCase):
    def test_kind_and_code_are_unique(self) -> None:
        Region.objects.create(kind=RegionKind.CITY, code="Los Angeles", name="LA", geom=box(BOX_A))
        with self.assertRaises(IntegrityError):
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


class RegionReconciliationTestCase(TestCase):
    """The rollup must not silently lose interactions.

    Three shapes of note can exist, and the report claims nothing is dropped.
    All three are exercised here, and the buckets are asserted to sum to the
    total number of notes in range — the property a client relies on when it
    renders an "Unassigned" slice next to the KPI row.

    A fourth shape — a ``Location`` row whose ``point`` is NULL — is deliberately
    absent because it is impossible: ``common.Location.point`` is declared
    non-null, so the database rejects it. ``region_counts`` still guards with
    ``WHERE l.point IS NOT NULL``; that guard is belt-and-braces, not a live path.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        when = datetime(2026, 1, 15, tzinfo=UTC)

        # (a) a point inside a region
        baker.make(Note, organization=self.org, interacted_at=when,
                   location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)))
        # (b) a point outside every region (Beverly Hills has no LA council district)
        baker.make(Note, organization=self.org, interacted_at=when,
                   location=baker.make(Location, point=Point(*OUTSIDE, srid=4326)))
        # (c) no location at all — the only "unlocatable" shape the schema allows
        baker.make(Note, organization=self.org, interacted_at=when, location=None)

    def test_every_note_lands_in_exactly_one_bucket(self) -> None:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id
        )
        spatial_total = sum(r["count"] for r in rows)
        locationless = region_totals_without_boundaries(
            start=self.start, end=self.end, organization_id=self.org.id
        )

        # (a) in a region and (b) outside all of them -> the spatial rollup;
        # (c) with no location -> counted separately.
        self.assertEqual(spatial_total, 2, f"spatial rollup lost a note: {rows}")
        self.assertEqual(locationless, 1, "a note with no location must still be counted")
        self.assertEqual(spatial_total + locationless, 3, "buckets must reconcile to the total")

    def test_only_the_region_counted_note_is_assigned(self) -> None:
        """Exactly one note sits in district 1; the others must not be attributed to it."""
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id
        )
        assigned = {r["code"]: r["count"] for r in rows if r["code"] is not None}
        self.assertEqual(assigned, {"1": 1})
