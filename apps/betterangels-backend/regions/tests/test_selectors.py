"""Rollup, unassigned buckets, filtering and boundary serving (DEV-2570 / DEV-2604).

Boundaries are created directly; a unit test must not depend on the importer's network.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import TestCase
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from notes.models import Note
from regions.models import LocationRegion, Region, RegionKind
from regions.selectors import (
    available_kinds,
    interaction_points,
    org_notes_in_range,
    region_counts,
    region_features,
    region_totals_without_boundaries,
    scope_notes_to_regions,
)
from regions.services import ensure_location_regions

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

    def _counts(self, *, kind: str = RegionKind.COUNCIL_DISTRICT.value, **kwargs: Any) -> dict[str | None, int]:
        rows = region_counts(kind=kind, start=self.start, end=self.end, organization_id=self.org.id, **kwargs)
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

    def test_a_note_in_two_dimensions_is_counted_once_in_each(self) -> None:
        """The regression guard for a chained-filter cross-product.

        Django builds a *separate join* per `filter()` on a multi-valued relation, so

            rows.filter(assignments__isnull=False).filter(assignments__kind=kind)

        joins `regions_locationregion` twice and counts the cross-product. A note holding both
        a `council_district` and an `spa` assignment was therefore counted **twice** in the
        `spa` rollup — a bucket reading 2 for one interaction.

        `count(DISTINCT n.id)` hid it. The count is a plain `count` now (it is measurably
        cheaper: 9.7 ms against 23.2 ms on 20k notes), so the predicates have to stay in one
        `filter()`. If someone splits them again, this fails.
        """
        Region.objects.create(kind=RegionKind.SPA, code="4", name="Metro", geom=box(BOX_A))
        self._note_at(*OUTSIDE)  # a note that is in neither region
        self._note_at(-118.24, 34.05)  # in BOX_A: both the council district and the SPA

        counts = self._counts(kind=RegionKind.SPA.value)
        # The named bucket is the assertion that matters. `None` is the OUTSIDE note, which is
        # correctly in no region of this dimension and is reported rather than dropped.
        self.assertEqual(counts.get("4"), 1, "one interaction in two dimensions must count once per dimension")
        self.assertEqual(counts.get(None), 1)

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
        rows = region_counts(
            # `.value`, not the enum member: the selector takes the wire/DB string, and
            # an enum member stringifies to "RegionKind.SPA", which matches no row.
            kind=RegionKind.SPA.value,
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
        )
        self.assertEqual({r["code"]: r["count"] for r in rows}, {"4": 1})
        # The selector always reports the kind, because it is the grouping key and a code
        # alone is ambiguous across dimensions. Blanking it for a single-dimension rollup
        # is `services.region_rollup`'s job, not this layer's.
        self.assertEqual([r["kind"] for r in rows], [RegionKind.SPA.value])


class RegionMetadataTestCase(TestCase):
    def setUp(self) -> None:
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.SPA, code="4", name="Metro", geom=box(BOX_B))

    def test_available_kinds_reports_only_loaded_dimensions(self) -> None:
        self.assertEqual(sorted(available_kinds()), ["council_district", "spa"])

    def test_region_features_returns_multipolygon_coordinates(self) -> None:
        """``geometry`` is the coordinates of a MultiPolygon, at 6 decimal places.

        Asserted on the *shape* rather than by spot-checking a vertex: the contract is
        ``[[[lng, lat], …]]`` for every row regardless of how many parts the polygon has,
        because the column is a MultiPolygon and a single-part result must not change the
        response shape.
        """
        rows = region_features(kinds=[RegionKind.SPA])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["code"], "4")

        coordinates = rows[0]["geometry"]
        self.assertIsInstance(coordinates, tuple, "coordinates, not a GeoJSON document")

        # [[[ (lng, lat), … ]]] — walk to the first coordinate pair.
        ring = coordinates[0][0]
        self.assertEqual(len(ring[0]), 2, "a coordinate is a (lng, lat) pair")
        for lng, lat in ring[:5]:
            self.assertIsInstance(lng, float)
            self.assertIsInstance(lat, float)
            # 6 dp, because the grid is 1e-6: full precision measured 1.58x the payload.
            self.assertLessEqual(len(str(lng).split(".")[-1]), 6)
            self.assertLessEqual(len(str(lat).split(".")[-1]), 6)

    def test_region_features_can_filter_by_code(self) -> None:
        rows = region_features(kinds=[RegionKind.SPA], codes=["4"])
        self.assertEqual([row["code"] for row in rows], ["4"])

    def test_region_features_unknown_code_returns_nothing(self) -> None:
        self.assertEqual(region_features(kinds=[RegionKind.SPA], codes=["nope"]), [])


class RegionReconciliationTestCase(TestCase):
    """The buckets must sum to the notes in range, for all three shapes of note.

    The fourth shape — a ``Location`` with a NULL ``point`` — is impossible:
    ``common.Location.point`` is non-null and the database enforces it, which is why
    ``region_counts`` carries no ``point IS NOT NULL`` guard.
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
    """The pins view (DEV-2570 / DEV-2604).

    The properties asserted here are the ones a reviewer would not see by
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

    def _notes(self, *, org: Any = None) -> Any:
        """The notes in range, through the **same helper the resolver uses**.

        Calls ``org_notes_in_range`` rather than repeating its filter. The previous
        version hand-wrote ``Note.objects.filter(organization=..., interacted_at...``
        while claiming to be "the way the resolver hands them to the selectors" — the
        resolver did *not* filter by org at all, so the org confinement this helper
        appeared to exercise was never the resolver's. Sharing the call keeps the test
        and the resolver from drifting apart again.
        """
        return org_notes_in_range(organization_id=(org or self.org).id, start=self.start, end=self.end)

    def _points(self, **kwargs: Any) -> tuple[list[dict[str, Any]], bool]:
        return interaction_points(
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
            **kwargs,
        )

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

    def test_scoping_by_region_narrows_the_points(self) -> None:
        """Filtering by region is the "show me the SPA 4 visits" case.

        Reads the stored assignment, so it is an indexed semi-join — and it must
        actually narrow, not silently return everything an unwired filter would.
        """
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)  # in region "1"
        self._note_at(-118.54, 34.35)  # in region "2"
        self._note_at(*OUTSIDE)  # in neither
        assign_locations()

        scoped = scope_notes_to_regions(self._notes(), kind=RegionKind.COUNCIL_DISTRICT.value, codes=["1"])
        rows, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id, notes=scoped)
        self.assertEqual(len(rows), 1, "the filter must narrow to the one note in region 1")
        self.assertAlmostEqual(rows[0]["latitude"], 34.05, places=4)
        self.assertAlmostEqual(rows[0]["longitude"], -118.24, places=4)

    def test_no_scoping_means_no_filter(self) -> None:
        """Absent filter is not an empty filter — it must not match nothing."""
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)
        self._note_at(-118.54, 34.35)
        assign_locations()
        rows, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id)
        self.assertEqual(len(rows), 2)

    def test_every_interaction_in_scope_gets_a_point(self) -> None:
        """The heatmap is drawn from these points, so none may be dropped."""
        for i in range(4):
            self._note_at(-118.24 + i * 0.02, 34.05 + i * 0.02)
        points, _ = self._points()
        self.assertEqual(len(points), 4)


class StaleAssignmentTestCase(TestCase):
    """A location created since the last import must still be counted — once filled.

    The rollup joins the stored assignment, so a location with no assignment is absent
    from every bucket. ``_note_at_resolved_by_no_one`` creates that state: a real
    ``Location`` with no assignment.

    **The fill is explicit.** It used to happen inside ``region_counts``, which made a
    read open transactions and INSERT for every location in the database — a selector
    doing a global write (``docs/styleguides/python.md``). The fill now belongs to
    ``manage.py backfill_location_regions`` (same ``ensure_location_regions`` service, and
    ``import_regions``), and the read path tops it up on demand — see
    ``test_a_read_fills_the_gap_it_found``. The alternative was a Celery beat job, which buys
    nothing the incremental fill does not and adds a staleness window.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))

    def _counts(self) -> dict[str | None, int]:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT,
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
        )
        return {row["code"]: row["count"] for row in rows}

    def _note_at_resolved_by_no_one(self, lon: float, lat: float) -> Note:
        """A note whose ``Location`` exists but has never been assigned."""
        return baker.make(
            Note,
            organization=self.org,
            location=baker.make(Location, point=Point(lon, lat, srid=4326)),
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
        )

    def test_a_read_fills_the_gap_it_found(self) -> None:
        """A location created since the last import is counted, because the read fills it.

        This is the contract that replaced "a selector must not write". The write is bounded
        by design — ``ensure_location_regions`` only considers locations with no assignment —
        so the read can do it and forget about it, with no schedule and no staleness window.

        Asserted on the *count*, from a starting state where the assignment genuinely does not
        exist, so it fails if the fill stops happening rather than merely changing shape.
        """
        note = self._note_at_resolved_by_no_one(-118.24, 34.05)
        location_id = note.location_id
        assert location_id is not None  # the helper always sets one

        self.assertFalse(
            LocationRegion.objects.filter(location_id=location_id).exists(),
            "precondition: the location is unresolved before the read",
        )

        self.assertEqual(self._counts().get("1"), 1, "the read must resolve it and count it")

    def test_the_fill_resolves_a_location_it_has_never_seen(self) -> None:
        """The command's service does what the selector used to do on the side."""
        self._note_at_resolved_by_no_one(-118.24, 34.05)  # inside BOX_A

        ensure_location_regions(kind=RegionKind.COUNCIL_DISTRICT)
        counts = self._counts()
        self.assertEqual(counts.get("1"), 1, "a fresh location must land in its region")
        self.assertNotIn(None, counts, "it resolved, so it is not unassigned")

    def test_an_unresolvable_fresh_location_is_still_reported(self) -> None:
        self._note_at_resolved_by_no_one(-118.24, 34.05)  # BOX_A
        self._note_at_resolved_by_no_one(*OUTSIDE)  # no region

        ensure_location_regions(kind=RegionKind.COUNCIL_DISTRICT)
        counts = self._counts()
        self.assertEqual(counts.get("1"), 1)
        self.assertEqual(counts.get(None), 1, "the outside note is reported, not dropped")
        self.assertEqual(sum(counts.values()), 2, "buckets must reconcile to the total")

    def test_repeated_reads_do_not_double_count(self) -> None:
        """The fill is idempotent, so a second read must not inflate the number.

        The read now writes, so this is the failure mode that matters: every report load
        resolving the same location again would double-count it.
        """
        self._note_at_resolved_by_no_one(-118.24, 34.05)

        first = self._counts()
        second = self._counts()
        self.assertEqual(first, second)
        self.assertEqual(second.get("1"), 1)
        self.assertEqual(LocationRegion.objects.filter(kind=RegionKind.COUNCIL_DISTRICT).count(), 1)

    def test_repeated_fills_do_not_double_count(self) -> None:
        """Filling must be idempotent, or every import inflates the report."""
        self._note_at_resolved_by_no_one(-118.24, 34.05)

        ensure_location_regions(kind=RegionKind.COUNCIL_DISTRICT)
        first = self._counts()
        ensure_location_regions(kind=RegionKind.COUNCIL_DISTRICT)
        second = self._counts()
        self.assertEqual(first, second, "a repeated fill must not write a second assignment")
        self.assertEqual(second.get("1"), 1)
        self.assertEqual(LocationRegion.objects.filter(kind=RegionKind.COUNCIL_DISTRICT).count(), 1)


class RegionCodeCollisionTestCase(TestCase):
    """A code is not unique across dimensions, so the filter must be told which one.

    ``"4"`` is both SPA 4 and Long Beach council district 4. Filtering on the code
    alone matches the region in *both* dimensions, which returns interactions the
    caller did not ask for and reports them under the code they did ask for — a wrong
    answer rather than an error.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        # The same code in two dimensions, in disjoint places.
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(BOX_B))
        for lon, lat in ((-118.24, 34.05), (-118.54, 34.35)):
            baker.make(
                Note,
                organization=self.org,
                location=baker.make(Location, point=Point(lon, lat, srid=4326)),
                interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            )
        assign_locations()

    def _notes(self) -> Any:
        return Note.objects.filter(organization=self.org, interacted_at__gte=self.start, interacted_at__lt=self.end)

    def test_a_code_does_not_match_the_other_dimension_regions(self) -> None:
        # setUp placed one note in BOX_A (council district "1") and one in BOX_B
        # (SPA "1"); only the first may match.
        scoped = scope_notes_to_regions(self._notes(), kind=RegionKind.COUNCIL_DISTRICT.value, codes=["1"])
        council, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id, notes=scoped)
        self.assertEqual(len(council), 1, "the SPA sharing this code must not be matched")
        self.assertAlmostEqual(council[0]["latitude"], 34.05, places=4)
