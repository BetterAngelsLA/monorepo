from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase
from unittest_parametrize import parametrize


class NotePermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "username, should_succeed",
        [
            ("case_manager_1", True),  # Logged-in user should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_permission(self, username: str, should_succeed: bool) -> None:
        self._handle_user_login(username)

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
        "username, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_permission(self, username: str, should_succeed: bool) -> None:
        self._handle_user_login(username)

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
        "username, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_note_permission(self, username: str, should_succeed: bool) -> None:
        self._handle_user_login(username)

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
        "username, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_permission(self, username: str, should_succeed: bool) -> None:
        self._handle_user_login(username)

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
        "username, should_succeed",
        [
            ("case_manager_1", True),  # Owner should succeed
            ("case_manager_2", False),  # Other user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_notes_permission(self, username: str, should_succeed: bool) -> None:
        self._handle_user_login(username)

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
