from accounts.tests.baker_recipes import organization_recipe
from model_bakery import baker
from notes.models import Note
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

    def test_update_team_mutation_reports_a_team_in_use(self) -> None:
        """The updateTeam payload reports a team a note holds as in use."""
        team = baker.make(Team, name="held", organization=self.org)
        baker.make(Note, organization=self.org, team=team)

        response = self.update_team_fixture({"id": team.pk, "name": "renamed"})

        self.assertTrue(response["data"]["updateTeam"]["isInUse"])

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

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.delete_team_fixture(team.pk)

        self.assertEqual(response["data"]["deleteTeam"]["id"], team.pk)
        self.assertFalse(Team.objects.filter(id=team.pk).exists())

    def test_delete_team_mutation_refuses_a_team_in_use(self) -> None:
        team = baker.make(Team, name="team", organization=self.org)
        baker.make(Note, organization=self.org, team=team)

        response = self.delete_team_fixture(team.pk)

        self.assertGraphQLOperationInfo(
            response,
            "deleteTeam",
            'Cannot delete "team": it is used by 1 note. '
            "Deactivate it instead — an inactive team is hidden in the app but keeps its history.",
            kind="VALIDATION",
        )
        self.assertTrue(Team.objects.filter(id=team.pk).exists())
