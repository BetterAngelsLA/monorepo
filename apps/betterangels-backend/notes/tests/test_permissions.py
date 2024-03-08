from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase
from unittest_parametrize import parametrize


class NotePermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_permission(
        self, user_label: str, should_succeed: bool
    ) -> None:
        self._handle_user_login(user_label)

        variables = {"title": "Test Note", "publicDetails": "This is a test note."}
        response = self._create_note_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNote"])
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
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other org CM should not succeed
            ("note_client_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_permission(
        self, user_label: str, should_succeed: bool
    ) -> None:
        self._handle_user_login(user_label)

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

        self.assertTrue(
            Note.objects.filter(id=self.note["id"]).exists() != should_succeed
        )

    @parametrize(
        "user_label, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_note_permission(
        self, user_label: str, should_succeed: bool
    ) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.note["id"],
            "title": "Updated Note",
            "publicDetails": "Updated content",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateNote"])
        else:
            self.assertEqual(
                response["data"]["updateNote"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": None,
                    "message": "You don't have permission to access this app.",
                },
            )

    @parametrize(
        "user_label, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", True),  # Other case manager should succeed
            ("note_client_1", False),  # Non CM should not succeed
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
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", True),  # Other case manager should succeed
            ("note_client_1", False),  # Non CM should not succeed
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
            ("case_manager_1", True),  # Note owner should succeed
            (
                "case_manager_2",
                False,
            ),  # Other org case manager should not succeed
        ],
    )
    def test_view_note_private_details_permission(
        self, user_label: str, should_succeed: bool
    ) -> None:
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
            self.assertFalse(response["data"]["note"]["privateDetails"])

    @parametrize(
        "user_label, expected_private_details_count",
        [
            ("case_manager_1", 1),  # Owner should see private details of their own note
            (
                "case_manager_2",
                0,
            ),  # Other org case manager should not succeed
        ],
    )
    def test_view_notes_private_details_permission(
        self, user_label: str, expected_private_details_count: int
    ) -> None:
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

        private_details_visible = len(
            [note for note in notes_data if note.get("privateDetails") is not None]
        )

        self.assertEqual(private_details_visible, expected_private_details_count)
