"""Org admins may see and manage only their own organization's teams.

This is the acceptance criterion for org-managed teams: the admin app lists
and edits teams for the active organization, and another organization's teams
are neither visible nor editable.
"""

import uuid
from typing import Any, Dict

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
from model_bakery import baker
from teams.models import Team

TEAM_FIELDS = "id name slug"


@ignore_warnings(category=UserWarning)
class TeamOrgScopingTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_1_admin = self._make_org_admin(org=self.org_1)
        self.org_2_admin = self._make_org_admin(org=self.org_2)

        self.org_1_team = Team.objects.get(slug="wdi_on_site", organization=self.org_1)
        self.org_2_team = Team.objects.get(slug="wdi_on_site", organization=self.org_2)

        self.graphql_client.force_login(self.org_1_admin)
        self._set_active_org(self.org_1)

    def _make_org_admin(self, *, org: Any) -> User:
        user = baker.make(User, username=f"org_admin_{uuid.uuid4()}")
        org.add_user(user)
        OrgRoleManager(org).add_roles(user, ORG_ADMIN)
        return user

    # -- queries ------------------------------------------------------------

    def _teams_query(self) -> Dict[str, Any]:
        query = f"""
            query {{
                teams {{
                    totalCount
                    results {{ {TEAM_FIELDS} }}
                }}
            }}
        """
        return self.execute_graphql(query)

    def test_teams_query_returns_only_the_active_orgs_teams(self) -> None:
        response = self._teams_query()

        results = response["data"]["teams"]["results"]
        returned_ids = {int(row["id"]) for row in results}
        org_1_ids = set(Team.objects.filter(organization=self.org_1).values_list("pk", flat=True))
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))

        self.assertEqual(returned_ids, org_1_ids)
        self.assertEqual(returned_ids & org_2_ids, set())

    def test_teams_query_follows_the_active_org_header(self) -> None:
        """Same user, different active org — the header decides."""
        self.org_2.add_user(self.org_1_admin)
        OrgRoleManager(self.org_2).add_roles(self.org_1_admin, ORG_ADMIN)
        self._set_active_org(self.org_2)

        results = self._teams_query()["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_2_ids)

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
