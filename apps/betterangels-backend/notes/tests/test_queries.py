from django.test import ignore_warnings
from freezegun import freeze_time
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)


@ignore_warnings(category=UserWarning)
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
                "moods": [
                    {"descriptor": "ANXIOUS"},
                    {"descriptor": "EUTHYMIC"},
                ],
                "publicDetails": "Updated public details.",
                "privateDetails": "Updated private details.",
                "isSubmitted": False,
                "timestamp": "2024-03-12T11:12:13+00:00",
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
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
                    timestamp
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
            "moods": [
                {"descriptor": "ANXIOUS"},
                {"descriptor": "EUTHYMIC"},
            ],
            "publicDetails": "Updated public details.",
            "privateDetails": "Updated private details.",
            "isSubmitted": False,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "timestamp": "2024-03-12T11:12:13+00:00",
        }
        self.assertEqual(expected_note, note)

    def test_notes_query(self) -> None:
        self._create_note_fixture(
            {
                "title": "Note 2",
                "publicDetails": "Note 2 public details",
                "privateDetails": "Note 2 private details",
                "client": self.client_1.id,
            }
        )
        self._create_note_fixture(
            {
                "title": "Note 3",
                "publicDetails": "Note 3 public details",
                "privateDetails": "Note 3 private details",
                "client": self.client_1.id,
            }
        )
        query = """
            {
                notes {
                    id
                    title
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
                    timestamp
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 3)
        # TODO: Add more validations once sort is implemented
        self.assertEqual(self.note, notes[0])


@freeze_time("2024-03-11 10:11:12")
@ignore_warnings(category=UserWarning)
class ServiceRequestQueryTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_service_request_query(self) -> None:
        service_request_id = self.service_request["id"]
        self._update_service_request_fixture(
            {
                "id": service_request_id,
                "status": "COMPLETED",
                "client": self.client_1.id,
            }
        )

        query = """
            query ViewServiceRequest($id: ID!) {
                serviceRequest(pk: $id) {
                    id
                    service
                    customService
                    status
                    dueBy
                    completedOn
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        variables = {"id": service_request_id}

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        service_request = response["data"]["serviceRequest"]
        expected_service_request = {
            "id": service_request_id,
            "service": self.service_request["service"],
            "customService": None,
            "status": "COMPLETED",
            "dueBy": None,
            "completedOn": "2024-03-11T10:11:12+00:00",
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }

        self.assertEqual(expected_service_request, service_request)

    def test_service_requests_query(self) -> None:
        query = """
            {
                serviceRequests {
                    id
                    service
                    customService
                    status
                    dueBy
                    completedOn
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        service_requests = response["data"]["serviceRequests"]
        self.assertEqual(len(service_requests), 1)
        self.assertEqual(self.service_request, service_requests[0])


@freeze_time("2024-03-11 10:11:12")
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
            "dueBy": None,
            "client": None,
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }

        query = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    title
                    status
                    dueBy
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        variables = {"id": task_id}

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]
        self.assertEqual(expected_task, task)

    def test_tasks_query(self) -> None:
        query = """
            {
                tasks {
                    id
                    title
                    status
                    dueBy
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(self.task, tasks[0])
