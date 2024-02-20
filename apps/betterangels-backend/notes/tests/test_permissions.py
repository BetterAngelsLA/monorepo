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
        "user_idx, should_succeed",
        [
            (0, True),  # Owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_update_note_permission(self, user_idx: int, should_succeed: bool) -> None:
        self._handle_user_login(user_idx)

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
                    publicDetails
                }
            }
        """
        variables = {"id": self.note["id"]}
        response = self.execute_graphql(mutation, variables)

        self.assertTrue(len(response["data"]["notes"]) == should_succeed)

    @parametrize(
        "user_idx, should_succeed",
        [
            (0, True),  # Note owner should succeed
            (1, False),  # Other user should not succeed
            (-1, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_note_private_details_permission(
        self, user_idx: int, should_succeed: bool
    ) -> None:
        self._handle_user_login(user_idx)

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
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_idx, expected_private_details_count",
        [
            (0, 1),  # Owner should see private details of their own note
            (1, 0),  # Other user should not see private details of someone else's note
            (-1, 0),  # Anonymous user should not see any private details
        ],
    )
    def test_view_notes_private_details_permission(
        self, user_idx: int, expected_private_details_count: int
    ) -> None:
        self._handle_user_login(user_idx)

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
