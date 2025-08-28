from typing import Any, Dict, Optional

from test_utils.mixins import HasGraphQLProtocol


class TaskGraphQLUtilsMixin(HasGraphQLProtocol):
    def get_task_fields(self) -> str:
        return """
            id
            clientProfile { id firstName lastName }
            createdAt
            createdBy { id firstName lastName }
            description
            note { pk }
            organization { id name }
            status
            summary
            team
            updatedAt
        """

    def get_tasks_query(self, fields: Optional[str] = None) -> str:
        return f"""
            query ($filters: TaskFilter, $ordering: [TaskOrder!]) {{
                tasks (filters: $filters, ordering: $ordering) {{
                    totalCount
                    results {{
                        {fields or self.get_task_fields()}
                    }}
                }}
            }}
        """

    def create_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("create", variables)

    def update_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("update", variables)

    def _create_or_update_task_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."

        mutation: str = f"""
            mutation {operation.capitalize()}Task($data: {operation.capitalize()}TaskInput!) {{ # noqa: B950
                {operation}Task(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on TaskType {{
                        {self.get_task_fields()}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def delete_task_fixture(self, task_id: int) -> Dict[str, Any]:
        mutation: str = """
            mutation ($id: ID!) {
                deleteTask(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        return self.execute_graphql(mutation, {"id": task_id})
