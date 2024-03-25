from typing import Any, Optional
from unittest.mock import ANY

from django.test import ignore_warnings, override_settings
from freezegun import freeze_time
from notes.enums import NoteNamespaceEnum, ServiceEnum
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
@freeze_time("03-12-2024 10:11:12")
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
        # Update fields available on the note input
        self._update_note_fixture(
            {
                "id": note_id,
                "title": "Updated Note",
                "purposes": [t.id for t in self.purposes],
                "nextSteps": [t.id for t in self.next_steps],
                "publicDetails": "Updated public details",
                "privateDetails": "Updated private details",
                "isSubmitted": False,
                "timestamp": "2024-03-12T11:12:13+00:00",
            }
        )
        # Add moods
        self._create_note_mood_fixture(
            {"descriptor": "ANXIOUS", "noteId": note_id},
        )
        self._create_note_mood_fixture(
            {"descriptor": "EUTHYMIC", "noteId": note_id},
        )
        # Add provided and requested services
        self._create_note_service_request_fixture(
            {
                "service": "WATER",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            },
        )
        self._create_note_service_request_fixture(
            {
                "service": "BLANKET",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            },
        )
        self._create_note_service_request_fixture(
            {
                "service": "OTHER",
                "customService": "Other custom service request",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            },
        )
        self._create_note_service_request_fixture(
            {
                "service": "MEDICAL",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            },
        )

        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
                    moods {
                        descriptor
                    }
                    purposes {
                        id
                        title
                    }
                    nextSteps {
                        id
                        title
                    }
                    providedServices {
                        id
                        service
                        customService
                    }
                    requestedServices {
                        id
                        service
                        customService
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
        expected_query_count = 7

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "title": "Updated Note",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "purposes": [
                {"id": str(self.purposes[0].id), "title": self.purposes[0].title},
                {"id": str(self.purposes[1].id), "title": self.purposes[1].title},
            ],
            "nextSteps": [
                {"id": str(self.next_steps[0].id), "title": self.next_steps[0].title},
                {"id": str(self.next_steps[1].id), "title": self.next_steps[1].title},
            ],
            "providedServices": [
                {
                    "id": ANY,
                    "service": ServiceEnum.WATER.name,
                    "customService": None,
                },
                {
                    "id": ANY,
                    "service": ServiceEnum.BLANKET.name,
                    "customService": None,
                },
            ],
            "requestedServices": [
                {
                    "id": ANY,
                    "service": ServiceEnum.OTHER.name,
                    "customService": "Other custom service request",
                },
                {
                    "id": ANY,
                    "customService": None,
                    "service": ServiceEnum.MEDICAL.name,
                },
            ],
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "timestamp": "2024-03-12T11:12:13+00:00",
        }
        self.assertEqual(expected_note, note)

    def test_notes_query(self) -> None:
        query = """
            {
                notes {
                    id
                    title
                    moods {
                        descriptor
                    }
                    purposes {
                        id
                        title
                    }
                    nextSteps {
                        id
                        title
                    }
                    providedServices {
                        id
                        service
                        customService
                    }
                    requestedServices {
                        id
                        service
                        customService
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
        expected_query_count = 7
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        # TODO: Add more validations once sort is implemented
        self.assertEqual(self.note, notes[0])

    @parametrize(
        (
            "case_manager_label, client_label, is_submitted, "
            "expected_results_count, returned_note_label_1, "
            "returned_note_label_2"
        ),
        [
            # Filter by:
            # case manager, client, and/or is_submitted
            ("org_1_case_manager_1", None, None, 1, "note", None),
            ("org_1_case_manager_2", None, None, 2, "note_2", "note_3"),
            ("org_1_case_manager_1", "client_1", None, 1, "note", None),
            ("org_1_case_manager_1", "client_2", None, 0, None, None),
            ("org_1_case_manager_2", "client_1", None, 1, "note_2", None),
            ("org_1_case_manager_2", "client_2", None, 1, "note_3", None),
            ("org_1_case_manager_2", "client_1", True, 0, None, None),
            ("org_1_case_manager_2", "client_1", False, 1, "note_2", None),
            ("org_1_case_manager_2", None, False, 2, "note_2", "note_3"),
            (None, None, True, 0, None, None),
            (None, None, None, 3, None, None),
        ],
    )
    def test_notes_query_filter(
        self,
        case_manager_label: Optional[str],
        client_label: Optional[str],
        is_submitted: Optional[bool],
        expected_results_count: int,
        returned_note_label_1: Optional[str],
        returned_note_label_2: Optional[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)

        self.note_2 = self._create_note_fixture(
            {"title": "Client 1's Note", "client": self.client_1.pk}
        )["data"]["createNote"]

        self.note_3 = self._create_note_fixture(
            {"title": "Client 2's Note", "client": self.client_2.pk}
        )["data"]["createNote"]

        query = """
            query Notes($filters: NoteFilter) {
                notes(filters: $filters) {
                    id
                }
            }
        """

        filters: dict[str, Any] = {}

        if case_manager_label:
            filters["createdBy"] = {"pk": getattr(self, case_manager_label).pk}

        if client_label:
            filters["client"] = {"pk": getattr(self, client_label).pk}

        if is_submitted is not None:
            filters["isSubmitted"] = is_submitted

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), expected_results_count)

        if returned_note_label_1:
            self.assertEqual(notes[0]["id"], getattr(self, returned_note_label_1)["id"])

        if returned_note_label_2:
            self.assertEqual(notes[1]["id"], getattr(self, returned_note_label_2)["id"])


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self.attachment_1 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 1",
            "attachment_1.txt",
        )
        self.attachment_2 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 2",
            "attachment_2.txt",
        )

    def test_view_note_attachment_permission(self) -> None:
        query = """
            query ViewNoteAttachment($id: ID!) {
                noteAttachment(pk: $id) {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        variables = {"id": self.attachment_1["data"]["createNoteAttachment"]["id"]}
        response = self.execute_graphql(query, variables)

        self.assertEqual(
            self.attachment_1["data"]["createNoteAttachment"],
            response["data"]["noteAttachment"],
        )

    def test_view_note_attachments_permission(self) -> None:
        query = """
            query ViewNoteAttachments {
                noteAttachments {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        response = self.execute_graphql(query)

        self.assertEqual(
            [
                self.attachment_1["data"]["createNoteAttachment"],
                self.attachment_2["data"]["createNoteAttachment"],
            ],
            response["data"]["noteAttachments"],
        )


@freeze_time("2024-03-11 10:11:12")
@ignore_warnings(category=UserWarning)
class ServiceRequestQueryTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_service_request_query(self) -> None:
        service_request_id = self.service_request["id"]
        self._update_service_request_fixture(
            {
                "id": service_request_id,
                "status": "COMPLETED",
                "client": self.client_1.pk,
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
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
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
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_task_query(self) -> None:
        task_id = self.task["id"]
        expected_task = {
            "id": task_id,
            "title": self.task["title"],
            "status": "TO_DO",
            "dueBy": None,
            "client": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
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
