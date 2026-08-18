"""Org admins may manage only their own organization's teams.

Half of the acceptance criterion for org-managed teams: the admin app edits
teams for the active organization, and another organization's teams cannot be
renamed or deleted.  The visibility half lives in ``test_queries.py``.
"""

from typing import Any, Dict

from django.test import ignore_warnings
from teams.models import Team
from teams.tests.utils import TEAM_FIELDS, TeamGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class TeamMutationOrgScopingTestCase(TeamGraphQLBaseTestCase):
    # -- createTeam ---------------------------------------------------------

    def _create_team(self, name: str) -> Dict[str, Any]:
        mutation = f"""
            mutation ($data: CreateTeamInput!) {{
                createTeam(data: $data) {{
                    ... on OperationInfo {{ messages {{ kind field message }} }}
                    ... on TeamType {{ {TEAM_FIELDS} }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": {"name": name}})

    def test_create_team_lands_in_the_active_org(self) -> None:
        response = self._create_team("Night Outreach")

        team_id = response["data"]["createTeam"]["id"]
        self.assertEqual(Team.objects.get(pk=team_id).organization_id, self.org_1.pk)

    # -- updateTeam ---------------------------------------------------------

    def _update_team(self, team_id: Any, name: str) -> Dict[str, Any]:
        mutation = f"""
            mutation ($data: UpdateTeamInput!) {{
                updateTeam(data: $data) {{
                    ... on OperationInfo {{ messages {{ kind field message }} }}
                    ... on TeamType {{ {TEAM_FIELDS} }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": {"id": str(team_id), "name": name}})

    def test_update_team_renames_a_team_in_the_active_org(self) -> None:
        response = self._update_team(self.org_1_team.pk, "WDI Onsite")

        self.assertEqual(response["data"]["updateTeam"]["name"], "WDI Onsite")
        self.org_1_team.refresh_from_db()
        self.assertEqual(self.org_1_team.name, "WDI Onsite")

    def test_update_team_cannot_touch_another_orgs_team(self) -> None:
        original_name = self.org_2_team.name

        response = self._update_team(self.org_2_team.pk, "Renamed by org 1")

        self.assertGraphQLOperationInfo(
            response,
            "updateTeam",
            "You do not have permission to update this team.",
            kind="PERMISSION",
        )
        self.org_2_team.refresh_from_db()
        self.assertEqual(self.org_2_team.name, original_name)

    # -- deleteTeam ---------------------------------------------------------

    def _delete_team(self, team_id: Any) -> Dict[str, Any]:
        mutation = """
            mutation ($data: DeleteDjangoObjectInput!) {
                deleteTeam(data: $data) {
                    ... on OperationInfo { messages { kind field message } }
                    ... on DeletedObjectType { id }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": {"id": str(team_id)}})

    def test_delete_team_removes_a_team_in_the_active_org(self) -> None:
        response = self._delete_team(self.org_1_team.pk)

        self.assertIsNotNone(response["data"]["deleteTeam"]["id"])
        self.assertFalse(Team.objects.filter(pk=self.org_1_team.pk).exists())

    def test_delete_team_cannot_touch_another_orgs_team(self) -> None:
        response = self._delete_team(self.org_2_team.pk)

        self.assertGraphQLOperationInfo(
            response,
            "deleteTeam",
            "You do not have permission to delete this team.",
            kind="PERMISSION",
        )
        self.assertTrue(Team.objects.filter(pk=self.org_2_team.pk).exists())
