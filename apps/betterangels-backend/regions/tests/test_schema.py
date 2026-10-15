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
from common.tests.utils import GraphQLBaseTestCase, make_legacy_only_holder
from notes.groups import CASEWORKER
from notes.models import Note
from regions.models import Region, RegionKind

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
        """``regionCodes: []`` must match nothing, not everything.

        An empty list means "no codes". Collapsing it to SQL NULL drops the code predicate
        and returns the whole dimension — the same trap as the unassigned sentinel.
        """
        buckets = self._query([])
        named = [b for b in buckets if not b["isUnassigned"]]
        self.assertEqual(named, [], f"an empty code list leaked every region: {named}")

    def test_empty_code_list_does_not_smuggle_in_unassigned_rows(self) -> None:
        """The empty list asks for no regions, not for the unassigned buckets.

        The code predicate and ``include_locationless`` are separate branches, so a check on
        one does not cover the other.
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
        $dimension: RegionDimension
        $startDate: Date
        $endDate: Date
        $limit: Int
        $regionCodes: [String!]
    ) {
        interactionMap(
            organizationId: $organizationId
            dimension: $dimension
            startDate: $startDate
            endDate: $endDate
            limit: $limit
            regionCodes: $regionCodes
        ) {
            points { latitude longitude }
            truncated
        }
    }
"""


class InteractionMapBaseTestCase(GraphQLBaseTestCase):
    """One located note in ``org_1``, one in ``org_2``, and the roles that may see them.

    The map's authority is two gates that are easy to conflate:

    * ``reports.view_reports`` at the org — a **grant**, role-backed, so
      ``ORG_ADMIN``/``ORG_SUPERUSER`` satisfy it;
    * the note read scope — a **legacy** ``PermissionGroup`` permission, because notes
      are gated on RFC 0003 and **no ``Role`` carries ``notes.view_note``**
      (``CASEWORKER_ROLE`` carries only ``Team.perms.VIEW``).

    So a caller must satisfy both, and the roles that do are caseworkers, not
    ``ORG_ADMIN``. Gating the map on ``require_can(..., NotePermissions.VIEW)`` instead would
    deny *every* non-superuser and return nothing for every real user, because no ``Role``
    carries that codename.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))

        when = datetime(2026, 1, 15, tzinfo=UTC)
        # One shared location, used by both orgs' notes. Deliberate: it makes the org
        # predicate the *only* thing that can separate the two rows in the confinement
        # tests below, so a missing org filter cannot hide behind distinct geometry.
        shared_location = baker.make(Location, point=Point(-118.24, 34.05, srid=4326))
        self.note_here = baker.make(Note, organization=self.org_1, interacted_at=when, location=shared_location)
        self.note_there = baker.make(Note, organization=self.org_2, interacted_at=when, location=shared_location)

    def caseworker(self) -> User:
        """A real caseworker: legacy ``notes.view_note`` AND a grant for the report gate.

        Built in that order deliberately — ``add_legacy_membership`` drops every Grant on
        the user (it models the pre-cutover state), so the role-backed grant has to be
        added after it or it is silently revoked.
        """
        user = make_legacy_only_holder(user=baker.make(User), organization=self.org_1, template_name=CASEWORKER.name)
        OrgRoleManager(self.org_1).add_roles(user, ORG_ADMIN)
        return user

    def _map(self, user: User, *, org_id: object = None, **overrides: Any) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        variables: dict[str, Any] = {
            "organizationId": str(org_id if org_id is not None else self.org_1.pk),
            "dimension": "COUNCIL_DISTRICT",
            "startDate": "2026-01-01",
            "endDate": "2026-01-31",
        }
        variables.update(overrides)
        response = self.execute_graphql(INTERACTION_MAP_QUERY, variables)
        if response.get("errors"):
            return {"errors": response["errors"]}
        return cast(dict[str, Any], response["data"]["interactionMap"])


class InteractionMapPermissionTestCase(InteractionMapBaseTestCase):
    """Who may read pins: the caseworker yes, the report-only role no."""

    def test_a_caseworker_holds_both_gates_and_sees_the_pins(self) -> None:
        """**The positive case.** A caseworker holds ``notes.view_note`` through the legacy
        ``Caseworker`` group and ``reports.view_reports`` through their ``ORG_ADMIN`` grant,
        so the map must return the org's interaction.

        The one test that separates a working gate from an unsatisfiable one: both return
        nothing, so a suite of denials alone cannot tell them apart.
        """
        result = self._map(self.caseworker())
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(len(result["points"]), 1, "the caseworker's note must be a pin")
        self.assertAlmostEqual(result["points"][0]["latitude"], 34.05, places=4)

    def test_org_admin_without_note_permission_sees_no_pins(self) -> None:
        """``ORG_ADMIN`` holds ``reports.view_reports`` and no ``notes.view_note``.

        The note scope withholds the pins rather than the report gate, so the request
        succeeds and returns an empty map. That is a different mechanism from the
        caseworker's, and the two gates are independent.
        """
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        result = self._map(admin)
        self.assertEqual(
            result["points"],
            [],
            f"ORG_ADMIN has no notes.view_note but received {len(result.get('points') or [])} pin(s)",
        )

    def test_the_rollup_still_works_for_the_report_only_role(self) -> None:
        """Refusing the pins must not disable the aggregate report.

        ``interactionsByRegion`` returns counts, which is what ``view_reports`` is for.
        The note scope belongs on the pins, not on the rollup.
        """
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        self.graphql_client.force_login(admin)
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


class InteractionMapOrgConfinementTestCase(InteractionMapBaseTestCase):
    """Org confinement is the SQL clause, not the permission filter.

    ``filter_for_user`` answers "does this user hold ``notes.view_note`` ⇒ every row", with
    no org awareness at all: a user holding it model-level (the legacy group is model-level)
    would otherwise receive every organization's coordinates that fall in the date window.
    """

    def test_only_the_requested_orgs_pins_are_returned(self) -> None:
        """Both orgs' notes share one location, so only the org predicate can separate them."""
        user = self.caseworker()
        self.assertEqual(self.note_there.location_id, self.note_here.location_id)

        result = self._map(user)
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(len(result["points"]), 1, "the other org's note must not be a pin")

    def test_the_other_org_cannot_be_read(self) -> None:
        """The report gate is per-org: authority at org_1 is not authority at org_2."""
        result = self._map(self.caseworker(), org_id=self.org_2.pk)
        self.assertIn("errors", result, "reading org_2 with authority only at org_1 must be denied")

    def test_an_unknown_org_id_fails_closed(self) -> None:
        """A bad org id is a permission problem, never a DoesNotExist crash."""
        result = self._map(self.caseworker(), org_id="99999999")
        self.assertIn("errors", result)
        self.assertNotIn("DoesNotExist", str(result["errors"]))


UNGROUPED_ROLLUP_QUERY = """
    query UngroupedRollup(
        $organizationId: ID!
        $startDate: Date
        $endDate: Date
    ) {
        interactionsByRegion(organizationId: $organizationId, startDate: $startDate, endDate: $endDate) {
            kind
            code
            name
            count
            isUnassigned
            unassignedReason
        }
    }
"""

REGION_DIMENSIONS_QUERY = """
    query RegionDimensions {
        regionDimensions
    }
"""


class InteractionMapRegionFilterTestCase(InteractionMapBaseTestCase):
    """``interactionMap(regionCodes: …)``, whose empty-list meaning is easiest to get backwards.

    Read as "absent", the predicate is dropped and a caller who asked for no regions receives
    every pin in the organization.
    """

    def setUp(self) -> None:
        super().setUp()
        when = datetime(2026, 1, 15, tzinfo=UTC)
        # A second note in org_1, well outside BOX_A.
        baker.make(
            Note,
            organization=self.org_1,
            interacted_at=when,
            location=baker.make(Location, point=Point(*OUTSIDE, srid=4326)),
        )

    def test_region_codes_narrow_the_pins(self) -> None:
        user = self.caseworker()

        unfiltered = self._map(user)
        self.assertNotIn("errors", unfiltered, unfiltered.get("errors"))
        self.assertEqual(len(unfiltered["points"]), 2, "precondition: both notes are pins")

        filtered = self._map(user, regionCodes=["1"])
        self.assertNotIn("errors", filtered, filtered.get("errors"))
        self.assertEqual(len(filtered["points"]), 1, "only the note inside BOX_A may remain")
        self.assertAlmostEqual(filtered["points"][0]["latitude"], 34.05, places=4)

    def test_a_code_with_no_region_returns_no_pins(self) -> None:
        result = self._map(self.caseworker(), regionCodes=["does-not-exist"])
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(result["points"], [])

    def test_an_empty_code_list_returns_no_pins_rather_than_every_pin(self) -> None:
        """``[]`` asks for no regions, matching ``interactionsByRegion``.

        Truthiness here means "absent": the filter is skipped and the caller gets the whole
        organization while believing it asked for nothing.
        """
        result = self._map(self.caseworker(), regionCodes=[])
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(result["points"], [], "an empty code list leaked every pin")

    def test_region_codes_without_a_dimension_are_refused(self) -> None:
        """A code is ambiguous across dimensions, so a dimension is required rather than guessed.

        ``"1"`` is a council district, an SPA and a supervisorial district in this data;
        returning any of them would be an answer the caller did not ask for.
        """
        result = self._map(self.caseworker(), dimension=None, regionCodes=["1"])
        self.assertIn("errors", result, "a code without a dimension must be refused, not guessed")


class UngroupedRollupTestCase(GraphQLBaseTestCase):
    """``interactionsByRegion`` with no dimension: every dimension in one response.

    Codes are not unique across dimensions, so the grouping is on ``(kind, code)``. Drop the
    kind and three unrelated regions merge into one bucket with a summed count and one
    arbitrary name.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.reader = baker.make(User)
        self.org_1.add_user(self.reader)
        OrgRoleManager(self.org_1).add_roles(self.reader, ORG_ADMIN)

        # The same code, "1", in two dimensions, in disjoint places.
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))
        Region.objects.create(kind=RegionKind.SPA, code="1", name="SPA 1", geom=box(BOX_B))

        when = datetime(2026, 1, 15, tzinfo=UTC)
        for point in (Point(-118.24, 34.05, srid=4326), Point(-118.54, 34.35, srid=4326)):
            baker.make(Note, organization=self.org_1, interacted_at=when, location=baker.make(Location, point=point))

    def test_the_same_code_in_two_dimensions_is_two_buckets(self) -> None:
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(
            UNGROUPED_ROLLUP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertIsNone(response.get("errors"), response.get("errors"))

        rows = response["data"]["interactionsByRegion"]
        named = {(row["kind"], row["code"]): row for row in rows if not row["isUnassigned"]}
        self.assertEqual(
            set(named),
            {("council_district", "1"), ("spa", "1")},
            f"a code must not merge across dimensions: {sorted(named)}",
        )
        self.assertEqual(named[("council_district", "1")]["count"], 1)
        self.assertEqual(named[("spa", "1")]["count"], 1)
        self.assertEqual(named[("council_district", "1")]["name"], "District 1")
        self.assertEqual(named[("spa", "1")]["name"], "SPA 1")

        # Each note is inside one dimension's boundary and outside the other, so each
        # dimension also reports the note it could not place — per dimension, not once for
        # the whole response. Grouping on the code alone would collapse these two into one.
        unassigned = {(row["kind"], row["unassignedReason"]) for row in rows if row["isUnassigned"]}
        self.assertEqual(
            unassigned,
            {("council_district", "OUTSIDE_ALL_REGIONS"), ("spa", "OUTSIDE_ALL_REGIONS")},
            f"unassigned buckets must be per dimension: {sorted(unassigned)}",
        )


class RegionDimensionsQueryTestCase(GraphQLBaseTestCase):
    """``regionDimensions`` and ``regions`` through the resolvers, not just the selectors.

    ``regionDimensions`` reports only the dimensions that have boundaries loaded, so the
    report's picker offers a control that returns rows.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.reader = baker.make(User)
        self.org_1.add_user(self.reader)
        Region.objects.create(kind=RegionKind.CITY, code="1", name="City 1", geom=box(BOX_A))

    def test_dimensions_report_what_is_loaded(self) -> None:
        self.graphql_client.force_login(self.reader)
        response = self.execute_graphql(REGION_DIMENSIONS_QUERY)
        self.assertIsNone(response.get("errors"), response.get("errors"))
        self.assertEqual(response["data"]["regionDimensions"], ["CITY"])
