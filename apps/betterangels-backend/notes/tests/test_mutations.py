from unittest.mock import ANY

from django.test import ignore_warnings
from freezegun import freeze_time
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase, TaskGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    def test_create_note_mutation(self) -> None:
        expected_query_count = 32
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "client": {"id": str(self.client_1.pk)},
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New Note",
            "moods": [],
            "publicDetails": "This is a new note.",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.client_1.pk)},
        }

        self.assertEqual(created_note, expected_note)

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }

        expected_query_count = 30
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.client_1.pk)},
        }
        self.assertEqual(updated_note, expected_note)

    def test_delete_note_mutation(self) -> None:
        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(data: { id: $id }) {
                    ... on NoteType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.note["id"]}

        expected_query_count = 16
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])


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
            "dueBy": None,
            "client": None,
            "createdAt": "2024-02-26T00:00:00+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }
        self.assertEqual(created_task, expected_task)

    def test_update_task_mutation(self) -> None:
        variables = {
            "id": self.task["id"],
            "title": "Updated task title",
            "client": {"id": str(self.client_1.pk)},
            "status": "COMPLETED",
        }

        expected_query_count = 10
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)

        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "COMPLETED",
            "dueBy": None,
            "client": {"id": str(self.client_1.pk)},
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
