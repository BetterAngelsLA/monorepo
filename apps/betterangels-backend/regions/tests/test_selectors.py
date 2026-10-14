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
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from notes.models import Note
from regions.models import Region, RegionKind
from regions.selectors import (
    available_kinds,
    interaction_density,
    interaction_points,
    region_counts,
    region_features,
    region_totals_without_boundaries,
)

from .helpers import assign_locations

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

    def _note_at(
        self,
        lon: float = 0.0,
        lat: float = 0.0,
        *,
        when: datetime | None = None,
        location: bool = True,
    ) -> Note:
        """A note in this org. ``lon``/``lat`` are ignored when ``location`` is False.

        Assignments are rebuilt here, after the location exists, because the rollup
        reads them rather than doing the spatial join itself.
        """
        note = baker.make(
            Note,
            organization=self.org,
            interacted_at=when or datetime(2026, 1, 15, tzinfo=UTC),
            location=None if not location else baker.make(Location, point=Point(lon, lat, srid=4326)),
        )
        if location:
            assign_locations()
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
        self._note_at(location=False)
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
        rows = region_features(kinds=[RegionKind.SPA], codes=["4"])
        self.assertEqual([row["code"] for row in rows], ["4"])

    def test_region_features_unknown_code_returns_nothing(self) -> None:
        self.assertEqual(region_features(kinds=[RegionKind.SPA], codes=["nope"]), [])


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


class RegionReconciliationTestCase(TestCase):
    """The rollup must not silently lose interactions.

    Three shapes of note can exist, and the report claims nothing is dropped.
    All three are exercised here, and the buckets are asserted to sum to the
    total number of notes in range — the property a client relies on when it
    renders an "Unassigned" slice next to the KPI row.

    A fourth shape — a ``Location`` row whose ``point`` is NULL — is deliberately
    absent because it is impossible: ``common.Location.point`` is declared
    non-null and the database enforces it, so the INSERT itself is rejected. That
    is also why ``region_counts`` carries no ``point IS NOT NULL`` guard: it
    would be unreachable. (An earlier revision had one; this test is what showed
    it could never fire.)
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        when = datetime(2026, 1, 15, tzinfo=UTC)

        # (a) a point inside a region
        baker.make(
            Note,
            organization=self.org,
            interacted_at=when,
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )
        # (b) a point outside every region (Beverly Hills has no LA council district)
        baker.make(
            Note,
            organization=self.org,
            interacted_at=when,
            location=baker.make(Location, point=Point(*OUTSIDE, srid=4326)),
        )
        # (c) no location at all — the only "unlocatable" shape the schema allows
        baker.make(Note, organization=self.org, interacted_at=when, location=None)

        # The rollup reads the stored assignment, so resolve the two located notes
        # (the locationless one has nothing to resolve) before asserting anything.
        assign_locations()

    def test_every_note_lands_in_exactly_one_bucket(self) -> None:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT, start=self.start, end=self.end, organization_id=self.org.id
        )
        spatial_total = sum(r["count"] for r in rows)
        locationless = region_totals_without_boundaries(start=self.start, end=self.end, organization_id=self.org.id)

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


class InteractionMapTestCase(TestCase):
    """The pins and density views (DEV-2570 / DEV-2604).

    The properties worth pinning down are the ones a reviewer would not see by
    reading the SQL: that neither view leaks client identity, that org scoping
    actually scopes, that truncation is reported rather than silent, and that the
    two views describe the same interactions so the toggle cannot change the story.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)

    def _note_at(self, lon: float, lat: float, *, org: Any = None, location: bool = True) -> Note:
        return baker.make(
            Note,
            organization=org or self.org,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=None if not location else baker.make(Location, point=Point(lon, lat, srid=4326)),
        )

    def _points(self, **kwargs: Any) -> tuple[list[dict[str, Any]], bool]:
        return interaction_points(start=self.start, end=self.end, organization_id=self.org.id, **kwargs)

    def test_points_are_returned_with_coordinates(self) -> None:
        self._note_at(-118.24, 34.05)
        rows, truncated = self._points()
        self.assertEqual(len(rows), 1)
        self.assertFalse(truncated)
        self.assertAlmostEqual(rows[0]["latitude"], 34.05, places=5)
        self.assertAlmostEqual(rows[0]["longitude"], -118.24, places=5)

    def test_points_carry_no_client_identity(self) -> None:
        """The map answers "where", not "who".

        Asserted as an exact key set rather than spot-checks, so adding a client or
        note field to this selector fails here instead of quietly widening what the
        map exposes.
        """
        self._note_at(-118.24, 34.05)
        rows, _ = self._points()
        self.assertEqual(set(rows[0].keys()), {"latitude", "longitude", "interacted_at"})

    def test_notes_without_a_location_are_absent(self) -> None:
        """A note with no point cannot be pinned, and must not appear as (0, 0)."""
        self._note_at(0, 0, location=False)
        rows, _ = self._points()
        self.assertEqual(rows, [])

    def test_other_organizations_are_excluded(self) -> None:
        self._note_at(-118.24, 34.05)
        self._note_at(-118.24, 34.05, org=self.other_org)
        rows, _ = self._points()
        self.assertEqual(len(rows), 1, "org scoping must exclude the other org's points")

    def test_truncation_is_reported_not_silent(self) -> None:
        for i in range(5):
            self._note_at(-118.24 + i * 0.001, 34.05)
        rows, truncated = self._points(limit=3)
        self.assertEqual(len(rows), 3)
        self.assertTrue(truncated, "hitting the cap must be visible to the caller")

        rows, truncated = self._points(limit=5)
        self.assertEqual(len(rows), 5)
        self.assertFalse(truncated, "exactly at the cap is not truncated")

    def test_limit_is_clamped(self) -> None:
        self._note_at(-118.24, 34.05)
        rows, _ = self._points(limit=10**9)
        self.assertEqual(len(rows), 1)

    def _box_region(self, code: str, box_coords: Any) -> None:
        """This class has no regions by default; the filter tests need one."""
        Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT, code=code, name=f"District {code}", geom=box(box_coords)
        )

    def test_region_codes_narrow_the_points(self) -> None:
        """Filtering by region is the "show me the SPA 4 visits" case.

        Reads the stored assignment, so this is an indexed lookup — and it must
        actually narrow, not silently return everything the way an unwired filter
        would.
        """
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)  # in region "1"
        self._note_at(-118.54, 34.35)  # in region "2"
        self._note_at(*OUTSIDE)  # in neither
        assign_locations()

        rows, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id, region_codes=["1"])
        self.assertEqual(len(rows), 1, "the filter must narrow to the one note in region 1")
        self.assertAlmostEqual(rows[0]["latitude"], 34.05, places=4)
        self.assertAlmostEqual(rows[0]["longitude"], -118.24, places=4)

    def test_region_codes_narrow_the_density_too(self) -> None:
        """Both views must narrow together, or the toggle changes the story."""
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)
        self._note_at(-118.54, 34.35)
        assign_locations()
        cells = interaction_density(start=self.start, end=self.end, organization_id=self.org.id, region_codes=["1"])
        self.assertEqual(sum(c["count"] for c in cells), 1)

    def test_no_region_codes_means_no_filter(self) -> None:
        """Absent filter is not an empty filter — it must not match nothing."""
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)
        self._note_at(-118.54, 34.35)
        assign_locations()
        rows, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id)
        self.assertEqual(len(rows), 2)

    def test_density_aggregates_to_a_grid(self) -> None:
        # two points in one cell (~1km), one in another
        self._note_at(-118.2401, 34.0501)
        self._note_at(-118.2402, 34.0502)
        self._note_at(-118.30, 34.10)
        cells = interaction_density(start=self.start, end=self.end, organization_id=self.org.id)
        counts = sorted(cell["count"] for cell in cells)
        self.assertEqual(counts, [1, 2])
        self.assertEqual(sum(counts), 3)

    def test_the_two_views_describe_the_same_interactions(self) -> None:
        """Toggling pins/density must not change how many interactions there are."""
        for i in range(4):
            self._note_at(-118.24 + i * 0.02, 34.05 + i * 0.02)
        points, _ = self._points()
        cells = interaction_density(start=self.start, end=self.end, organization_id=self.org.id)
        self.assertEqual(len(points), sum(cell["count"] for cell in cells))


class StaleAssignmentTestCase(RegionRollupTestCase):
    """A location created since the last import must still be counted.

    The rollup joins the stored assignment rather than doing the spatial test
    itself, so if it only counted rows already in that table, a location added since
    the last import would be absent from **every** bucket — including the
    outside-everything one. The report would then under-count silently: nothing
    errors, the figures still look plausible, and the total quietly stops
    reconciling against the KPI row.

    ``_note_at_resolved_by_no_one`` is what creates that state: the note has a real
    ``Location`` with a real point, and nothing has written an assignment for it,
    because the normal helper resolves as it goes.
    """

    def _note_at_resolved_by_no_one(self, lon: float, lat: float) -> Note:
        """A note whose ``Location`` exists but has never been assigned."""
        return baker.make(
            Note,
            organization=self.org,
            location=baker.make(Location, point=Point(lon, lat, srid=4326)),
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
        )

    def test_the_rollup_resolves_a_location_it_has_never_seen(self) -> None:
        self._note_at_resolved_by_no_one(-118.24, 34.05)  # inside BOX_A

        counts = self._counts()
        self.assertEqual(counts.get("1"), 1, "a fresh location must land in its region")
        self.assertNotIn(None, counts, "it resolved, so it is not unassigned")

    def test_an_unresolvable_fresh_location_is_still_reported(self) -> None:
        self._note_at_resolved_by_no_one(-118.24, 34.05)  # BOX_A
        self._note_at_resolved_by_no_one(*OUTSIDE)  # no region

        counts = self._counts()
        self.assertEqual(counts.get("1"), 1)
        self.assertEqual(counts.get(None), 1, "the outside note is reported, not dropped")
        self.assertEqual(sum(counts.values()), 2, "buckets must reconcile to the total")

    def test_repeated_reads_do_not_double_count(self) -> None:
        """Resolving on read must be idempotent, or every report inflates."""
        self._note_at_resolved_by_no_one(-118.24, 34.05)

        first = self._counts()
        second = self._counts()
        self.assertEqual(first, second, "a repeated read must not resolve again")
        self.assertEqual(second.get("1"), 1)
