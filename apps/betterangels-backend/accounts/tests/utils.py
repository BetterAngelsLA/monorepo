from typing import Any, Dict

from common.tests.utils import GraphQLBaseTestCase


class ClientGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_clients()

    def _setup_clients(self) -> None:
        # Force login the case manager to create clients
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.client_1_profile = {"hmisId": "A1B2C3"}
        self.client_1 = self._create_client_fixture(
            {
                "firstName": "Todd",
                "lastName": "Chavez",
                "email": "todd@pblivin.com",
                "clientProfile": self.client_1_profile,
            }
        )["data"]["createClient"]
        self.client_2_profile = {"hmisId": "A1B3C4"}
        self.client_2 = self._create_client_fixture(
            {
                "firstName": "Mister",
                "lastName": "Peanutbutter",
                "email": "mister@pblivin.com",
                "clientProfile": self.client_2_profile,
            }
        )["data"]["createClient"]
        # Logout after setting up the clients
        self.graphql_client.logout()

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
