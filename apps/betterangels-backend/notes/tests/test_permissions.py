from common.models import Attachment
from django.test.utils import override_settings
from model_bakery import baker
from notes.enums import NoteNamespaceEnum
from notes.models import Mood, Note, ServiceRequest, Task
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from unittest_parametrize import parametrize


class NotePermissionTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        note_count = Note.objects.count()
        variables = {"title": "Test Note", "publicDetails": "This is a test note."}
        response = self._create_note_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNote"]["id"])
            self.assertEqual(note_count + 1, Note.objects.count())
        else:
            self.assertEqual(
                response["data"]["createNote"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createNote",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(note_count, Note.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other org CM should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        note_count = Note.objects.count()
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
        self.execute_graphql(mutation, variables)

        self.assertTrue(Note.objects.filter(id=self.note["id"]).exists() != should_succeed)
        if should_succeed:
            self.assertEqual(note_count - 1, Note.objects.count())
        else:
            self.assertEqual(note_count, Note.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_note_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.note["id"],
            "title": "Updated Note",
            "publicDetails": "Updated content",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateNote"]["id"])
        else:
            self.assertEqual(
                response["data"]["updateNote"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "updateNote",
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "has_note_permissions, has_task_permissions, should_succeed",
        [
            (True, True, True),  # Has both Note and Task permissions; should succeed
            (True, False, False),  # Has Note but not Task permissions; should not succeed
            (False, True, False),  # Has Task but not Note permissions; should not succeed
        ],
    )
    def test_add_note_task_permission(
        self,
        has_note_permissions: bool,
        has_task_permissions: bool,
        should_succeed: bool,
    ) -> None:
        note_id = self.note["id"]
        task_id = self.purpose_1["id"]

        if not has_note_permissions:
            self._handle_user_login("org_2_case_manager_1")
            note_id = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "New public details",
                    "client": self.client_user_1.pk,
                }
            )["data"]["createNote"]["id"]

        if not has_task_permissions:
            self._handle_user_login("org_2_case_manager_1")
            task_id = self._create_task_for_note_fixture(
                {
                    "title": "New Task",
                    "status": "TO_DO",
                }
            )["data"][
                "createTask"
            ]["id"]

        self._handle_user_login("org_1_case_manager_1")
        variables = {
            "noteId": note_id,
            "taskId": task_id,
            "taskType": "PURPOSE",
        }

        note = Note.objects.get(id=note_id)
        self.assertEqual(0, note.purposes.count())

        response = self._add_note_task_fixture(variables)
        if should_succeed:
            self.assertIsNotNone(response["data"]["addNoteTask"]["id"])
            self.assertEqual(1, note.purposes.count())
        else:
            if not has_note_permissions:
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            if not has_task_permissions:
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to access that task.",
                )
            self.assertEqual(0, note.purposes.count())

    @parametrize(
        "has_note_permissions, has_task_permissions, should_succeed",
        [
            (True, True, True),  # Has both Note and Task permissions; should succeed
            (True, False, False),  # Has Note but not Task permissions; should not succeed
            (False, True, False),  # Has Task but not Note permissions; should not succeed
        ],
    )
    def test_remove_note_task_permission(
        self,
        has_note_permissions: bool,
        has_task_permissions: bool,
        should_succeed: bool,
    ) -> None:
        note_id = self.note["id"]
        task_id = self.purpose_1["id"]

        if not has_note_permissions:
            self._handle_user_login("org_2_case_manager_1")
            note_id = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "New public details",
                    "client": self.client_user_1.pk,
                }
            )["data"]["createNote"]["id"]

        if not has_task_permissions:
            self._handle_user_login("org_2_case_manager_1")
            task_id = self._create_task_for_note_fixture(
                {
                    "title": "New Task",
                    "status": "TO_DO",
                }
            )["data"][
                "createTask"
            ]["id"]

        self._handle_user_login("org_1_case_manager_1")
        variables = {
            "noteId": note_id,
            "taskId": task_id,
            "taskType": "PURPOSE",
        }

        note = Note.objects.get(id=note_id)
        task = Task.objects.get(id=task_id)
        note.purposes.add(task)
        self.assertEqual(1, note.purposes.count())

        response = self._remove_note_task_fixture(variables)
        if should_succeed:
            self.assertIsNotNone(response["data"]["removeNoteTask"]["id"])
            self.assertEqual(0, note.purposes.count())
        else:
            if not has_note_permissions:
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            if not has_task_permissions:
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to access that task.",
                )
            self.assertEqual(1, note.purposes.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # Other case manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    publicDetails
                }
            }
        """
        variables = {"id": self.note["id"]}
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # Other case manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_notes_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewNotes {
                notes {
                    id
                    publicDetails
                }
            }
        """
        variables = {"id": self.note["id"]}
        response = self.execute_graphql(mutation, variables)

        self.assertTrue(len(response["data"]["notes"]) == should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Note owner should succeed
            ("org_2_case_manager_1", False),  # Other org case manager should not succeed
        ],
    )
    def test_view_note_private_details_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewNotePrivateDetails($id: ID!) {
                note(pk: $id) {
                    id
                    privateDetails
                }
            }
        """
        variables = {"id": self.note["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["note"]["privateDetails"])
        else:
            self.assertIsNone(response["data"]["note"]["privateDetails"])

    @parametrize(
        "user_label, expected_private_details_count",
        [
            ("org_1_case_manager_1", 1),  # Owner should see private details of their own note
            ("org_2_case_manager_1", 0),  # Other org case manager should not succeed
        ],
    )
    def test_view_notes_private_details_permission(self, user_label: str, expected_private_details_count: int) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewNotes {
                notes {
                    id
                    privateDetails
                }
            }
        """
        response = self.execute_graphql(query, {})
        notes_data = response["data"]["notes"]

        private_details_visible = len([note for note in notes_data if note.get("privateDetails") is not None])

        self.assertEqual(private_details_visible, expected_private_details_count)


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentPermessionTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.attachment_ids = []
        self._handle_user_login("org_1_case_manager_1")
        for _ in range(2):  # Create two attachments for testing
            response = self._create_note_attachment_fixture(
                self.note["id"],
                NoteNamespaceEnum.MOOD_ASSESSMENT.name,
                b"Test file content for viewing multiple attachments",
                f"multiple_view_permission_test_{_}.txt",
            )
            self.attachment_ids.append(response["data"]["createNoteAttachment"]["id"])
        self.graphql_client.logout()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Client modifying note should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_attachment_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        response = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"This is a test file",
            "test.txt",
        )
        attachment_id = response.get("data", {}).get("createNoteAttachment", {}).get("id")
        if should_succeed:
            self.assertIsNotNone(attachment_id)
        else:
            self.assertIsNone(attachment_id)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # CM in a different org should not succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_attachment_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login("org_1_case_manager_1")
        response = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Test file content",
        )
        note_attachment_id = response["data"]["createNoteAttachment"]["id"]

        self._handle_user_login(user_label)
        self._delete_note_attachment_fixture(note_attachment_id)

        self.assertTrue(Attachment.objects.filter(id=note_attachment_id).exists() != should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Creator should succeed
            ("org_1_case_manager_2", True),  # Other CM in the same org should succeed
            ("org_2_case_manager_1", False),  # CM from a different org should not succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_attachment_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        query = """
            query ViewNoteAttachment($id: ID!) {
                noteAttachment(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.attachment_ids[0]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertTrue(
                "id" in response["data"]["noteAttachment"],
                "Should return the attachment.",
            )
        else:
            self.assertTrue(
                "errors" in response,
                "Should not have access to view the note attachment.",
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Creator should succeed
            ("org_1_case_manager_2", True),  # Other CM in the same org should succeed
            ("org_2_case_manager_1", False),  # CM from a different org should not succeed
            ("client_user_1", False),  # Client should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_attachments_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewNoteAttachments {
                noteAttachments {
                    id
                }
            }
        """
        response = self.execute_graphql(query)

        if should_succeed:
            returned_ids = {attachment["id"] for attachment in response["data"]["noteAttachments"]}
            expected_ids = set(self.attachment_ids)
            self.assertSetEqual(
                returned_ids,
                expected_ids,
                "Should return exactly the expected attachments for the user.",
            )
        else:
            self.assertTrue(
                len(response["data"]["noteAttachments"]) == 0,
                "Should return an empty list for note attachments.",
            )


class NoteMoodPermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_mood_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "descriptor": "AGREEABLE",
            "noteId": self.note["id"],
        }
        response = self._create_note_mood_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNoteMood"]["id"])
        else:
            if user_label == "org_2_case_manager_1":
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            else:
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You must be logged in to perform this action.",
                )
        self.assertTrue(Mood.objects.filter(note_id=self.note["id"]).exists() == should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_mood_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        mood = baker.make(Mood, note_id=self.note["id"])
        self._delete_mood_fixture(mood_id=mood.pk)

        self.assertTrue(Mood.objects.filter(id=mood.pk).exists() != should_succeed)


class NoteServiceRequestPermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_service_request_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        service_request_count = ServiceRequest.objects.count()
        variables = {
            "service": "WATER",
            "noteId": self.note["id"],
            "serviceRequestType": "REQUESTED",
        }
        response = self._create_note_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNoteServiceRequest"]["id"])
            self.assertEqual(service_request_count + 1, ServiceRequest.objects.count())
        else:
            if user_label == "org_2_case_manager_1":
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            else:
                self.assertEqual(
                    {
                        "kind": "PERMISSION",
                        "field": "createNoteServiceRequest",
                        "message": "You don't have permission to access this app.",
                    },
                    response["data"]["createNoteServiceRequest"]["messages"][0],
                )
            self.assertEqual(service_request_count, ServiceRequest.objects.count())


class NoteTaskPermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_task_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        task_count = Task.objects.count()
        variables = {
            "title": "New Note Task",
            "noteId": self.note["id"],
            "status": "TO_DO",
            "taskType": "PURPOSE",
        }
        response = self._create_note_task_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNoteTask"]["id"])
            self.assertEqual(task_count + 1, Task.objects.count())
        else:
            if user_label == "org_2_case_manager_1":
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            else:
                self.assertEqual(
                    {
                        "kind": "PERMISSION",
                        "field": "createNoteTask",
                        "message": "You don't have permission to access this app.",
                    },
                    response["data"]["createNoteTask"]["messages"][0],
                )
            self.assertEqual(task_count, Task.objects.count())


class ServiceRequestPermissionTestCase(ServiceRequestGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_service_request_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        service_request_count = ServiceRequest.objects.count()
        variables = {"service": "BLANKET", "status": "TO_DO"}
        response = self._create_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createServiceRequest"]["id"])
            self.assertEqual(service_request_count + 1, ServiceRequest.objects.count())
        else:
            self.assertEqual(
                response["data"]["createServiceRequest"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createServiceRequest",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(service_request_count, ServiceRequest.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_service_request_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            mutation DeleteServiceRequest($id: ID!) {
                deleteServiceRequest(data: { id: $id }) {
                    ... on ServiceRequestType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.service_request["id"]}
        self.execute_graphql(mutation, variables)

        self.assertTrue(ServiceRequest.objects.filter(id=self.service_request["id"]).exists() != should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_service_request_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.service_request["id"],
            "status": "COMPLETED",
        }

        response = self._update_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateServiceRequest"]["id"])
        else:
            self.assertEqual(
                response["data"]["updateServiceRequest"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "updateServiceRequest",
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_service_request_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewServiceRequest($id: ID!) {
                serviceRequest(pk: $id) {
                    id
                    status
                }
            }
        """
        variables = {"id": self.service_request["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_service_requests_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewServiceRequests {
                serviceRequests {
                    id
                    status
                }
            }
        """
        variables = {"id": self.service_request["id"]}
        response = self.execute_graphql(mutation, variables)

        self.assertTrue(len(response["data"]["serviceRequests"]) == should_succeed)


class TaskPermissionTestCase(TaskGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_task_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        task_count = Task.objects.count()
        variables = {"title": "Test Task", "status": "TO_DO"}
        response = self._create_task_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createTask"]["id"])
            self.assertEqual(task_count + 1, Task.objects.count())
        else:
            self.assertEqual(
                response["data"]["createTask"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createTask",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(task_count, Task.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_task_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

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
        self.execute_graphql(mutation, variables)

        self.assertTrue(Task.objects.filter(id=self.task["id"]).exists() != should_succeed)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_task_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.task["id"],
            "title": "Updated Task",
            "status": "COMPLETED",
        }

        response = self._update_task_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateTask"]["id"])
        else:
            self.assertEqual(
                response["data"]["updateTask"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "updateTask",
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_task_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    status
                }
            }
        """
        variables = {"id": self.task["id"]}
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_tasks_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewTasks {
                tasks {
                    id
                    status
                }
            }
        """
        variables = {"id": self.task["id"]}
        response = self.execute_graphql(mutation, variables)

        self.assertTrue(len(response["data"]["tasks"]) == should_succeed)
