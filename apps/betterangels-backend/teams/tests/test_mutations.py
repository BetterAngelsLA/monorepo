from accounts.tests.baker_recipes import organization_recipe
from model_bakery import baker
from unittest_parametrize import parametrize

from teams.models import Team

from .utils import TeamGraphQLUtilsMixin


class TeamMutationTestCase(TeamGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.org = organization_recipe.make()
        self.org_user = self.org.users.first()
        self.graphql_client.force_login(self.org_user)
        self._set_active_org(self.org)

    def test_create_team_mutation(self) -> None:
        variables = {"name": "team 1"}

        # Two more than the write itself needs: full_clean() validates the
        # organization FK, per the styleguide's full_clean-before-save rule.
        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.create_team_fixture(variables)

        team = response["data"]["createTeam"]

        self.assertEqual(team["name"], "team 1")
        self.assertTrue(team["isActive"])

    def test_update_team_mutation(self) -> None:
        team = baker.make(Team, name="old name", organization=self.org)
        variables = {"id": team.pk, "name": "new name", "isActive": False}

        # See test_create_team_mutation: full_clean() adds the FK validation.
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
        "new_name",
        [
            ("---",),
            ("   ",),
        ],
    )
    def test_update_team_mutation_invalid_name(self, new_name: str) -> None:
        """Empty/whitespace-only names are rejected and no partial update occurs."""
        team = baker.make(Team, name="name", organization=self.org)
        variables = {"id": team.pk, "name": new_name}

        response = self.update_team_fixture(variables)

        self.assertGraphQLOperationInfo(
            response,
            "updateTeam",
            "Team name must contain at least one alphanumeric character.",
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
