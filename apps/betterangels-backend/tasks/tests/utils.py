from typing import Any, Dict

from common.tests.utils import GraphQLBaseTestCase


class TaskGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.task_fields = """
            id
            clientProfile { id firstName lastName }
            createdAt
            createdBy { id firstName lastName }
            description
            organization { id name }
            status
            summary
            team
            updatedAt
        """

        self.graphql_client.force_login(self.org_1_case_manager_1)

    def _tasks_query(self, fields: str) -> str:
        return f"""
            query ($filters: TaskFilter) {{
                tasks (filters: $filters) {{
                    totalCount
                    results {{
                        {fields}
                    }}
                }}
            }}
        """

    def _create_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("create", variables)

    def _update_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("update", variables)

    def _create_or_update_task_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."

        mutation: str = f"""
            mutation {operation.capitalize()}Task($data: TaskInput!) {{ # noqa: B950
                {operation}Task(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on TaskType {{
                        {self.task_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
