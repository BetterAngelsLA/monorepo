"""Mutation tests for teams — the CRUD surface, and who may use it.

``TeamMutationTestCase`` covers create, update and delete with their
validation.  ``TeamMutationOrgScopingTestCase`` covers the editing half of the
acceptance criterion for org-managed teams: the admin app edits teams for the
active organization, and another organization's teams cannot be renamed or
deleted.  The visibility half lives in ``test_queries.py``.
"""

from accounts.tests.baker_recipes import organization_recipe
from model_bakery import baker
from teams.models import Team
from unittest_parametrize import parametrize

from .utils import TeamGraphQLBaseTestCase, TeamGraphQLUtilsMixin


class TeamMutationTestCase(TeamGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.org = organization_recipe.make()
        self.org_user = self.org.users.first()
        self.graphql_client.force_login(self.org_user)
        self._set_active_org(self.org)

    def test_create_team_mutation(self) -> None:
        variables = {"name": "team 1"}

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.create_team_fixture(variables)

        team = response["data"]["createTeam"]

        self.assertEqual(team["name"], "team 1")
        self.assertTrue(team["isActive"])

    def test_update_team_mutation(self) -> None:
        team = baker.make(Team, name="old name", organization=self.org)
        variables = {"id": team.pk, "name": "new name", "isActive": False}

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.update_team_fixture(variables)

        team = response["data"]["updateTeam"]

        self.assertEqual(team["name"], "new name")
        self.assertFalse(team["isActive"])

    @parametrize(
        "field, value",
        [("name", "new name"), ("isActive", False)],
    )
    def test_update_team_mutation_partial(self, field: str, value: str | bool) -> None:
        team = baker.make(Team, name="name", organization=self.org)
        variables = {"id": team.pk, field: value}

        response = self.update_team_fixture(variables)
        team = response["data"]["updateTeam"]

        self.assertEqual(team[field], value)

    @parametrize(
        "new_name, expected_message",
        [
            ("---", "Team name must contain at least one alphanumeric character."),
            ("   ", "This field cannot be blank."),
        ],
    )
    def test_update_team_mutation_invalid_name(self, new_name: str, expected_message: str) -> None:
        """A name with no readable content is rejected and no partial update occurs.

        The two inputs trip different rules: "---" the ``validate_has_alphanumeric``
        field validator, and a whitespace-only name ``blank=False``, since
        ``team_update`` strips it to the empty string first and ``full_clean()``
        skips validators for an empty value.
        """
        team = baker.make(Team, name="name", organization=self.org)
        variables = {"id": team.pk, "name": new_name}

        response = self.update_team_fixture(variables)

        self.assertGraphQLOperationInfo(
            response,
            "updateTeam",
            expected_message,
            kind="VALIDATION",
        )

        team.refresh_from_db()
        self.assertEqual(team.name, "name")

    def test_delete_team_mutation(self) -> None:
        team = baker.make(Team, name="team", organization=self.org)

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.delete_team_fixture(team.pk)

        self.assertEqual(response["data"]["deleteTeam"]["id"], team.pk)
        self.assertFalse(Team.objects.filter(id=team.pk).exists())


class TeamMutationOrgScopingTestCase(TeamGraphQLBaseTestCase):
    # -- createTeam ---------------------------------------------------------

    def test_create_team_lands_in_the_active_org(self) -> None:
        response = self.create_team_fixture({"name": "Night Outreach"})

        team_id = response["data"]["createTeam"]["id"]
        self.assertEqual(Team.objects.get(pk=team_id).organization_id, self.org_1.pk)

    # -- updateTeam ---------------------------------------------------------

    def test_update_team_renames_a_team_in_the_active_org(self) -> None:
        response = self.update_team_fixture({"id": str(self.org_1_team_1.pk), "name": "WDI Onsite"})

        self.assertEqual(response["data"]["updateTeam"]["name"], "WDI Onsite")
        self.org_1_team_1.refresh_from_db()
        self.assertEqual(self.org_1_team_1.name, "WDI Onsite")

    def test_update_team_cannot_touch_another_orgs_team(self) -> None:
        original_name = self.org_2_team_1.name

        response = self.update_team_fixture({"id": str(self.org_2_team_1.pk), "name": "Renamed by org 1"})

        self.assertGraphQLOperationInfo(
            response,
            "updateTeam",
            "You do not have permission to update this team.",
            kind="PERMISSION",
        )
        self.org_2_team_1.refresh_from_db()
        self.assertEqual(self.org_2_team_1.name, original_name)

    # -- deleteTeam ---------------------------------------------------------

    def test_delete_team_removes_a_team_in_the_active_org(self) -> None:
        response = self.delete_team_fixture(self.org_1_team_1.pk)

        self.assertIsNotNone(response["data"]["deleteTeam"]["id"])
        self.assertFalse(Team.objects.filter(pk=self.org_1_team_1.pk).exists())

    def test_delete_team_cannot_touch_another_orgs_team(self) -> None:
        response = self.delete_team_fixture(self.org_2_team_1.pk)

        self.assertGraphQLOperationInfo(
            response,
            "deleteTeam",
            "You do not have permission to delete this team.",
            kind="PERMISSION",
        )
        self.assertTrue(Team.objects.filter(pk=self.org_2_team_1.pk).exists())
