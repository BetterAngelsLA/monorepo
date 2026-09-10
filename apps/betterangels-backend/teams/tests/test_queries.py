"""Query tests for ``teams`` — the shape of the result, and who may see it.

``TeamsQueryTestCase`` covers the query itself: fields, pagination totals and
the ``isActive`` filter.  ``TeamQueryOrgScopingTestCase`` covers the other
half of the acceptance criterion for org-managed teams — the admin app lists
teams for the *active* organization, and another organization's teams are not
visible.  The editing half lives in ``test_mutations.py``.
"""

from typing import Any, Dict

from accounts.groups import ORG_ADMIN
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.utils import PERMISSION_DENIED_MESSAGE
from model_bakery import baker
from teams.models import Team

from .utils import TeamGraphQLBaseTestCase, TeamGraphQLUtilsMixin


class TeamsQueryTestCase(TeamGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        # Provision the Role rows so the recipe's owner gets mirrored Grants —
        # the teams read is grant-only (teams.view_team).
        sync_roles()
        self.org = organization_recipe.make()
        self.org_user = self.org.users.first()
        self.team = baker.make(Team, name="team 1", organization=self.org)
        self.graphql_client.force_login(self.org_user)

    def _list(self, org: Any) -> Dict[str, Any]:
        """List teams of *org* — the org travels in the filter payload."""
        return self.execute_graphql(
            self.get_teams_query(), {"filters": {"organizationId": str(org.pk)}}
        )

    def test_teams_query(self) -> None:
        # require_can (→ can → scopes) adds grant-arm queries over the old
        # membership-only read.
        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._list(self.org)

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        team = response["data"]["teams"]["results"][0]
        self.assertEqual(team["id"], str(self.team.pk))
        self.assertEqual(team["name"], self.team.name)
        self.assertTrue(team["isActive"])

    def test_teams_query_is_scoped_to_org(self) -> None:
        """Teams from other organizations are not returned."""
        other_org = organization_recipe.make()
        other_org_team = baker.make(Team, organization=other_org)

        response = self._list(self.org)

        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        teams = response["data"]["teams"]["results"]
        self.assertIn(str(self.team.pk), [team["id"] for team in teams])
        self.assertNotIn(str(other_org_team.pk), [team["id"] for team in teams])

        # Requery at the other org — a role at the new org grants the read.
        assert self.org_user is not None
        other_org.add_user(self.org_user)
        OrgRoleManager(other_org).add_roles(self.org_user, ORG_ADMIN)

        response = self._list(other_org)
        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        teams = response["data"]["teams"]["results"]
        self.assertIn(str(other_org_team.pk), [team["id"] for team in teams])
        self.assertNotIn(str(self.team.pk), [team["id"] for team in teams])

    def test_teams_query_filter(self) -> None:
        inactive_team = baker.make(Team, name="inactive team", organization=self.org)

        variables = {"filters": {"organizationId": str(self.org.pk), "isActive": True}}
        response = self.execute_graphql(self.get_teams_query(), variables)

        self.assertEqual(response["data"]["teams"]["totalCount"], 2)

        inactive_team.is_active = False
        inactive_team.save()

        variables = {"filters": {"organizationId": str(self.org.pk), "isActive": True}}
        response = self.execute_graphql(self.get_teams_query(), variables)

        self.assertEqual(response["data"]["teams"]["totalCount"], 1)


class TeamQueryOrgScopingTestCase(TeamGraphQLBaseTestCase):
    def _assert_denied(self, response: Dict[str, Any], message: str) -> None:
        """Assert the request was refused for the *expected* reason.

        The message check matters: an unhandled ``ValueError`` from a malformed
        id also has ``errors`` and no data, so asserting only that would pass
        while the API crashed instead of denying.
        """
        errors = response.get("errors") or []
        self.assertTrue(errors)
        self.assertIsNone((response.get("data") or {}).get("teams"))
        self.assertEqual(errors[0]["message"], message)

    def _list(self, org: Any) -> Dict[str, Any]:
        return self.execute_graphql(
            self.get_teams_query(), {"filters": {"organizationId": str(org.pk)}}
        )

    def test_returns_only_the_filters_orgs_teams(self) -> None:
        response = self._list(self.org_1)

        results = response["data"]["teams"]["results"]
        returned_ids = {int(row["id"]) for row in results}
        org_1_ids = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))

        self.assertEqual(returned_ids, org_1_ids)
        self.assertEqual(returned_ids & org_2_ids, set())

    def test_org_filter_selects_the_org(self) -> None:
        """Same user, different org in the filter — the payload decides."""
        self.org_2.add_user(self.org_1_admin)
        OrgRoleManager(self.org_2).add_roles(self.org_1_admin, ORG_ADMIN)
        # A stale header naming org_1 is ignored once the filter names org_2.
        self._set_active_org(self.org_1)

        results = self._list(self.org_2)["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_2_ids)

    def test_reads_with_the_filter_and_no_header(self) -> None:
        """A payload org is enough — the header is not required (mobile migration prep)."""
        del self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"]

        results = self._list(self.org_1)["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_1_ids = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_1_ids)
        self.assertEqual(returned_ids & org_2_ids, set())

    def test_reads_fall_back_to_the_header_without_a_filter(self) -> None:
        """The deprecated fallback: no filter means the header names the org.

        Mobile's ``useOrgTeams`` callers still send only ``{ isActive }``; this
        pin comes out when they pass ``organizationId`` (DEV-2566).
        """
        response = self.execute_graphql(self.get_teams_query())

        results = response["data"]["teams"]["results"]
        returned_ids = {int(row["id"]) for row in results}
        org_1_ids = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))

        self.assertEqual(returned_ids, org_1_ids)
        self.assertEqual(returned_ids & org_2_ids, set())

    def test_follows_the_active_org_header(self) -> None:
        """Same user, different org in the header — the fallback decides."""
        self.org_2.add_user(self.org_1_admin)
        OrgRoleManager(self.org_2).add_roles(self.org_1_admin, ORG_ADMIN)
        self._set_active_org(self.org_2)

        results = self.execute_graphql(self.get_teams_query())["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_2_ids)

    def test_an_explicitly_null_organization_id_keeps_the_header_fallback(self) -> None:
        """Only a *missing* org id falls back to the header; null reads as missing."""
        response = self.execute_graphql(self.get_teams_query(), {"filters": {"organizationId": None}})

        self.assertIsNone(response.get("errors"))
        returned = {int(row["id"]) for row in response["data"]["teams"]["results"]}
        expected = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        self.assertEqual(returned, expected)

    def test_requires_an_org_in_the_filter_or_header(self) -> None:
        """No payload org and no header — the read is denied."""
        self.assertEqual(self.org_1_admin.organizations_organization.count(), 1)
        del self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"]

        self._assert_denied(
            self.execute_graphql(self.get_teams_query()),
            "Organization ID (X-Organization-ID header) is required.",
        )

    def test_denies_an_org_the_user_does_not_belong_to(self) -> None:
        """The header names the org; it does not grant access to it.

        Regression: the query trusted the header outright, so any authenticated
        user could read any organization's teams by setting it. Every other
        test here sets the header to an org the user belongs to, which is why
        it went unnoticed.
        """
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.assertFalse(self.org_2.users.filter(pk=self.org_1_case_manager_1.pk).exists())
        self._set_active_org(self.org_2)

        self._assert_denied(
            self.execute_graphql(self.get_teams_query()),
            PERMISSION_DENIED_MESSAGE,
        )

    def test_denies_an_org_the_user_has_no_grant_in(self) -> None:
        """The filter names the org; it does not grant access to it.

        A caseworker holds CASEWORKER at org_1 (no org_2 authority), so naming
        org_2 in the filter is denied even though the header names org_1.
        """
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.assertFalse(self.org_2.users.filter(pk=self.org_1_case_manager_1.pk).exists())
        self._set_active_org(self.org_1)

        self._assert_denied(self._list(self.org_2), PERMISSION_DENIED_MESSAGE)

    def test_denies_a_malformed_header(self) -> None:
        self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"] = "not-an-id"

        self._assert_denied(
            self.execute_graphql(self.get_teams_query()),
            "You do not have access to this organization.",
        )

    def test_denies_an_unknown_filter_org(self) -> None:
        response = self.execute_graphql(
            self.get_teams_query(), {"filters": {"organizationId": "999999999"}}
        )

        self._assert_denied(response, "You do not have access to this organization.")

    def test_a_non_numeric_organization_id_filter_denies(self) -> None:
        """Garbage in the org filter denies like an unknown org, not a crash."""
        response = self.execute_graphql(self.get_teams_query(), {"filters": {"organizationId": "not-an-id"}})
        self._assert_denied(response, "You do not have access to this organization.")

    def test_an_empty_organization_id_filter_denies(self) -> None:
        """A present-but-blank org id denies — it must not fall back to the header."""
        response = self.execute_graphql(self.get_teams_query(), {"filters": {"organizationId": ""}})
        self._assert_denied(response, "You do not have access to this organization.")
