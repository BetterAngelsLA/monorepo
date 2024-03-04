from django.test import ignore_warnings
from notes.tests.utils import TaskGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class TaskQueryTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_task_query(self) -> None:
        task_id = self.task["id"]
        expected_task = {
            "id": task_id,
            "title": self.task["title"],
            "status": "TO_DO",
        }

        query = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    title
                    status
                }
            }
        """
        variables = {"id": task_id}

        expected_query_count = 1
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]

        self.assertEqual(task, expected_task)

    def test_tasks_query(self) -> None:
        query = """
            {
                tasks {
                    id
                    title
                    status
                }
            }
        """
        expected_query_count = 1
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["title"], self.task["title"])
