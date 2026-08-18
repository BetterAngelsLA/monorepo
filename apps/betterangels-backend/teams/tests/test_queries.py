"""Org admins may see only their own organization's teams.

Half of the acceptance criterion for org-managed teams: the admin app lists
teams for the *active* organization, and another organization's teams are not
visible.  The editing half lives in ``test_mutations.py``.
"""

from typing import Any, Dict

from accounts.groups import ORG_ADMIN
from accounts.role_manager import OrgRoleManager
from django.test import ignore_warnings
from teams.models import Team
from teams.tests.utils import TEAM_FIELDS, TeamGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class TeamQueryOrgScopingTestCase(TeamGraphQLBaseTestCase):
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

    def _assert_denied(self, response: Dict[str, Any]) -> None:
        self.assertIsNotNone(response.get("errors"))
        self.assertIsNone((response.get("data") or {}).get("teams"))

    def test_returns_only_the_active_orgs_teams(self) -> None:
        response = self._teams_query()

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

        results = self._teams_query()["data"]["teams"]["results"]

        returned_ids = {int(row["id"]) for row in results}
        org_2_ids = set(Team.objects.filter(organization=self.org_2).values_list("pk", flat=True))
        self.assertEqual(returned_ids, org_2_ids)

    def test_requires_the_active_org_header(self) -> None:
        """The server must not guess — first-match is how other orgs leaked."""
        del self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"]

        self._assert_denied(self._teams_query())

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

        self._assert_denied(self._teams_query())

    def test_denies_a_malformed_header(self) -> None:
        self.graphql_client.defaults["HTTP_X_ORGANIZATION_ID"] = "not-an-id"

        self._assert_denied(self._teams_query())
