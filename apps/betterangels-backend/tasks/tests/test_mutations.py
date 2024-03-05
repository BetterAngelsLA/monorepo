from unittest.mock import ANY

from django.test import ignore_warnings
from freezegun import freeze_time
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLBaseTestCase


@freeze_time("2024-02-26")
@ignore_warnings(category=UserWarning)
class TaskMutationTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    def test_create_task_mutation(self) -> None:
        expected_query_count = 7
        with self.assertNumQueries(expected_query_count):
            response = self._create_task_fixture(
                {
                    "title": "New Task",
                    "status": "TO_DO",
                }
            )
        created_task = response["data"]["createTask"]
        expected_task = {
            "id": ANY,
            "title": "New Task",
            "status": "TO_DO",
            "dueDate": None,
            "client": None,
            "createdAt": "2024-02-26T00:00:00+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }
        self.assertEqual(created_task, expected_task)

    def test_update_task_mutation(self) -> None:
        variables = {
            "id": self.task["id"],
            "title": "Updated task title",
            "client": {"id": str(self.task_client_1.pk)},
            "status": "IN_PROGRESS",
        }

        expected_query_count = 10
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)

        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "IN_PROGRESS",
            "dueDate": None,
            "client": {"id": str(self.task_client_1.pk)},
            "createdAt": "2024-02-26T00:00:00+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }
        self.assertEqual(updated_task, expected_task)

    def test_delete_task_mutation(self) -> None:
        mutation = """
            mutation DeleteTask($id: ID!) {
                deleteTask(data: { id: $id }) {
                    ... on TaskType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.task["id"]}

        expected_query_count = 6
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=self.task["id"])
