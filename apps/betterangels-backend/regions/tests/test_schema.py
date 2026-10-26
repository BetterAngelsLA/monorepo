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

from django.contrib.gis.geos import Point
from django.core.cache import cache
from model_bakery import baker

from accounts.groups import ORG_ADMIN
from accounts.models import OrganizationProfile, OrgTypeChoices, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from common.models import Location
from common.tests.utils import GraphQLBaseTestCase, make_legacy_only_holder
from notes.groups import CASEWORKER
from notes.models import Note
from regions.models import Region, RegionKind

from .helpers import BOX_A, BOX_B, OUTSIDE, box

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
        # The other half of the pair, and the reason this test exists: `include_locationless` is
        # deliberately the *opposite* reading, because a note with no location was never
        # attributable to a region and so cannot be excluded by a filter asking for none.
        self.assertIn(
            "NO_LOCATION",
            reasons,
            "an empty code list dropped the locationless total, which no code filter can exclude",
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
            withheld
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
      (``CASEWORKER_ROLE`` carries ``Team.perms.VIEW`` plus the referral grants,
      not note permissions).

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
        """The map query, with no region filter unless the caller adds one.

        A dimension means nothing here on its own — pins are not grouped — so the helper omits
        it and each filtered test passes the pair, the same way the resolver now reads it.
        """
        self.graphql_client.force_login(user)
        variables: dict[str, Any] = {
            "organizationId": str(org_id if org_id is not None else self.org_1.pk),
            "startDate": "2026-01-01",
            "endDate": "2026-01-31",
        }
        variables.update(overrides)
        response = self.execute_graphql(INTERACTION_MAP_QUERY, variables)
        if response.get("errors"):
            return {"errors": response["errors"]}
        return cast(dict[str, Any], response["data"]["interactionMap"])


INTERACTION_SCOPE_QUERY = """
    query InteractionScope($organizationId: ID!, $startDate: Date, $endDate: Date) {
        interactionScope(
            organizationId: $organizationId
            startDate: $startDate
            endDate: $endDate
        ) {
            withheld
        }
    }
"""


DENSITY_SCALE_QUERY = """
    query DensityScale(
        $organizationId: ID!
        $zoom: Int!
        $dimension: RegionDimension
        $startDate: Date
        $endDate: Date
        $regionCodes: [String!]
    ) {
        densityScale(
            organizationId: $organizationId
            zoom: $zoom
            dimension: $dimension
            startDate: $startDate
            endDate: $endDate
            regionCodes: $regionCodes
        ) {
            p50
            p90
            p95
            max
        }
    }
"""


class InteractionScopeQueryTestCase(InteractionMapBaseTestCase):
    """``interactionScope``: the one question the density view cannot get from a tile.

    A cell-free tile is a 204, and an MVT has no field to say whether it was empty or
    withheld, so the grid asks this instead. It carries the same gates as ``interactionMap``
    — that is the whole point — so the cases worth pinning are the ones where the flag and the
    pins could disagree.
    """

    def _scope(self, user: User, **overrides: Any) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        variables: dict[str, Any] = {
            "organizationId": str(self.org_1.pk),
            "startDate": "2026-01-01",
            "endDate": "2026-01-31",
        }
        variables.update(overrides)
        response = self.execute_graphql(INTERACTION_SCOPE_QUERY, variables)
        if response.get("errors"):
            return {"errors": response["errors"]}
        return cast(dict[str, Any], response["data"]["interactionScope"])

    def test_a_caseworker_is_not_withheld(self) -> None:
        result = self._scope(self.caseworker())
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertFalse(result["withheld"])

    def test_a_report_only_role_is_withheld(self) -> None:
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        result = self._scope(admin)
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertTrue(result["withheld"], "the note scope removed every pin, so the grid is withheld")

    def test_an_empty_window_is_not_withheld(self) -> None:
        """The flag is about the note scope, not about a quiet period.

        A window with no interactions at all is empty for a reason the reader can act on, and
        calling that withheld would be the same false diagnosis in the other direction.
        """
        result = self._scope(self.caseworker(), startDate="2025-01-01", endDate="2025-01-31")
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertFalse(result["withheld"])

    def test_it_requires_a_session(self) -> None:
        self.graphql_client.logout()
        response = self.execute_graphql(
            INTERACTION_SCOPE_QUERY,
            {"organizationId": str(self.org_1.pk), "startDate": "2026-01-01", "endDate": "2026-01-31"},
        )
        self.assertGraphQLUnauthenticated(response)


class DensityScaleQueryTestCase(InteractionMapBaseTestCase):
    """The colour domain carries the same note and region scope as the tiles it colours."""

    def setUp(self) -> None:
        super().setUp()
        cache.clear()

    def _scale(self, user: User, **overrides: Any) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        variables: dict[str, Any] = {
            "organizationId": str(self.org_1.pk),
            "zoom": 12,
            "startDate": "2026-01-01",
            "endDate": "2026-01-31",
        }
        variables.update(overrides)
        response = self.execute_graphql(DENSITY_SCALE_QUERY, variables)
        if response.get("errors"):
            return {"errors": response["errors"]}
        return cast(dict[str, Any], response["data"]["densityScale"])

    def test_caseworker_sees_the_same_cells_as_the_map(self) -> None:
        result = self._scale(self.caseworker())

        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(result["p50"], 1.0)
        self.assertEqual(result["p90"], 1.0)
        self.assertEqual(result["p95"], 1.0)
        self.assertEqual(result["max"], 1)

    def test_a_report_only_role_has_no_scale(self) -> None:
        admin = baker.make(User)
        self.org_1.add_user(admin)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        self.assertIsNone(self._scale(admin))

    def test_empty_codes_match_nothing(self) -> None:
        self.assertIsNone(self._scale(self.caseworker(), regionCodes=[]))

    def test_codes_without_a_dimension_are_refused(self) -> None:
        result = self._scale(self.caseworker(), regionCodes=["1"])

        self.assertIn("errors", result)
        self.assertEqual(
            result["errors"][0]["extensions"]["errors"][0]["errorCode"],
            "REGION_CODES_REQUIRE_DIMENSION",
        )


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
        # The negative control for `withheld`: this role holds the note scope, so a non-empty
        # payload must not claim one was applied.
        self.assertFalse(result["withheld"], "a reader who can see notes was told the payload was withheld")

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
        # An empty list for two different reasons, and this is what tells them apart: the
        # period holds interactions (the caseworker's own test above proves it) and the note
        # scope removed all of them. Without the flag a client reports the permission answer
        # as "0 interactions", which is a claim about the neighbourhood.
        self.assertTrue(
            result["withheld"],
            "an empty payload caused by the note scope must say so, or the client renders it as no interactions",
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
        buckets = response["data"]["interactionsByRegion"]
        # The count, not truthiness: a non-empty list of zero-count buckets would satisfy
        # `assertTrue` while meaning the rollup found nothing.
        self.assertEqual([bucket["count"] for bucket in buckets], [1])


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
        """A bad org id is a permission problem, never a DoesNotExist crash.

        The *message* is asserted, not the absence of ``"DoesNotExist"``: a Graphene error for
        ``Organization.DoesNotExist`` renders as "Organization matching query does not exist.",
        which never contains that token — so an ``assertNotIn("DoesNotExist", …)`` passes
        whatever the code does and guards nothing.
        """
        result = self._map(self.caseworker(), org_id="99999999")
        self.assertIn("errors", result)
        self.assertEqual(result["errors"][0]["message"], "You do not have access to this organization.")


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
        regionDimensions {
            value
            label
            plural
        }
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

        filtered = self._map(user, dimension="COUNCIL_DISTRICT", regionCodes=["1"])
        self.assertNotIn("errors", filtered, filtered.get("errors"))
        self.assertEqual(len(filtered["points"]), 1, "only the note inside BOX_A may remain")
        self.assertAlmostEqual(filtered["points"][0]["latitude"], 34.05, places=4)

    def test_a_code_with_no_region_returns_no_pins(self) -> None:
        result = self._map(self.caseworker(), dimension="COUNCIL_DISTRICT", regionCodes=["does-not-exist"])
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(result["points"], [])

    def test_an_empty_code_list_returns_no_pins_rather_than_every_pin(self) -> None:
        """``[]`` asks for no regions, matching ``interactionsByRegion``.

        Truthiness here means "absent": the filter is skipped and the caller gets the whole
        organization while believing it asked for nothing.
        """
        result = self._map(self.caseworker(), dimension="COUNCIL_DISTRICT", regionCodes=[])
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(result["points"], [], "an empty code list leaked every pin")

    def test_a_dimension_without_region_codes_is_refused(self) -> None:
        """The mirror of the case below, and the rule the density tile already applied.

        A pins query is not grouped, so a dimension on its own narrows nothing; silently
        ignoring it answered "where were the interactions in this dimension" with every
        interaction. Refusing is the same reading `resolve_region_scope` gives the pair on
        every surface, and it is what makes the code below reachable from both.
        """
        result = self._map(self.caseworker(), dimension="COUNCIL_DISTRICT")
        self.assertIn("errors", result, "a dimension without codes must be refused, not ignored")
        self.assertEqual(
            result["errors"][0]["extensions"]["errors"],
            [{"field": "dimension", "location": None, "errorCode": "DIMENSION_REQUIRES_REGION_CODES"}],
        )

    def test_region_codes_without_a_dimension_are_refused(self) -> None:
        """A code is ambiguous across dimensions, so a dimension is required rather than guessed.

        ``"1"`` is a council district, an SPA and a supervisorial district in this data;
        returning any of them would be an answer the caller did not ask for.

        The refusal is machine-readable: ``field`` names the argument to revisit and
        ``errorCode`` is the value a client switches on, asserted literally because it is the
        wire contract the density view also returns. The English message is not the contract.
        """
        result = self._map(self.caseworker(), dimension=None, regionCodes=["1"])
        self.assertIn("errors", result, "a code without a dimension must be refused, not guessed")
        self.assertEqual(
            result["errors"][0]["extensions"]["errors"],
            [{"field": "regionCodes", "location": None, "errorCode": "REGION_CODES_REQUIRE_DIMENSION"}],
        )


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
    """``regionDimensions`` through the resolver, not just the selector.

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
        # The names travel with the value, so a client renders the vocabulary instead of keeping
        # its own copy of it — and the plural is the part that cannot be derived from the label.
        self.assertEqual(
            response["data"]["regionDimensions"],
            [{"value": "CITY", "label": "City", "plural": "Cities"}],
        )


class RegionQueryAuthenticationTestCase(GraphQLBaseTestCase):
    """All three region queries are ``IsAuthenticated``; none may answer an anonymous caller.

    The two tile views assert the same refusal, and they are separate code paths — a permission
    class on the resolvers is the only thing that protects the GraphQL surface, so it needs its
    own assertion rather than inheriting confidence from the DRF views.
    """

    def test_interactions_by_region_requires_a_session(self) -> None:
        self.graphql_client.logout()
        response = self.execute_graphql(
            ROLLUP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "dimension": "COUNCIL_DISTRICT",
                "regionCodes": None,
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertGraphQLUnauthenticated(response)

    def test_interaction_map_requires_a_session(self) -> None:
        self.graphql_client.logout()
        response = self.execute_graphql(
            INTERACTION_MAP_QUERY,
            {
                "organizationId": str(self.org_1.pk),
                "dimension": "COUNCIL_DISTRICT",
                "startDate": "2026-01-01",
                "endDate": "2026-01-31",
            },
        )
        self.assertGraphQLUnauthenticated(response)

    def test_region_dimensions_requires_a_session(self) -> None:
        """The query takes no arguments and reads no client data — the gate is still a session."""
        self.graphql_client.logout()
        response = self.execute_graphql(REGION_DIMENSIONS_QUERY)
        self.assertGraphQLUnauthenticated(response)


class InteractionMapLimitTestCase(InteractionMapBaseTestCase):
    """The ``limit`` argument end to end: the cap, the floor, and the ``truncated`` flag.

    Declared on the field and exercised only through the selector before this: a resolver that
    dropped the argument, or turned ``0`` into the cap, would have kept every test green.
    """

    def setUp(self) -> None:
        super().setUp()
        when = datetime(2026, 1, 15, tzinfo=UTC)
        # setUp put one note in org_1; add four more so the cap has something to cut.
        for index in range(1, 5):
            baker.make(
                Note,
                organization=self.org_1,
                interacted_at=when,
                location=baker.make(Location, point=Point(-118.24 + index * 0.001, 34.05, srid=4326)),
            )

    def test_an_omitted_limit_returns_every_pin_untruncated(self) -> None:
        result = self._map(self.caseworker())
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(len(result["points"]), 5)
        self.assertFalse(result["truncated"])

    def test_a_limit_below_the_pin_count_truncates_and_says_so(self) -> None:
        result = self._map(self.caseworker(), limit=2)
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(len(result["points"]), 2)
        self.assertTrue(result["truncated"], "a partial map that looks complete is worse than a slow one")

    def test_limit_zero_returns_one_pin_rather_than_the_cap(self) -> None:
        """``0`` is the selector's floor, not "absent".

        ``limit or POINT_LIMIT`` turned a client's ``0`` into the 10,000 cap — the opposite of
        the contract ``interaction_points`` encodes with ``max(1, min(limit, …))``.
        """
        result = self._map(self.caseworker(), limit=0)
        self.assertNotIn("errors", result, result.get("errors"))
        self.assertEqual(len(result["points"]), 1, "`limit: 0` must clamp to one, not to the cap")
        self.assertTrue(result["truncated"])


class ReportCalendarTimeZoneTestCase(GraphQLBaseTestCase):
    """The **organization's** calendar cuts the region range, not the server's.

    ``report_calendar_time_zone(org)`` is applied in every region resolver, but no regions test
    gave an org a zone, so a resolver that read the active timezone instead would have agreed
    with every other fixture. Tokyo is UTC+9, so an instant late on 31 January UTC is already
    1 February there and falls outside a January request.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        # A caseworker: the map needs the note read scope as well as the report grant, and the
        # legacy holder is created before the role so `make_legacy_only_holder`'s grant purge
        # cannot revoke it.
        self.reader = make_legacy_only_holder(
            user=baker.make(User), organization=self.org_1, template_name=CASEWORKER.name
        )
        OrgRoleManager(self.org_1).add_roles(self.reader, ORG_ADMIN)
        OrganizationProfile.objects.update_or_create(
            organization=self.org_1,
            defaults={"org_types": [OrgTypeChoices.OUTREACH], "time_zone": "Asia/Tokyo"},
        )
        Region.objects.create(kind=RegionKind.COUNCIL_DISTRICT, code="1", name="District 1", geom=box(BOX_A))

        shared = baker.make(Location, point=Point(-118.24, 34.05, srid=4326))
        baker.make(Note, organization=self.org_1, interacted_at=datetime(2026, 1, 15, tzinfo=UTC), location=shared)
        # 2026-01-31T16:00Z is inside January in UTC and 2026-02-01 01:00 in Tokyo.
        baker.make(Note, organization=self.org_1, interacted_at=datetime(2026, 1, 31, 16, tzinfo=UTC), location=shared)

        self.graphql_client.force_login(self.reader)

    def _variables(self) -> dict[str, Any]:
        return {
            "organizationId": str(self.org_1.pk),
            "dimension": "COUNCIL_DISTRICT",
            "startDate": "2026-01-01",
            "endDate": "2026-01-31",
        }

    def test_a_note_past_the_orgs_calendar_day_is_excluded_from_the_rollup(self) -> None:
        response = self.execute_graphql(ROLLUP_QUERY, {**self._variables(), "regionCodes": None})
        self.assertIsNone(response.get("errors"), response.get("errors"))
        counts = {
            bucket["code"]: bucket["count"]
            for bucket in response["data"]["interactionsByRegion"]
            if not bucket["isUnassigned"]
        }
        self.assertEqual(counts, {"1": 1}, "the org's calendar was not applied")

    def test_the_map_applies_the_same_calendar(self) -> None:
        response = self.execute_graphql(INTERACTION_MAP_QUERY, {**self._variables(), "dimension": None})
        self.assertIsNone(response.get("errors"), response.get("errors"))
        self.assertEqual(
            len(response["data"]["interactionMap"]["points"]),
            1,
            "the map counted a note the org's calendar places outside the month",
        )
