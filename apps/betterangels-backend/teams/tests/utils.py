from typing import Any, Dict, Optional

from common.tests.utils import GraphQLBaseTestCase


class TeamGraphQLUtilsMixin(GraphQLBaseTestCase):
    def get_team_fields(self) -> str:
        return """
            id
            name
            isActive
        """

    def get_teams_query(self, fields: Optional[str] = None) -> str:
        return f"""
            query {{
                teams {{
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
                }
            }
        """

        return self.execute_graphql(mutation, {"id": team_id})
