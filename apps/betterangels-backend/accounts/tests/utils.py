from typing import Any, Dict

from common.tests.utils import GraphQLBaseTestCase


class ClientGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def _create_client_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_fixture("create", variables)

    def _update_client_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_fixture("update", variables)

    def _create_or_update_client_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}Client($data: {operation.capitalize()}ClientInput!) {{ # noqa: B950
                {operation}Client(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on ClientType {{
                        id
                        username
                        firstName
                        lastName
                        email
                        clientProfile {{
                            hmisId
                        }}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
