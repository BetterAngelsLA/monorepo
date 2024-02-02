from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase
from unittest_parametrize import parametrize


class NotePermissionTestCase(NoteGraphQLBaseTestCase):
    @parametrize(
        "user_idx, should_succeed",
        [
            (0, True),  # Logged-in user should succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_note_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

        variables = {"title": "Test Note", "body2": "This is a test note."}
        response = self._create_note(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createNote"])
        else:
            self.assertIsNone(response["data"])

    @parametrize(
        "user_idx, should_succeed",
        [
            (0, True),  # Owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_note_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(data: { id: $id }) {
                    id
                }
            }
        """
        variables = {"id": self.note["id"]}
        self.execute_graphql(mutation, variables)

        self.assertTrue(
            Note.objects.filter(id=self.note["id"]).exists() != should_succeed
        )

    @parametrize(
        "user_idx, should_succeed",
        [
            (0, True),  # Owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_note_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

        mutation = """
            mutation UpdateNote($id: ID!, $title: String!, $body2: String!) {
                updateNote(data: { id: $id, title: $title, body2: $body2 }) {
                    id
                    title
                    body2
                }
            }
        """
        variables = {
            "id": self.note["id"],
            "title": "Updated Note",
            "body2": "Updated content",
        }
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["updateNote"])
        else:
            self.assertIsNone(response["data"])

    @parametrize(
        "user_idx, should_succeed",
        [
            (0, True),  # Owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

        mutation = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    body2
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
        "user_idx, should_succeed",
        [
            (0, True),  # Owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_notes_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

        mutation = """
            query ViewNotes {
                notes {
                    id
                    body2
                }
            }
        """
        variables = {"id": self.note["id"]}
        response = self.execute_graphql(mutation, variables)

        self.assertTrue(len(response["data"]["notes"]) == should_succeed)
