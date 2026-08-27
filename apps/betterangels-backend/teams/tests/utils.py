"""Shared fixtures for the teams test suites."""

from typing import Any, Dict, Optional

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker


class TeamGraphQLUtilsMixin(GraphQLBaseTestCase):
    def get_team_fields(self) -> str:
        return """
            id
            name
            isActive
            isInUse
        """

    def get_teams_query(self, fields: Optional[str] = None) -> str:
        return f"""
            query ($filters: TeamFilter) {{
                teams (filters: $filters) {{
                    totalCount
                    results {{
                        {fields or self.get_team_fields()}
                    }}
                }}
            }}
        """

    def create_team_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_team_fixture("create", variables)

    def update_team_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_team_fixture("update", variables)

    def _create_or_update_team_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."

        mutation: str = f"""
            mutation {operation.capitalize()}Team($data: {operation.capitalize()}TeamInput!) {{ # noqa: B950
                {operation}Team(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on TeamType {{
                        {self.get_team_fields()}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def delete_team_fixture(self, team_id: int) -> Dict[str, Any]:
        mutation: str = """
            mutation ($id: ID!) {
                deleteTeam(data: { id: $id }) {
                    ... on DeletedObjectType {
                        id
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """

        return self.execute_graphql(mutation, {"id": team_id})


class TeamGraphQLBaseTestCase(TeamGraphQLUtilsMixin):
    """An org admin in ``org_1``, acting as ``org_1``.

    Teams come from the shared fixture, which provisions them for both
    organizations so a test asserting "only my org's" is asserting scoping
    rather than a difference in the data.
    """

    def setUp(self) -> None:
        super().setUp()

        self.org_1_admin = self._make_org_admin(org=self.org_1)
        self.org_2_admin = self._make_org_admin(org=self.org_2)

        self.graphql_client.force_login(self.org_1_admin)
        self._set_active_org(self.org_1)

    def _make_org_admin(self, *, org: Any) -> User:
        user = baker.make(User)
        org.add_user(user)
        OrgRoleManager(org).add_roles(user, ORG_ADMIN)
        return user
