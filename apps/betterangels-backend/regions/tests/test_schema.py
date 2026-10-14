"""Tests for the region GraphQL surface (DEV-2570 / DEV-2604).

The case that matters most is the ``__unassigned__`` sentinel. Expressing it as
an empty code list collapses "only rows that matched no region" into "no filter",
which returns the entire rollup.

Authority is exercised too, because ``interactionsByRegion`` carries client data
and must not be reachable without ``reports.view_reports`` at the requested org.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Dict, List, cast

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from model_bakery import baker

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from common.models import Location
from common.tests.utils import GraphQLBaseTestCase
from notes.models import Note
from regions.models import Region, RegionKind

from .helpers import assign_locations

BOX_A = ((-118.30, 34.02), (-118.18, 34.02), (-118.18, 34.12), (-118.30, 34.12), (-118.30, 34.02))
BOX_B = ((-118.60, 34.30), (-118.48, 34.30), (-118.48, 34.40), (-118.60, 34.40), (-118.60, 34.30))
OUTSIDE = (-118.41, 34.07)

ROLLUP_QUERY = """
    query InteractionsByRegion(
        $organizationId: ID!
        $dimension: RegionDimension!
        $regionCodes: [String!]
        $startDate: Date
        $endDate: Date
    ) {
        interactionsByRegion(
            organizationId: $organizationId
            dimension: $dimension
            regionCodes: $regionCodes
            startDate: $startDate
            endDate: $endDate
        ) {
            code
            name
            count
            isUnassigned
            unassignedReason
        }
    }
"""


def box(coords: tuple[tuple[float, float], ...]) -> MultiPolygon:
    return MultiPolygon(Polygon(coords, srid=4326), srid=4326)


class RegionRollupGraphQLTestCase(GraphQLBaseTestCase):
    """One note in each of the four situations the report must account for."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

        self.reader = baker.make(User)
        self.org_1.add_user(self.reader)
        OrgRoleManager(self.org_1).add_roles(self.reader, ORG_ADMIN)

        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="2", name="District 2", geom=box(BOX_B))

        when = datetime(2026, 1, 15, tzinfo=UTC)
        for point in (Point(-118.24, 34.05, srid=4326), Point(-118.54, 34.35, srid=4326), Point(*OUTSIDE, srid=4326)):
            baker.make(
                Note,
                organization=self.org_1,
                interacted_at=when,
                location=baker.make(Location, point=point),
            )
        baker.make(Note, organization=self.org_1, interacted_at=when, location=None)
        assign_locations()

    def _query(self, codes: Any = None) -> list[dict[str, Any]]:
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(
            ROLLUP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "dimension": "COUNCIL_DISTRICT",
                "regionCodes": codes,
                # The resolver defaults to the last completed month; the fixtures
                # sit in January 2026, so the range is named explicitly.
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertIsNone(response.get("errors"), response.get("errors"))
        return cast(List[Dict[str, Any]], response["data"]["interactionsByRegion"])

    @staticmethod
    def _key(bucket: dict[str, Any]) -> Any:
        """A bucket's identity. Two unassigned buckets share ``code``, so the
        reason is what makes them distinct — keying on code alone drops one."""
        return (bucket["code"], bucket["unassignedReason"]) if bucket["isUnassigned"] else bucket["code"]

    def _counts(self, buckets: list[dict[str, Any]]) -> dict[Any, int]:
        return {self._key(b): b["count"] for b in buckets}

    def test_unfiltered_returns_named_regions_and_both_unassigned_buckets(self) -> None:
        counts = self._counts(self._query())
        self.assertEqual(counts["1"], 1)
        self.assertEqual(counts["2"], 1)
        self.assertEqual(counts[("", "OUTSIDE_ALL_REGIONS")], 1)
        self.assertEqual(counts[("", "NO_LOCATION")], 1)

    def test_unassigned_sentinel_alone_does_not_return_every_region(self) -> None:
        """Returns *only* unassigned rows — both causes of "unassigned", since
        asking for unassigned and receiving half of it would be its own surprise.
        Named regions must be absent.
        """
        buckets = self._query(["__unassigned__"])
        self.assertTrue(all(b["isUnassigned"] for b in buckets), f"a named region leaked in: {buckets}")
        counts = self._counts(buckets)
        self.assertEqual(counts[("", "OUTSIDE_ALL_REGIONS")], 1)
        self.assertEqual(counts[("", "NO_LOCATION")], 1)

    def test_empty_code_list_returns_no_named_regions(self) -> None:
        """`regionCodes: []` must match nothing, not everything.

        `wanted or None` collapsed an explicitly-empty list to SQL NULL, which drops
        the code predicate altogether. An empty list means "no codes", so it must
        match nothing — the same class of bug as the unassigned sentinel.
        """
        buckets = self._query([])
        named = [b for b in buckets if not b["isUnassigned"]]
        self.assertEqual(named, [], f"an empty code list leaked every region: {named}")

    def test_empty_code_list_does_not_smuggle_in_unassigned_rows(self) -> None:
        """The empty list asks for no regions, not for the unassigned buckets.

        Asserted separately from the named-region check because the two leak through
        different branches: the code predicate and `include_locationless`.
        """
        buckets = self._query([])
        reasons = {b["unassignedReason"] for b in buckets if b["isUnassigned"]}
        self.assertNotIn(
            "OUTSIDE_ALL_REGIONS", reasons, "an empty code list asked for no regions, but returned outside-all-regions"
        )

    def test_code_plus_sentinel_keeps_the_outside_all_regions_bucket(self) -> None:
        counts = self._counts(self._query(["1", "__unassigned__"]))
        self.assertEqual(counts["1"], 1)
        self.assertIn(("", "OUTSIDE_ALL_REGIONS"), counts, "the outside-all-regions bucket was dropped")
        self.assertNotIn("2", counts, "a code filter must exclude other regions")

    def test_filtering_by_a_real_code_excludes_others(self) -> None:
        counts = self._counts(self._query(["2"]))
        self.assertEqual(counts, {"2": 1})

    def test_filtering_by_an_unknown_code_returns_nothing(self) -> None:
        self.assertEqual(self._query(["does-not-exist"]), [])

    def test_buckets_reconcile_to_the_total(self) -> None:
        total = sum(b["count"] for b in self._query())
        self.assertEqual(total, Note.objects.filter(organization=self.org_1).count())

    def test_reading_another_org_is_denied(self) -> None:
        """Same data, sliced differently — so the same authority is required."""
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(
            ROLLUP_QUERY,
            {
                "organizationId": str(self.org_2.pk),
                "dimension": "COUNCIL_DISTRICT",
                "regionCodes": None,
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("interactionsByRegion"))


INTERACTION_MAP_QUERY = """
    query InteractionMap(
        $organizationId: ID!
        $dimension: RegionDimension!
        $startDate: Date
        $endDate: Date
        $limit: Int
    ) {
        interactionMap(organizationId: $organizationId, dimension: $dimension, startDate: $startDate, endDate: $endDate, limit: $limit) {
            points { latitude longitude }
            truncated
        }
    }
"""


class InteractionMapPermissionTestCase(GraphQLBaseTestCase):
    """Pins carry the note read scope, not the report scope.

    ``ORG_ADMIN`` holds ``reports.view_reports`` and no ``notes.view_note``
    (``accounts/groups.py``), so it must not see coordinates.

    Geometry is irrelevant here: the assertions are all or nothing.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.reader = baker.make(User)
        self.org_1.add_user(self.reader)
        OrgRoleManager(self.org_1).add_roles(self.reader, ORG_ADMIN)

        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        baker.make(
            Note,
            organization=self.org_1,
            interacted_at=datetime(2026, 1, 15, tzinfo=UTC),
            location=baker.make(Location, point=Point(-118.24, 34.05, srid=4326)),
        )
        assign_locations()

    def _map(self) -> dict[str, Any]:
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(
            INTERACTION_MAP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "dimension": "COUNCIL_DISTRICT",
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        if response.get("errors"):
            return {"errors": response["errors"]}
        return cast(dict[str, Any], response["data"]["interactionMap"])

    def test_org_admin_without_note_permission_sees_no_pins(self) -> None:
        """The role that can read reports but not notes must not see coordinates.

        It either gets a permission error or an empty map — both are acceptable
        refusals. Leaking a coordinate is not.
        """
        result = self._map()
        if "errors" in result:
            return
        self.assertEqual(
            result["points"],
            [],
            f"ORG_ADMIN has no notes.view_note but received {len(result['points'])} pin(s): {result['points'][:2]}",
        )

    def test_the_rollup_still_works_for_that_role(self) -> None:
        """Refusing the pins must not disable the aggregate report.

        ``interactionsByRegion`` returns counts, which is what ``view_reports`` is
        for. If this starts failing, the note check has been applied in the wrong
        place — which is the mistake this guards.
        """
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(
            ROLLUP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "dimension": "COUNCIL_DISTRICT",
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertIsNone(response.get("errors"), response.get("errors"))
        self.assertTrue(response["data"]["interactionsByRegion"])
