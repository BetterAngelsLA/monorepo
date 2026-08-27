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
from accounts.tests.baker_recipes import organization_recipe
from django.db import connection
from django.test.utils import CaptureQueriesContext
from model_bakery import baker
from notes.models import Note
from tasks.models import Task
from teams.models import Team

from .utils import TeamGraphQLBaseTestCase, TeamGraphQLUtilsMixin


class TeamsQueryTestCase(TeamGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.org = organization_recipe.make()
        self.org_user = self.org.users.first()
        self.team = baker.make(Team, name="team 1", organization=self.org)
        self.graphql_client.force_login(self.org_user)
        self._set_active_org(self.org)

    def test_teams_query(self) -> None:
        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_teams_query())

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        team = response["data"]["teams"]["results"][0]
        self.assertEqual(team["id"], str(self.team.pk))
        self.assertEqual(team["name"], self.team.name)
        self.assertTrue(team["isActive"])

    def test_reports_a_team_no_record_holds_as_free(self) -> None:
        team = self.execute_graphql(self.get_teams_query())["data"]["teams"]["results"][0]

        self.assertFalse(team["isInUse"])

    def test_reports_a_team_a_note_holds_as_in_use(self) -> None:
        baker.make(Note, organization=self.org, team=self.team)

        team = self.execute_graphql(self.get_teams_query())["data"]["teams"]["results"][0]

        self.assertTrue(team["isInUse"])

    def test_reports_a_team_a_task_holds_as_in_use(self) -> None:
        baker.make(Task, organization=self.org, team=self.team)

        team = self.execute_graphql(self.get_teams_query())["data"]["teams"]["results"][0]

        self.assertTrue(team["isInUse"])

    def test_is_in_use_is_not_computed_when_it_is_not_selected(self) -> None:
        with CaptureQueriesContext(connection) as captured:
            self.execute_graphql(self.get_teams_query(fields="id name"))

        self.assertNotIn("notes_note", self._team_sql(captured))

    def test_is_in_use_is_computed_when_it_is_selected(self) -> None:
        with CaptureQueriesContext(connection) as captured:
            self.execute_graphql(self.get_teams_query(fields="id isInUse"))

        self.assertIn("notes_note", self._team_sql(captured))

    def test_is_in_use_costs_no_query_per_team(self) -> None:
        baker.make(Team, organization=self.org, _quantity=4)

        with self.assertNumQueriesWithoutCache(4):
            self.execute_graphql(self.get_teams_query())

    @staticmethod
    def _team_sql(captured: CaptureQueriesContext) -> str:
        return " ".join(q["sql"] for q in captured.captured_queries if "teams_team" in q["sql"])

    def test_teams_query_is_scoped_to_org(self) -> None:
        """Teams from other organizations are not returned."""
        other_org = organization_recipe.make()
        other_org_team = baker.make(Team, organization=other_org)

        response = self.execute_graphql(self.get_teams_query())

        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        teams = response["data"]["teams"]["results"]
        self.assertIn(str(self.team.pk), [team["id"] for team in teams])
        self.assertNotIn(str(other_org_team.pk), [team["id"] for team in teams])

        # change active org and requery
        assert self.org_user is not None
        other_org.add_user(self.org_user)
        self._set_active_org(other_org)

        response = self.execute_graphql(self.get_teams_query())
        self.assertEqual(response["data"]["teams"]["totalCount"], 1)

        teams = response["data"]["teams"]["results"]
        self.assertIn(str(other_org_team.pk), [team["id"] for team in teams])
        self.assertNotIn(str(self.team.pk), [team["id"] for team in teams])

    def test_teams_query_filter(self) -> None:
        inactive_team = baker.make(Team, name="inactive team", organization=self.org)

        variables = {"filters": {"isActive": True}}
        response = self.execute_graphql(self.get_teams_query(), variables)

        self.assertEqual(response["data"]["teams"]["totalCount"], 2)

        inactive_team.is_active = False
        inactive_team.save()

        variables = {"filters": {"isActive": True}}
        response = self.execute_graphql(self.get_teams_query(), variables)

        self.assertEqual(response["data"]["teams"]["totalCount"], 1)


class TeamQueryOrgScopingTestCase(TeamGraphQLBaseTestCase):
    def _assert_denied(self, response: Dict[str, Any]) -> None:
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("teams"))

    def test_returns_only_the_active_orgs_teams(self) -> None:
        response = self.execute_graphql(self.get_teams_query())

        results = response["data"]["teams"]["results"]
        returned_ids = {int(row["id"]) for row in results}
        org_1_ids = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))

        self.assertEqual(returned_ids, org_1_ids)
        self.assertEqual(returned_ids & org_2_ids, set())

    def test_follows_the_active_org_header(self) -> None:
        """Same user, different active org — the header decides."""
        self.org_2.add_user(self.org_1_admin)
        OrgRoleManager(self.org_2).add_roles(self.org_1_admin, ORG_ADMIN)
        self._set_active_org(self.org_2)

        results = self.execute_graphql(self.get_teams_query())["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_2_ids)

    def test_requires_the_active_org_header(self) -> None:
        """The server must not guess — first-match is how other orgs leaked."""
        del self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"]

        self._assert_denied(self.execute_graphql(self.get_teams_query()))

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

        self._assert_denied(self.execute_graphql(self.get_teams_query()))

    def test_denies_a_malformed_header(self) -> None:
        self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"] = "not-an-id"

        self._assert_denied(self.execute_graphql(self.get_teams_query()))
