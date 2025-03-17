from typing import Optional

from model_bakery import baker
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
        variables = {
            "purpose": "Test Note",
            "publicDetails": "This is a test note.",
        }
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
            "purpose": "Updated Note",
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
                    "purpose": "New Note",
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
        self.assertEqual(note.purposes.count(), 0)

        response = self._add_note_task_fixture(variables)
        if should_succeed:
            self.assertIsNotNone(response["data"]["addNoteTask"]["id"])
            self.assertEqual(note.purposes.count(), 1)
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
            self.assertEqual(note.purposes.count(), 0)

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
                    "purpose": "New Note",
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
        self.assertEqual(note.purposes.count(), 1)

        response = self._remove_note_task_fixture(variables)
        if should_succeed:
            self.assertIsNotNone(response["data"]["removeNoteTask"]["id"])
            self.assertEqual(note.purposes.count(), 0)
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
            self.assertEqual(note.purposes.count(), 1)

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
        "user_label, expected_interaction_count",
        [
            ("org_1_case_manager_1", 1),  # Owner should succeed
            ("org_1_case_manager_2", 1),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", 1),  # Other case manager should succeed
            ("client_user_1", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_notes_permission(self, user_label: str, expected_interaction_count: Optional[int]) -> None:
        self._handle_user_login(user_label)

        query = """
            query {
                notes {
                    totalCount
                    results {
                        id
                        publicDetails
                    }
                }
            }
        """
        response = self.execute_graphql(query)

        if expected_interaction_count is not None:
            self.assertEqual(response["data"]["notes"]["totalCount"], expected_interaction_count)
        else:
            self.assertTrue("errors" in response)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_interaction_authors_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewInteractionAuthors {
                interactionAuthors {
                    totalCount
                    results {
                        id
                        firstName
                        lastName
                        middleName
                    }
                }
            }
        """
        response = self.execute_graphql(mutation)

        if should_succeed:
            self.assertTrue(response["data"]["interactionAuthors"]["totalCount"] > 0)
        else:
            self.assertTrue(response["data"]["interactionAuthors"]["totalCount"] == 0)

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
            query {
                notes {
                    results {
                        id
                        privateDetails
                    }
                }
            }
        """
        response = self.execute_graphql(query, {})
        notes_data = response["data"]["notes"]["results"]

        private_details_visible = len([note for note in notes_data if note.get("privateDetails") is not None])

        self.assertEqual(private_details_visible, expected_private_details_count)


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
                    response["data"]["createNoteServiceRequest"]["messages"][0],
                    {
                        "kind": "PERMISSION",
                        "field": "createNoteServiceRequest",
                        "message": "You don't have permission to access this app.",
                    },
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
                    response["data"]["createNoteTask"]["messages"][0],
                    {
                        "kind": "PERMISSION",
                        "field": "createNoteTask",
                        "message": "You don't have permission to access this app.",
                    },
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
                    ... on DeletedObjectType {
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
        self._delete_task_fixture(self.task["id"])

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
