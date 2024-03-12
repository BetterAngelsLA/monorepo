from unittest.mock import ANY

from django.test import ignore_warnings
from freezegun import freeze_time
from notes.models import Note, ServiceRequest, Task
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)


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


@freeze_time("2024-03-11 10:11:12")
@ignore_warnings(category=UserWarning)
class ServiceRequestMutationTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    def test_create_service_request_mutation(self) -> None:
        expected_query_count = 28
        with self.assertNumQueries(expected_query_count):
            response = self._create_service_request_fixture(
                {
                    "service": "BLANKET",
                    "status": "TO_DO",
                }
            )
        created_service_request = response["data"]["createServiceRequest"]
        expected_service_request = {
            "id": ANY,
            "service": "BLANKET",
            "customService": None,
            "completedOn": None,
            "status": "TO_DO",
            "client": None,
            "createdAt": "2024-03-11T10:11:12+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }
        self.assertEqual(created_service_request, expected_service_request)

    @freeze_time("2024-03-11 12:34:56")
    def test_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "status": "COMPLETED",
            "client": {"id": str(self.client_1.pk)},
        }

        expected_query_count = 16
        with self.assertNumQueries(expected_query_count):
            response = self._update_service_request_fixture(variables)
        updated_service_request = response["data"]["updateServiceRequest"]
        expected_service_request = {
            "id": self.service_request["id"],
            "service": "BLANKET",
            "customService": None,
            "status": "COMPLETED",
            "completedOn": "2024-03-11T12:34:56+00:00",
            "client": {"id": str(self.client_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }
        self.assertEqual(updated_service_request, expected_service_request)

    def test_delete_service_request_mutation(self) -> None:
        mutation = """
            mutation DeleteServiceRequest($id: ID!) {
                deleteServiceRequest(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ServiceRequestType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.service_request["id"]}

        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteServiceRequest"])
        with self.assertRaises(ServiceRequest.DoesNotExist):
            ServiceRequest.objects.get(id=self.service_request["id"])


@freeze_time("2024-02-26 10:11:12")
@ignore_warnings(category=UserWarning)
class TaskMutationTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    def test_create_task_mutation(self) -> None:
        expected_query_count = 28
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
            "createdAt": "2024-02-26T10:11:12+00:00",
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

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "COMPLETED",
            "dueBy": None,
            "client": {"id": str(self.client_1.pk)},
            "createdAt": "2024-02-26T10:11:12+00:00",
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

        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=self.task["id"])
