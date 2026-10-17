"""Rollup, unassigned buckets, filtering and boundary serving (DEV-2570 / DEV-2604).

Boundaries are created directly; a unit test must not depend on the importer's network.
"""

from __future__ import annotations

import math
from datetime import UTC, datetime
from typing import Any
from unittest import mock

from django.contrib.gis.geos import Point
from django.db import connection
from django.test import SimpleTestCase, TestCase
from django.test.utils import CaptureQueriesContext
from model_bakery import baker

from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from notes.models import Note
from regions import selectors
from regions.models import Region, RegionKind, RegionPiece
from regions.selectors import (
    available_kinds,
    interaction_points,
    org_notes_in_range,
    region_counts,
    region_totals_without_boundaries,
    scope_notes_to_regions,
)

from .helpers import BOX_A, BOX_B, OUTSIDE, box, build_pieces


def heavy_ring(center: tuple[float, float] = (-118.24, 34.05), radius: float = 0.05) -> tuple[tuple[float, float], ...]:
    """A ring with more vertices than ``SUBDIVIDE_VERTEX_THRESHOLD``, so it is actually chopped.

    ``build_region_pieces`` stores a region whole unless it is above the threshold, so a
    simple rectangle exercises none of the subdivision path.
    """
    vertices = 2400
    return tuple(
        (
            round(center[0] + radius * math.cos(2 * math.pi * i / vertices), 6),
            round(center[1] + radius * math.sin(2 * math.pi * i / vertices), 6),
        )
        for i in range(vertices)
    ) + ((round(center[0] + radius, 6), round(center[1], 6)),)


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

        No resolution step: the rollup does the spatial join itself, so a location is
        counted the moment it exists.
        """
        note = baker.make(
            Note,
            organization=self.org,
            interacted_at=when or datetime(2026, 1, 15, tzinfo=UTC),
            location=None if not location else baker.make(Location, point=Point(lon, lat, srid=4326)),
        )
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
        """One interaction inside two dimensions' regions counts once in each.

        The note in BOX_A falls in both a council district and an SPA, so each dimension's
        bucket reads 1. A bucket reading 2 would mean the interaction is counted per
        overlapping region rather than per dimension.
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

        Calling ``org_notes_in_range`` rather than repeating its filter is what keeps this
        fixture and the resolver from drifting apart: a hand-written filter here would
        exercise a different query from the one that ships.
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
        """A client-supplied limit cannot exceed the cap, and truncation says so.

        The cap is patched rather than exceeded: with fewer notes than the cap, a clamped
        limit and no clamp return the same rows. The resolver passes the client's ``limit``
        straight through, so this expression is the only thing bounding the payload.
        """
        for i in range(4):
            self._note_at(-118.24 + i * 0.01, 34.05)

        with mock.patch.object(selectors, "POINT_LIMIT_MAX", 3):
            rows, truncated = self._points(limit=10**9)

        self.assertEqual(len(rows), 3, "the request exceeded the cap and was not clamped")
        self.assertTrue(truncated, "truncation must be reported, not silent")

    def test_a_limit_below_one_is_raised_to_one(self) -> None:
        """The floor of the clamp: a limit below one is raised, not honoured."""
        for i in range(3):
            self._note_at(-118.24 + i * 0.01, 34.05)
        rows, truncated = self._points(limit=0)
        self.assertEqual(len(rows), 1)
        self.assertTrue(truncated)

    def _box_region(self, code: str, box_coords: Any) -> None:
        """This class has no regions by default; the filter tests need one."""
        Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT, code=code, name=f"District {code}", geom=box(box_coords)
        )

    def test_scoping_by_region_narrows_the_points(self) -> None:
        """Filtering by region is the "show me the SPA 4 visits" case.

        The predicate must actually narrow: an unwired filter returns every point and still
        looks like a working map.
        """
        self._box_region("1", BOX_A)
        self._note_at(-118.24, 34.05)  # in region "1"
        self._note_at(-118.54, 34.35)  # in region "2"
        self._note_at(*OUTSIDE)  # in neither

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
        rows, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id)
        self.assertEqual(len(rows), 2)

    def test_every_interaction_in_scope_gets_a_point(self) -> None:
        """The heatmap is drawn from these points, so none may be dropped."""
        for i in range(4):
            self._note_at(-118.24 + i * 0.02, 34.05 + i * 0.02)
        points, _ = self._points()
        self.assertEqual(len(points), 4)


class LiveSpatialJoinTestCase(TestCase):
    """The rollup reads the boundaries live, so there is no resolved state to top up.

    A location created between two imports is counted by the very next read, with no write
    anywhere.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        self.region = Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A)
        )

    def _counts(self) -> dict[str | None, int]:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT,
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
        )
        return {row["code"]: row["count"] for row in rows}

    def _note_at(self, lon: float, lat: float) -> Note:
        return baker.make(
            Note,
            organization=self.org,
            location=baker.make(Location, point=Point(lon, lat, srid=4326)),
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
        )

    def test_a_location_created_after_the_boundaries_is_counted_with_no_fill(self) -> None:
        """Nothing has to run between a location being written and it appearing in a bucket."""
        note = self._note_at(-118.24, 34.05)

        self.assertEqual(self._counts().get("1"), 1)
        self.assertIsNotNone(note.location_id)

    def test_a_read_writes_nothing(self) -> None:
        """The rollup is a pure read: no INSERT, UPDATE or DELETE against any table.

        Asserted on the statements the rollup actually executed rather than on a row count:
        the failure this guards against is a selector that INSERTs, which a row-count
        assertion would only catch for tables it knew to look at.
        """
        self._note_at(-118.24, 34.05)

        with CaptureQueriesContext(connection) as captured:
            self._counts()

        wrote = self._writes_in(captured)
        self.assertEqual(wrote, [], f"the rollup executed a write: {wrote}")

    def test_the_write_capture_itself_would_notice_a_write(self) -> None:
        """Positive control for the test above.

        ``assertEqual(wrote, [])`` also passes if the capture recorded nothing at all — a
        changed capture mechanism, or a connection whose queries Django stops logging. A known
        write has to be visible to the same detector for the empty result to mean anything.
        """
        with CaptureQueriesContext(connection) as captured:
            Region.objects.create(kind=RegionKind.ZIP, code="control", name="control", geom=box(BOX_B))

        self.assertNotEqual(self._writes_in(captured), [], "the write detector saw no INSERT for a known write")

    @staticmethod
    def _writes_in(captured: CaptureQueriesContext) -> list[str]:
        return [
            query["sql"]
            for query in captured.captured_queries
            if not query["sql"].lstrip().upper().startswith("SELECT")
        ]

    def test_a_region_with_no_pieces_resolves_through_the_lookup_view(self) -> None:
        """The fallback arm of ``regions_regionlookup``: a region with no pieces.

        Most fixtures in this module create regions this way, so this is the arm they take —
        and it is **not** the one production uses.
        """
        self.assertFalse(self.region.pieces.exists(), "precondition: no pieces were built")

        self._note_at(-118.24, 34.05)

        self.assertEqual(self._counts().get("1"), 1)

    def test_a_region_with_pieces_resolves_through_them(self) -> None:
        """The production arm, which ``import_regions`` always creates.

        The piece branch is otherwise unexecuted by the suite, so a defect in the subdivided
        geometry — the one thing ``RegionPiece`` exists for — would go unnoticed.
        """
        build_pieces(kind=RegionKind.COUNCIL_DISTRICT)
        self.assertTrue(self.region.pieces.exists(), "precondition: pieces were built")

        self._note_at(-118.24, 34.05)

        self.assertEqual(self._counts().get("1"), 1)

    def test_subdivision_does_not_change_the_answer(self) -> None:
        """The invariant the whole table rests on: a piece is *the same* region.

        Both arms are run over the same notes and must agree. A point a hair inside the
        boundary is the case that would break if pieces were clipped rather than
        partitioned.
        """
        self._note_at(-118.24, 34.05)  # inside
        self._note_at(-118.29, 34.03)  # inside, a hair east of BOX_A's western edge
        self._note_at(-118.31, 34.03)  # outside, a hair west of the same edge
        before = self._counts()

        build_pieces(kind=RegionKind.COUNCIL_DISTRICT)

        self.assertEqual(self._counts(), before, "subdividing changed the rollup")

    def test_repeated_reads_do_not_change_the_answer(self) -> None:
        """Reads are pure, so a second load cannot inflate the first."""
        self._note_at(-118.24, 34.05)
        self.assertEqual(self._counts(), self._counts())

    def test_the_unassigned_bucket_is_the_remainder_of_located_interactions(self) -> None:
        """``unassigned = interactions with a location - interactions a boundary contains``.

        Computed rather than queried, which is what keeps the bucket off the spatial path:
        written as a spatial anti-join it measured 3.2 s on 20,000 interactions.
        """
        self._note_at(-118.24, 34.05)  # in BOX_A
        self._note_at(-118.24, 34.06)  # in BOX_A
        self._note_at(*OUTSIDE)  # located, in no region

        counts = self._counts()

        self.assertEqual(counts["1"], 2)
        self.assertEqual(counts[None], 1, "the located-but-outside note is reported, not dropped")
        self.assertEqual(sum(counts.values()), 3, "buckets must reconcile to located interactions")


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

    def _notes(self) -> Any:
        return Note.objects.filter(organization=self.org, interacted_at__gte=self.start, interacted_at__lt=self.end)

    def test_a_code_does_not_match_the_other_dimension_regions(self) -> None:
        # setUp placed one note in BOX_A (council district "1") and one in BOX_B
        # (SPA "1"); only the first may match.
        scoped = scope_notes_to_regions(self._notes(), kind=RegionKind.COUNCIL_DISTRICT.value, codes=["1"])
        council, _ = interaction_points(start=self.start, end=self.end, organization_id=self.org.id, notes=scoped)
        self.assertEqual(len(council), 1, "the SPA sharing this code must not be matched")
        self.assertAlmostEqual(council[0]["latitude"], 34.05, places=4)


class HalfOpenRangeTestCase(TestCase):
    """``[start, end)`` at both edges — the one bound both the queryset and the SQL apply.

    ``gte``/``lt`` is invisible in a fixture whose rows sit mid-window: a ``gt`` or an ``lte``
    returns the same rows. A note written exactly on each edge is the only thing that tells
    them apart, and the same pair of bounds has to hold on the note queryset and on the rollup
    statement, which apply them independently.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)

    def _note_at(self, when: datetime) -> Note:
        return baker.make(
            Note,
            organization=self.org,
            interacted_at=when,
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )

    def _counts(self) -> dict[str | None, int]:
        rows = region_counts(
            kind=RegionKind.COUNCIL_DISTRICT,
            start=self.start,
            end=self.end,
            organization_id=self.org.id,
        )
        return {row["code"]: row["count"] for row in rows}

    def test_a_note_exactly_at_the_start_is_inside(self) -> None:
        note = self._note_at(self.start)
        self.assertEqual(
            list(org_notes_in_range(organization_id=self.org.id, start=self.start, end=self.end)),
            [note],
            "`gte` must include the start instant",
        )
        self.assertEqual(self._counts()["1"], 1)

    def test_a_note_exactly_at_the_end_is_outside(self) -> None:
        self._note_at(self.end)
        self.assertEqual(
            org_notes_in_range(organization_id=self.org.id, start=self.start, end=self.end).count(),
            0,
            "`lt` must exclude the end instant",
        )
        self.assertEqual(self._counts(), {}, "the rollup statement must apply the same bound")


class ScopeNotesToRegionsTestCase(TestCase):
    """``scope_notes_to_regions`` reads the lookup view, and the view has two arms.

    Arm one is a region's subdivided pieces; arm two is the parent boundary of a region that
    has none. A selector that queried ``RegionPiece`` directly would silently miss the second,
    which is why the view is the one definition of "inside the region".
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)

        self.with_pieces = Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A)
        )
        # Built before the second region exists, so that region genuinely has no piece.
        build_pieces(kind=RegionKind.COUNCIL_DISTRICT.value)
        self.without_pieces = Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT, code="2", name="District 2", geom=box(BOX_B)
        )

        for lon, lat in ((-118.24, 34.05), (-118.54, 34.35)):
            baker.make(
                Note,
                organization=self.org,
                interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
                location=baker.make(Location, point=Point(lon, lat, srid=4326)),
            )

    def _notes(self) -> Any:
        return Note.objects.filter(organization=self.org, interacted_at__gte=self.start, interacted_at__lt=self.end)

    def _matched_latitudes(self, codes: list[str]) -> list[float]:
        scoped = scope_notes_to_regions(self._notes(), kind=RegionKind.COUNCIL_DISTRICT.value, codes=codes)
        return sorted(round(note.location.point.y, 4) for note in scoped if note.location is not None)

    def test_the_piece_arm_matches(self) -> None:
        self.assertTrue(self.with_pieces.pieces.exists(), "precondition: the first region was subdivided")
        self.assertEqual(self._matched_latitudes(["1"]), [34.05])

    def test_the_parent_boundary_arm_matches(self) -> None:
        self.assertFalse(self.without_pieces.pieces.exists(), "precondition: the second region has no piece")
        self.assertEqual(self._matched_latitudes(["2"]), [34.35])

    def test_both_arms_together_match_both_notes(self) -> None:
        self.assertEqual(self._matched_latitudes(["1", "2"]), [34.05, 34.35])

    def test_an_empty_code_list_matches_nothing(self) -> None:
        self.assertEqual(self._matched_latitudes([]), [])

    def test_the_predicate_is_a_semi_join_not_a_correlated_exists(self) -> None:
        """The shape is the point: a correlated ``EXISTS`` re-asks the region question per note.

        Asserted on the compiled SQL because the wrong implementation returns the same rows —
        this is the one property a row-level assertion cannot see.
        """
        # Whitespace-normalised: the compiled statement is multi-line and Django puts a space
        # after the paren, so asserting on either would make this a formatting check. The
        # assertions below are the pieces that actually distinguish the two plans, and the
        # `EXISTS` one is what fires if the correlated form comes back.
        sql = " ".join(
            str(
                scope_notes_to_regions(self._notes(), kind=RegionKind.COUNCIL_DISTRICT.value, codes=["1"]).query
            ).split()
        )
        self.assertNotIn("EXISTS", sql.upper(), "a correlated EXISTS is back")
        self.assertIn('"location_id" IN (', sql, "the note is not filtered by a semi-join")
        self.assertIn("SELECT DISTINCT", sql, "the region set is not de-duplicated")
        self.assertIn("FROM regions_regionlookup", sql, "the lookup view's two arms are bypassed")
        self.assertIn("ST_Covers", sql, "the point-in-region test is gone")


class OverlappingBoundariesTestCase(TestCase):
    """Same-kind regions overlap on the shipped layers, which the rollup must survive.

    The shipped fixture has 27 overlapping ZIP pairs, 91 city pairs and 4 supervisorial pairs
    with positive area. That is why the unassigned figure is derived as ``located − (distinct
    notes covered by any region of that kind)`` rather than by subtracting the named buckets:
    subtracting buckets assumes the boundaries partition the plane, and an overlap then eats
    the whole unassigned figure and hides an uncovered neighbourhood. The assertions below are
    what hold that invariant.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        # Two overlapping CITY polygons; only the second overlap is disjoint from neither.
        Region.objects.create(kind=RegionKind.CITY, code="1", name="City 1", geom=box(BOX_A))
        Region.objects.create(
            kind=RegionKind.CITY,
            code="2",
            name="City 2",
            geom=box(tuple((lon + 0.05, lat + 0.01) for lon, lat in BOX_A)),
        )
        # One note inside both, one inside neither.
        baker.make(
            Note,
            organization=self.org,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )
        baker.make(
            Note,
            organization=self.org,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(*OUTSIDE, srid=4326)),
        )

    def _counts(self) -> dict[str | None, int]:
        rows = region_counts(kind=RegionKind.CITY, start=self.start, end=self.end, organization_id=self.org.id)
        return {row["code"]: row["count"] for row in rows}

    def test_the_shared_point_is_counted_once_in_each_region(self) -> None:
        counts = self._counts()
        self.assertEqual(counts.get("1"), 1, "the point must not be multiplied by the overlap")
        self.assertEqual(counts.get("2"), 1)

    def test_the_unassigned_bucket_stays_coherent_under_overlap(self) -> None:
        """The named buckets sum to more than the located total; the unassigned figure does not.

        This is the invariant the code now holds: counts are of *distinct* notes per region, and
        the unassigned bucket is located minus the distinct notes covered by **any** region of
        the kind — so an overlap cannot swallow it.
        """
        counts = self._counts()
        named_total = sum(count for code, count in counts.items() if code is not None)
        self.assertEqual(named_total, 2, "the same point is inside two regions; both must say so")
        self.assertEqual(counts.get(None), 1, "the uncovered note must remain uncovered exactly once")

        # And the arithmetic that keeps it non-negative: located (2) - distinct-covered (1) = 1.
        located = Note.objects.filter(
            organization=self.org, interacted_at__gte=self.start, interacted_at__lt=self.end, location__isnull=False
        ).count()
        self.assertEqual(located - 1, counts.get(None))


class DuplicatePieceTestCase(TestCase):
    """A location in more than one piece of one region must still be one interaction.

    ``ST_Subdivide`` should not produce overlapping pieces, but a hand-written row or a future
    subdivision change can, and without ``DISTINCT`` the note joins once per covering piece and
    is double-counted — the failure the DELETE in ``build_region_pieces`` also guards.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.start = datetime(2026, 1, 1, tzinfo=UTC)
        self.end = datetime(2026, 2, 1, tzinfo=UTC)
        self.region = Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(BOX_A))
        # Two pieces covering the same ground.
        RegionPiece.objects.create(region=self.region, geom=box(BOX_A))
        RegionPiece.objects.create(region=self.region, geom=box(BOX_A))
        self.note = baker.make(
            Note,
            organization=self.org,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )

    def test_the_rollup_counts_the_note_once(self) -> None:
        rows = region_counts(kind=RegionKind.SPA, start=self.start, end=self.end, organization_id=self.org.id)
        counts = {row["code"]: row["count"] for row in rows}
        self.assertEqual(counts.get("1"), 1, "a note covered by two pieces was counted twice")

    def test_the_region_filter_returns_the_note_once(self) -> None:
        notes = Note.objects.filter(organization=self.org, interacted_at__gte=self.start, interacted_at__lt=self.end)
        scoped = scope_notes_to_regions(notes, kind=RegionKind.SPA.value, codes=["1"])
        self.assertEqual([note.pk for note in scoped], [self.note.pk])


class SubdividedPieceBoundaryTestCase(TestCase):
    """The production arm, at the one place a per-piece double count would hide: a shared edge."""

    def test_a_point_on_a_shared_piece_edge_is_counted_once(self) -> None:
        org = organization_recipe.make()
        start = datetime(2026, 1, 1, tzinfo=UTC)
        end = datetime(2026, 2, 1, tzinfo=UTC)
        region = Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(heavy_ring()))
        build_pieces(kind=RegionKind.SPA.value)

        # A vertex of the boundary two pieces share: it lies on both, so ``ST_Covers`` is true
        # for each and the join would emit the note twice without the de-duplication.
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT ST_X(shared.p), ST_Y(shared.p)
                FROM (
                    SELECT (ST_DumpPoints(ST_Intersection(a.geom, b.geom))).geom AS p
                    FROM regions_regionpiece a
                    JOIN regions_regionpiece b
                      ON b.region_id = a.region_id AND b.id > a.id
                    WHERE a.region_id = %s AND ST_Intersects(a.geom, b.geom)
                ) AS shared
                LIMIT 1
                """,
                [region.id],
            )
            row = cursor.fetchone()
        self.assertIsNotNone(row, "the heavy ring did not subdivide into touching pieces")

        longitude, latitude = row
        baker.make(
            Note,
            organization=org,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(longitude, latitude, srid=4326)),
        )

        rows = region_counts(kind=RegionKind.SPA, start=start, end=end, organization_id=org.id)
        counts = {row["code"]: row["count"] for row in rows}
        self.assertEqual(counts.get("1"), 1, "a point on a shared piece edge was counted once per piece")


class RollupStatementShapeTestCase(SimpleTestCase):
    """The rollup's predicates are conditional, and that is a performance decision.

    A `%(… )s IS NULL OR …` spelling would defeat the planner; a dimension predicate is worth
    a second statement shape — measured at 40 ms for `zip` and 30 ms for `city` against 87–95 ms
    over every dimension — so it is asserted rather than left to a comment.
    """

    def test_a_scoped_rollup_filters_by_kind(self) -> None:
        self.assertIn("rr.kind = %(kind)s", selectors._rollup_sql(organization_id=None, kind=RegionKind.ZIP))

    def test_an_unscoped_rollup_does_not(self) -> None:
        self.assertNotIn("rr.kind = %(kind)s", selectors._rollup_sql(organization_id=None, kind=None))

    def test_the_org_predicate_is_also_conditional(self) -> None:
        self.assertIn("organization_id", selectors._rollup_sql(organization_id=1, kind=None))
        self.assertNotIn("organization_id", selectors._rollup_sql(organization_id=None, kind=None))
