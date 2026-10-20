"""Region-code interpretation (DEV-2570 / DEV-2604).

`regionCodes` has four shapes and several are easy to conflate — an empty list means
"no codes", not "no filter". These assert the interpretation directly: it is a pure
function, so no database is involved.
"""

from __future__ import annotations

import math

from django.test import SimpleTestCase, TestCase

from regions.models import Region, RegionKind, RegionPiece
from regions.services import (
    UNASSIGNED,
    RegionCodeFilter,
    RegionScopeError,
    build_region_pieces,
    parse_region_code_filter,
    resolve_group_scope,
    resolve_region_scope,
)

from .helpers import box

# A ring with more vertices than SUBDIVIDE_VERTEX_THRESHOLD, so the subdivision branch is
# genuinely exercised. A small ring is stored whole, so a fixture built from one asserts
# nothing about subdivision however it is written.
COMPLEX = tuple(
    (
        round(-118.24 + 0.05 * math.cos(2 * math.pi * i / 2400), 6),
        round(34.05 + 0.05 * math.sin(2 * math.pi * i / 2400), 6),
    )
    for i in range(2400)
) + ((-118.19, 34.05),)
SIMPLE = ((-118.24, 34.05), (-118.23, 34.05), (-118.23, 34.06), (-118.24, 34.06), (-118.24, 34.05))


class ParseRegionCodeFilterTestCase(SimpleTestCase):
    def _parse(self, region_codes: list[str] | None) -> RegionCodeFilter:
        return parse_region_code_filter(region_codes)

    def test_absent_codes_means_unfiltered(self) -> None:
        parsed = self._parse(None)
        self.assertIsNone(parsed.codes, "no predicate: every region is in scope")
        self.assertFalse(parsed.unassigned_only)
        self.assertTrue(parsed.keep_unassigned, "an unfiltered rollup shows both buckets")
        self.assertTrue(parsed.include_locationless)

    def test_an_empty_list_matches_nothing_rather_than_everything(self) -> None:
        """`[]` must become an empty code list, never `None` — `None` drops the predicate.

        An empty list is a *filter that matches nothing*, which is not the same as no
        filter: no named region and no sentinel means no unassigned rows either. The
        "no location recorded" bucket is still reported, because a note with no
        location was never attributable to a region in the first place.
        """
        parsed = self._parse([])
        self.assertIsNotNone(parsed.codes)
        self.assertEqual(parsed.codes, [])
        self.assertFalse(parsed.keep_unassigned, "nothing was asked for, including unassigned")
        self.assertTrue(parsed.include_locationless, "but a locationless note is still uncounted")

    def test_real_codes_narrow_to_those_regions(self) -> None:
        parsed = self._parse(["13"])
        self.assertEqual(parsed.codes, ["13"])
        self.assertFalse(parsed.unassigned_only)
        self.assertFalse(
            parsed.keep_unassigned,
            "naming regions is not a request for a whole-period no-location bucket",
        )

    def test_the_sentinel_alone_returns_only_unassigned(self) -> None:
        parsed = self._parse([UNASSIGNED])
        self.assertEqual(parsed.codes, [])
        self.assertTrue(parsed.unassigned_only)
        self.assertTrue(parsed.keep_unassigned)

    def test_sentinel_with_real_codes_asks_for_both_arms(self) -> None:
        parsed = self._parse(["13", UNASSIGNED])
        self.assertEqual(parsed.codes, ["13"])
        self.assertFalse(parsed.unassigned_only)
        self.assertTrue(parsed.keep_unassigned)


class ResolveRegionScopeTestCase(SimpleTestCase):
    """The one reading of ``(dimension, codes)`` that every code-scoped surface shares."""

    def test_absent_codes_are_no_restriction_and_need_no_dimension(self) -> None:
        self.assertEqual(resolve_region_scope(dimension=None, codes=None), (None, None))

    def test_a_dimension_without_codes_is_refused_rather_than_ignored(self) -> None:
        with self.assertRaises(RegionScopeError) as caught:
            resolve_region_scope(dimension=RegionKind.ZIP.value, codes=None)
        self.assertEqual(caught.exception.code, "DIMENSION_REQUIRES_REGION_CODES")
        self.assertEqual(caught.exception.field, "dimension")

    def test_a_non_empty_code_list_requires_a_dimension(self) -> None:
        with self.assertRaises(RegionScopeError) as caught:
            resolve_region_scope(dimension=None, codes=["90012"])
        self.assertEqual(str(caught.exception), "regionCodes requires a dimension")
        self.assertEqual(caught.exception.code, "REGION_CODES_REQUIRE_DIMENSION")
        self.assertEqual(caught.exception.field, "regionCodes")

    def test_a_non_empty_code_list_with_a_dimension_is_returned_verbatim(self) -> None:
        self.assertEqual(resolve_region_scope(dimension="zip", codes=["90012"]), ("zip", ["90012"]))

    def test_an_empty_code_list_matches_nothing_and_needs_no_dimension(self) -> None:
        """The `?codes=` shape: unambiguous, so it is not an error and does not demand a kind."""
        self.assertEqual(resolve_region_scope(dimension=None, codes=[]), (None, []))
        self.assertEqual(resolve_region_scope(dimension="zip", codes=[]), ("zip", []))


class ResolveGroupScopeTestCase(SimpleTestCase):
    """The report summary's reading of the pair — one shape differs from the map's."""

    def test_absent_pair_is_unfiltered(self) -> None:
        self.assertEqual(resolve_group_scope(dimension=None, codes=None), (None, None))

    def test_a_dimension_without_codes_means_every_region_of_it(self) -> None:
        """The difference from `resolve_region_scope`: "all cities" is a complete answer.

        The map refuses this shape because pins have nothing to narrow; the summary's
        dimension-only view is a real population (the one the city table groups into rows),
        so refusing it would leave the reader looking at an unfiltered page.
        """
        self.assertEqual(resolve_group_scope(dimension="city", codes=None), ("city", None))

    def test_a_non_empty_code_list_requires_a_dimension(self) -> None:
        with self.assertRaises(RegionScopeError) as caught:
            resolve_group_scope(dimension=None, codes=["90012"])
        self.assertEqual(caught.exception.code, "REGION_CODES_REQUIRE_DIMENSION")
        self.assertEqual(caught.exception.field, "regionCodes")

    def test_a_non_empty_code_list_with_a_dimension_is_returned_verbatim(self) -> None:
        self.assertEqual(
            resolve_group_scope(dimension="city", codes=["Beverly Hills", "Culver City"]),
            ("city", ["Beverly Hills", "Culver City"]),
        )

    def test_an_empty_code_list_matches_nothing(self) -> None:
        # With a dimension, it is a selection of no regions; without one, still nothing.
        self.assertEqual(resolve_group_scope(dimension="city", codes=[]), ("city", []))
        self.assertEqual(resolve_group_scope(dimension=None, codes=[]), (None, []))


class BuildRegionPiecesTestCase(TestCase):
    """`build_region_pieces` writes with raw SQL, which bypasses the model layer.

    That matters for anything Django would otherwise fill in itself: `auto_now_add` and
    `auto_now` never run on a hand-written INSERT, so a NOT NULL column added to the model
    breaks this path while the model still looks fine.
    """

    def test_it_writes_pieces_without_violating_not_null(self) -> None:
        region = Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(SIMPLE))
        written = build_region_pieces(kind=RegionKind.COUNCIL_DISTRICT.value)
        self.assertEqual(written, 1)
        piece = RegionPiece.objects.get(region=region)
        self.assertIsNotNone(piece.created_at, "raw INSERT must supply created_at")
        self.assertIsNotNone(piece.updated_at, "raw INSERT must supply updated_at")

    def test_a_complex_boundary_is_subdivided_into_several_pieces(self) -> None:
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="2", name="District 2", geom=box(COMPLEX))
        build_region_pieces(kind=RegionKind.COUNCIL_DISTRICT.value)
        self.assertGreater(RegionPiece.objects.count(), 1, "a heavy ring should be chopped")

    def test_every_region_ends_up_with_at_least_one_piece(self) -> None:
        """Every region gets a piece, so the lookup finds it without the parent fallback."""
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(SIMPLE))
        Region.objects.create(kind=RegionKind.SPA, code="2", name="SPA 2", geom=box(SIMPLE))
        build_region_pieces(kind=RegionKind.SPA.value)
        for region in Region.objects.filter(kind=RegionKind.SPA):
            self.assertTrue(region.pieces.exists(), f"{region.code} has no piece")
            self.assertEqual(region.pieces.count(), 1, "a simple region is not chopped")

    def test_it_is_idempotent(self) -> None:
        """DELETE-then-INSERT: a second run must not accumulate duplicate pieces.

        A duplicated piece would join a note once per copy and inflate the count.
        """
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(SIMPLE))
        build_region_pieces(kind=RegionKind.SPA.value)
        first = RegionPiece.objects.count()
        build_region_pieces(kind=RegionKind.SPA.value)
        self.assertEqual(RegionPiece.objects.count(), first, "re-running duplicated pieces")

    def test_the_rebuild_holds_an_advisory_lock_for_the_dimension(self) -> None:
        """A concurrent rebuild must not interleave with this one.

        DELETE-then-INSERT alone does not serialise: under READ COMMITTED the second run cannot
        see the first run's uncommitted INSERTs, so both DELETEs run and both INSERTs follow,
        leaving two sets of pieces. Asserted on ``pg_locks`` from inside the *same* outer
        transaction, because an advisory **xact** lock is held until that transaction ends —
        which is exactly the property being relied on. A plain row-count assertion cannot see
        this, since a single-threaded test never has a second run to interleave.
        """
        from django.db import connection, transaction

        from regions.services import _PIECES_LOCK_NAMESPACE, _pieces_lock_key

        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(SIMPLE))

        with transaction.atomic():
            build_region_pieces(kind=RegionKind.SPA.value)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT count(*) FROM pg_locks "
                    "WHERE locktype = 'advisory' AND pid = pg_backend_pid() AND classid = %s",
                    [_PIECES_LOCK_NAMESPACE],
                )
                held = cursor.fetchone()[0]

        self.assertGreaterEqual(held, 1, "the rebuild took no advisory lock, so a concurrent run could interleave")

        # And the key is the dimension's, not a constant shared with every other kind.
        self.assertNotEqual(_pieces_lock_key(RegionKind.SPA.value), _pieces_lock_key(RegionKind.ZIP.value))
