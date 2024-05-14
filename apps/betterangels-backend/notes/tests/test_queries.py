from typing import Any, Optional

import time_machine
from django.test import ignore_warnings, override_settings
from django.utils import timezone
from notes.enums import NoteNamespaceEnum, ServiceEnum
from notes.models import Note
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
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
                "point": self.point,
                "address": self.address.pk,
                "publicDetails": "Updated public details",
                "privateDetails": "Updated private details",
                "isSubmitted": False,
                "interactedAt": "2024-03-12T11:12:13+00:00",
            }
        )
        # Add moods
        self._create_note_mood_fixture(
            {"descriptor": "ANXIOUS", "noteId": note_id},
        )
        self._create_note_mood_fixture(
            {"descriptor": "EUTHYMIC", "noteId": note_id},
        )
        # Add purposes and next steps
        note = Note.objects.get(pk=note_id)
        note.purposes.set([self.purpose_1["id"], self.purpose_2["id"]])
        note.next_steps.set([self.next_step_1["id"], self.next_step_2["id"]])
        note.provided_services.set(self.provided_services)
        note.requested_services.set(self.requested_services)

        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
                    point
                    address {
                        street
                        city
                        state
                        zipCode
                    }
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
                    interactedAt
                }
            }
        """

        variables = {"id": note_id}
        expected_query_count = 8

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "title": "Updated Note",
            "point": self.point,
            "address": {
                "street": "106 W 1st St",
                "city": "Los Angeles",
                "state": "CA",
                "zipCode": "90012",
            },
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "purposes": [
                {"id": self.purpose_1["id"], "title": self.purpose_1["title"]},
                {"id": self.purpose_2["id"], "title": self.purpose_2["title"]},
            ],
            "nextSteps": [
                {"id": self.next_step_1["id"], "title": self.next_step_1["title"]},
                {"id": self.next_step_2["id"], "title": self.next_step_2["title"]},
            ],
            "providedServices": [
                {
                    "id": str(self.provided_services[0].id),
                    "service": ServiceEnum(self.provided_services[0].service).name,
                    "customService": self.provided_services[0].custom_service,
                },
                {
                    "id": str(self.provided_services[1].id),
                    "service": ServiceEnum(self.provided_services[1].service).name,
                    "customService": self.provided_services[1].custom_service,
                },
            ],
            "requestedServices": [
                {
                    "id": str(self.requested_services[0].id),
                    "service": ServiceEnum(self.requested_services[0].service).name,
                    "customService": self.requested_services[0].custom_service,
                },
                {
                    "id": str(self.requested_services[1].id),
                    "service": ServiceEnum(self.requested_services[1].service).name,
                    "customService": self.requested_services[1].custom_service,
                },
            ],
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "client": {"id": str(self.client_user_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T11:12:13+00:00",
        }
        self.assertCountEqual(expected_note.items(), note.items())

    def test_notes_query(self) -> None:
        query = """
            {
                notes {
                    id
                    title
                    point
                    address {
                        street
                        city
                        state
                        zipCode
                    }
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
                    interactedAt
                }
            }
        """
        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        # TODO: Add more validations once sort is implemented
        self.assertCountEqual(self.note.items(), notes[0].items())

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
            ("org_1_case_manager_1", "client_user_1", None, 1, "note", None),
            ("org_1_case_manager_1", "client_user_2", None, 0, None, None),
            ("org_1_case_manager_2", "client_user_1", None, 1, "note_2", None),
            ("org_1_case_manager_2", "client_user_2", None, 1, "note_3", None),
            ("org_1_case_manager_2", "client_user_1", True, 0, None, None),
            ("org_1_case_manager_2", "client_user_1", False, 1, "note_2", None),
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

        self.note_2 = self._create_note_fixture({"title": "Client 1's Note", "client": self.client_user_1.pk})["data"][
            "createNote"
        ]

        self.note_3 = self._create_note_fixture({"title": "Client 2's Note", "client": self.client_user_2.pk})["data"][
            "createNote"
        ]

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

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), expected_results_count)

        if returned_note_label_1:
            self.assertEqual(notes[0]["id"], getattr(self, returned_note_label_1)["id"])

        if returned_note_label_2:
            self.assertEqual(notes[1]["id"], getattr(self, returned_note_label_2)["id"])

    def test_notes_query_order(self) -> None:
        """
        Assert that notes are returned in order of interacted_at timestamp, regardless of client
        """
        self.graphql_client.force_login(self.org_1_case_manager_2)

        older_note = self._create_note_fixture({"title": "Client 1's Note", "client": self.client_user_1.pk})["data"][
            "createNote"
        ]
        self._update_note_fixture({"id": older_note["id"], "interactedAt": "2024-03-10T10:11:12+00:00"})

        oldest_note = self._create_note_fixture({"title": "Client 2's Note", "client": self.client_user_2.pk})["data"][
            "createNote"
        ]
        self._update_note_fixture({"id": oldest_note["id"], "interactedAt": "2024-01-10T10:11:12+00:00"})

        query = """
            query Notes($order: NoteOrder) {
                notes(order: $order) {
                    id
                }
            }
        """

        # Test descending order
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"interactedAt": "DESC"}})

        self.assertEqual(
            [n["id"] for n in response["data"]["notes"]], [self.note["id"], older_note["id"], oldest_note["id"]]
        )

        # Test ascending order
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"interactedAt": "ASC"}})

        self.assertEqual(
            [n["id"] for n in response["data"]["notes"]], [oldest_note["id"], older_note["id"], self.note["id"]]
        )


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


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
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
                "client": self.client_user_1.pk,
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

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        service_request = response["data"]["serviceRequest"]
        expected_service_request = {
            "id": service_request_id,
            "service": self.service_request["service"],
            "customService": None,
            "status": "COMPLETED",
            "dueBy": None,
            "completedOn": "2024-03-11T10:11:12+00:00",
            "client": {"id": str(self.client_user_1.pk)},
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
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        service_requests = response["data"]["serviceRequests"]
        self.assertEqual(len(service_requests), 1)
        self.assertEqual(self.service_request, service_requests[0])


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
class TaskQueryTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_task_query(self) -> None:
        task_id = self.task["id"]
        # Update fields available on the task input
        self._update_task_fixture(
            {
                "id": task_id,
                "title": "Updated task title",
                "point": self.point,
                "address": self.address.pk,
                "status": "COMPLETED",
                "dueBy": timezone.now(),
                "client": self.client_user_1.pk,
            }
        )

        query = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    title
                    point
                    address {
                        street
                        city
                        state
                        zipCode
                    }
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

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]
        expected_task = {
            "id": task_id,
            "title": "Updated task title",
            "point": self.point,
            "address": {
                "street": "106 W 1st St",
                "city": "Los Angeles",
                "state": "CA",
                "zipCode": "90012",
            },
            "status": "COMPLETED",
            "dueBy": "2024-03-11T10:11:12+00:00",
            "client": {
                "id": str(self.client_user_1.pk),
            },
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }

        self.assertEqual(expected_task, task)

    def test_tasks_query(self) -> None:
        query = """
            {
                tasks {
                    id
                    title
                    point
                    address {
                        street
                        city
                        state
                        zipCode
                    }
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
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(self.task, tasks[0])
