from typing import Optional
from unittest import skip

from model_bakery import baker
from notes.models import Mood, Note, OrganizationService, ServiceRequest
from notes.tests.utils import NoteGraphQLBaseTestCase, ServiceRequestGraphQLBaseTestCase
from unittest_parametrize import parametrize


class NotePermissionTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Logged-in user should succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        note_count = Note.objects.count()
        variables = {
            "purpose": "Test Note",
            "publicDetails": "This is a test note.",
            "clientProfile": str(self.client_profile_1.pk),
        }
        response = self._create_note_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNote"]["id"])
            self.assertEqual(note_count + 1, Note.objects.count())
        else:
            self.assertEqual(note_count, Note.objects.count())
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
            else:
                self.assertEqual(
                    response["data"]["createNote"]["messages"][0],
                    {
                        "kind": "PERMISSION",
                        "field": "createNote",
                        "message": "You don't have permission to access this app.",
                    },
                )

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other org CM should not succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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
        "user_label",
        [
            ("org_1_case_manager_1",),  # Owner
            ("org_1_case_manager_2",),  # Same org
        ],
    )
    def test_update_note_permission_success(self, user_label: str) -> None:
        self._handle_user_login(user_label)

        note_id = self.note["id"]

        variables = {
            "id": note_id,
            "purpose": "Updated Note",
            "publicDetails": "Updated content",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(variables)

        self.assertIsNotNone(response["data"]["updateNote"]["id"])
        updated = Note.objects.get(pk=note_id)
        self.assertEqual(updated.purpose, "Updated Note")
        self.assertEqual(updated.public_details, "Updated content")
        self.assertFalse(updated.is_submitted)

    @parametrize(
        "user_label",
        [
            ("org_2_case_manager_1",),  # Other org
            (None,),  # Anonymous
        ],
    )
    def test_update_note_permission_denied(self, user_label: str) -> None:
        self._handle_user_login(user_label)

        pre_update = Note.objects.get(pk=self.note["id"])

        variables = {
            "id": pre_update.id,
            "purpose": "Updated Note",
            "publicDetails": "Updated content",
            "isSubmitted": False,
        }
        self._update_note_fixture(variables)

        post_update = Note.objects.get(pk=pre_update.id)

        self.assertEqual(post_update.purpose, pre_update.purpose)
        self.assertEqual(post_update.public_details, pre_update.public_details)
        self.assertEqual(post_update.is_submitted, pre_update.is_submitted)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # Other case manager should succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)

    @parametrize(
        "user_label, expected_interaction_count",
        [
            ("org_1_case_manager_1", 1),  # Owner should succeed
            ("org_1_case_manager_2", 1),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", 1),  # Other case manager should succeed
            ("non_case_manager_user", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_notes_permission(self, user_label: Optional[str], expected_interaction_count: Optional[int]) -> None:
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
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_interaction_authors_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query {
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
        response = self.execute_graphql(query)

        if should_succeed:
            self.assertTrue(response["data"]["interactionAuthors"]["totalCount"] > 0)
        else:
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
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


@skip("not implemented")
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
    def test_create_note_mood_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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
            elif user_label is None:
                self.assertGraphQLUnauthenticated(response)
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
    def test_delete_mood_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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
    def test_create_note_service_request_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        water_svc = OrganizationService.objects.get(label="Water")

        service_request_count = ServiceRequest.objects.count()
        variables = {
            "serviceId": str(water_svc.pk),
            "noteId": self.note["id"],
            "serviceRequestType": "REQUESTED",
        }
        response = self._create_note_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNoteServiceRequest"]["id"])
            self.assertEqual(service_request_count + 1, ServiceRequest.objects.count())
        else:
            self.assertEqual(service_request_count, ServiceRequest.objects.count())
            if user_label == "org_2_case_manager_1":
                self.assertEqual(
                    response["errors"][0]["message"],
                    "You do not have permission to modify this note.",
                )
            elif user_label is None:
                self.assertGraphQLUnauthenticated(response)
            else:
                self.assertEqual(
                    response["data"]["createNoteServiceRequest"]["messages"][0],
                    {
                        "kind": "PERMISSION",
                        "field": "createNoteServiceRequest",
                        "message": "You don't have permission to access this app.",
                    },
                )


@skip("Service Requests are not currently implemented")
class ServiceRequestPermissionTestCase(ServiceRequestGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_service_request_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        service_request_count = ServiceRequest.objects.count()
        variables = {"service": "BLANKET", "status": "TO_DO"}
        response = self._create_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createServiceRequest"]["id"])
            self.assertEqual(service_request_count + 1, ServiceRequest.objects.count())
        else:
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
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
            ("non_case_manager_user", False),  # Non CM should not succeed
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
    def test_update_service_request_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.service_request["id"],
            "status": "COMPLETED",
        }

        response = self._update_service_request_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateServiceRequest"]["id"])
        else:
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
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
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_service_request_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_service_requests_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
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

        if user_label is None:
            self.assertGraphQLUnauthenticated(response)

        self.assertTrue(len(response["data"]["serviceRequests"]) == should_succeed)
