import uuid
from typing import Any, Dict, Optional

from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class TaskGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_task()

    def _setup_users(self) -> None:
        self.user_labels = [
            "case_manager_1",
            "task_client_1",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}")
            for user_label in self.user_labels
        }

        self.case_manager_1 = self.user_map["case_manager_1"]
        self.task_client_1 = self.user_map["task_client_1"]

    def _setup_task(self) -> None:
        # Force login the case manager to create a task
        self.graphql_client.force_login(self.case_manager_1)
        self.task: Dict[str, Any] = self._create_task_fixture(
            {
                "title": f"User: {self.case_manager_1.id}",
                "status": "TO_DO",
                "client": {"id": self.task_client_1.id},
            },
        )["data"]["createTask"]
        # Logout after setting up the task
        self.graphql_client.logout()

    def _create_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("create", variables)

    def _update_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("update", variables)

    def _create_or_update_task_fixture(
        self, operation: str, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
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
                        id
                        title
                        dueDate
                        status
                        client {{
                            id
                        }}
                        createdAt
                        createdBy {{
                            id
                        }}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _handle_user_login(self, user_label: Optional[str]) -> None:
        if user_label:
            self.graphql_client.force_login(self.user_map[user_label])
        else:
            self.graphql_client.logout()
