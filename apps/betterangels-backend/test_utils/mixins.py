from typing import Any, Dict, Optional, Protocol

from django.test import Client, TestCase


class HasGraphQLProtocol(Protocol):
    # fmt:off
    def execute_graphql(
        self, query: str, variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        ...
    # fmt:on


class GraphQLTestCaseMixin:
    graphql_url = "/graphql"  # Change this if your GraphQL endpoint is different

    def setUp(self) -> None:
        # Explicitly check if self is an instance of Django's TestCase
        if isinstance(self, TestCase):
            super(TestCase, self).setUp()
        self.graphql_client = Client()

    def execute_graphql(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        data = {
            "query": query,
            "variables": variables or {},
        }
        response = self.graphql_client.post(self.graphql_url, data, content_type="application/json", **extra)

        json_data = response.json()
        if not isinstance(json_data, dict):
            raise ValueError("Response JSON is not a dictionary")
        return json_data
