"""Region-code interpretation (DEV-2570 / DEV-2604).

`regionCodes` has three shapes and two of them are easy to conflate — an empty list
means "no codes", not "no filter". These assert the interpretation directly, with no
database, because it is a pure function and the expensive version of these tests is
already covered end-to-end in ``test_schema.py``.
"""

from __future__ import annotations

import math

from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import SimpleTestCase, TestCase

from regions.models import Region, RegionKind, RegionPiece
from regions.services import (
    UNASSIGNED,
    RegionCodeFilter,
    build_region_pieces,
    parse_region_code_filter,
)


def box(coords: tuple[tuple[float, float], ...]) -> MultiPolygon:
    return MultiPolygon(Polygon(coords, srid=4326), srid=4326)


# A ring with more vertices than SUBDIVIDE_VERTEX_THRESHOLD, so the subdivision branch
# is genuinely exercised. A small ring is stored whole — which is why a first attempt at
# this test asserted nothing: it was below the threshold and never hit the code path.
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


class BuildRegionPiecesTestCase(TestCase):
    """`build_region_pieces` writes with raw SQL, which bypasses the model layer.

    That matters for anything Django would otherwise fill in itself: `auto_now_add` and
    `auto_now` never run on a hand-written INSERT, so a NOT NULL column added to the
    model breaks this path while the model still looks fine. Nothing else caught it —
    the importer is not exercised by the suite, and the first symptom was a failed
    `import_regions` against a real database.
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
        """A simple region gets one piece that is a copy, so the lookup has no branch."""
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(SIMPLE))
        Region.objects.create(kind=RegionKind.SPA, code="2", name="SPA 2", geom=box(SIMPLE))
        build_region_pieces(kind=RegionKind.SPA.value)
        for region in Region.objects.filter(kind=RegionKind.SPA):
            self.assertTrue(region.pieces.exists(), f"{region.code} has no piece")
            self.assertEqual(region.pieces.count(), 1, "a simple region is not chopped")

    def test_it_is_idempotent(self) -> None:
        """DELETE-then-INSERT: a second run must not accumulate duplicate pieces."""
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(SIMPLE))
        build_region_pieces(kind=RegionKind.SPA.value)
        first = RegionPiece.objects.count()
        build_region_pieces(kind=RegionKind.SPA.value)
        self.assertEqual(RegionPiece.objects.count(), first, "re-running duplicated pieces")
