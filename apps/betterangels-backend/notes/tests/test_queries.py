from django.test import ignore_warnings
from freezegun import freeze_time
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from notes.tests.utils import NoteGraphQLBaseTestCase, TaskGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
@freeze_time("03-12-2024 10:11:12")
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
        self._update_note_fixture(
            {
                "id": note_id,
                "title": "Updated Note",
                "publicDetails": "Updated public details.",
                "privateDetails": "Updated private details.",
                "moods": [
                    {"descriptor": "ANXIOUS"},
                    {"descriptor": "EUTHYMIC"},
                ],
                "isSubmitted": False,
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
                    publicDetails
                    timestamp
                    moods {
                        descriptor
                    }
                    publicDetails
                    privateDetails
                    isSubmitted
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                }
            }
        """

        variables = {"id": note_id}
        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "title": "Updated Note",
            "timestamp": "2024-03-12T10:11:12+00:00",
            "moods": [
                {"descriptor": "ANXIOUS"},
                {"descriptor": "EUTHYMIC"},
            ],
            "publicDetails": "Updated public details.",
            "privateDetails": "Updated private details.",
            "isSubmitted": False,
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.client_1.pk)},
        }

        self.assertEqual(expected_note, note)

    def test_notes_query(self) -> None:
        self._create_note_fixture(
            {
                "title": "Note 2",
                "publicDetails": "Note 2 details",
                "client": {"id": self.client_1.id},
            }
        )
        self._create_note_fixture(
            {
                "title": "Note 3",
                "publicDetails": "Note 3 details",
                "client": {"id": self.client_1.id},
            }
        )
        query = """
            {
                notes {
                    id
                    publicDetails
                    privateDetails
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 3)
        # TODO: Add more validations once sort is implemented
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])


@freeze_time("2024-03-11 10:11:12")
@ignore_warnings(category=UserWarning)
class ServiceRequestQueryTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_service_request_query(self) -> None:
        service_request_id = self.service_request["id"]
        self.expected_service_request = {
            "id": service_request_id,
            "service": self.service_request["service"],
            "customService": None,
            "status": "TO_DO",
            "completedOn": None,
            "client": {"id": str(self.client_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
            "createdBy": {"id": str(self.case_manager_1.pk)},
        }

        query = """
            query ViewServiceRequest($id: ID!) {
                serviceRequest(pk: $id) {
                    id
                    service
                    customService
                    status
                    completedOn
                    client {
                        id
                    }
                    createdAt
                    createdBy {
                        id
                    }
                }
            }
        """
        variables = {"id": service_request_id}

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        service_request = response["data"]["serviceRequest"]
        self.assertEqual(service_request, self.expected_service_request)

    def test_service_requests_query(self) -> None:
        query = """
            {
                serviceRequests {
                    id
                    service
                    customService
                    status
                    completedOn
                    client {
                        id
                    }
                    createdAt
                    createdBy {
                        id
                    }
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        service_requests = response["data"]["serviceRequests"]
        self.assertEqual(len(service_requests), 1)
        self.assertEqual(
            service_requests[0]["service"], self.service_request["service"]
        )


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

        expected_query_count = 2
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
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0]["title"], self.task["title"])
