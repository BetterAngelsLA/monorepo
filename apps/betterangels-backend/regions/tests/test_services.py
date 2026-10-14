"""Region-code interpretation (DEV-2570 / DEV-2604).

`regionCodes` has three shapes and two of them are easy to conflate — an empty list
means "no codes", not "no filter". These assert the interpretation directly, with no
database, because it is a pure function and the expensive version of these tests is
already covered end-to-end in ``test_schema.py``.
"""

from __future__ import annotations

from django.test import SimpleTestCase

from regions.services import UNASSIGNED, RegionCodeFilter, parse_region_code_filter


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
        self.assertFalse(parsed.query_unassigned)

    def test_the_sentinel_alone_returns_only_unassigned(self) -> None:
        parsed = self._parse([UNASSIGNED])
        self.assertEqual(parsed.codes, [])
        self.assertTrue(parsed.unassigned_only)
        self.assertTrue(parsed.keep_unassigned)
        self.assertFalse(parsed.query_unassigned, "no real codes, so there is no OR arm")

    def test_sentinel_with_real_codes_asks_for_both_arms(self) -> None:
        parsed = self._parse(["13", UNASSIGNED])
        self.assertEqual(parsed.codes, ["13"])
        self.assertFalse(parsed.unassigned_only)
        self.assertTrue(parsed.keep_unassigned)
        self.assertTrue(parsed.query_unassigned, "the unassigned rows need their own OR arm here")

    def test_the_two_unassigned_flags_are_not_the_same_flag(self) -> None:
        """The bug this guards: folding them drops both buckets from an unfiltered rollup.

        `region_counts` only needs the unassigned arm when real codes are *also* asked
        for, while the result filter keeps unassigned rows whenever the rollup is
        unfiltered or the sentinel was sent.
        """
        unfiltered = self._parse(None)
        self.assertFalse(unfiltered.query_unassigned)
        self.assertTrue(unfiltered.keep_unassigned)
