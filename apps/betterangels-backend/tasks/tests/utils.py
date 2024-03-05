from typing import Any, Dict

from test_utils.base import GraphQLBaseTestCase


class TaskGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_users()
        self._setup_task()

    def _setup_task(self) -> None:
        # Force login the case manager to create a task
        self.graphql_client.force_login(self.case_manager_1)
        self.task: Dict[str, Any] = self.create_task_fixture(
            {
                "title": f"User: {self.case_manager_1.id}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        # Logout after setting up the task
        self.graphql_client.logout()
