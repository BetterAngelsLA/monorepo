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


# class PrivateNoteDetailPermissionTestCase(NoteGraphQLBaseTestCase):
#     def setUp(self):
#         super().setUp()
#         # Create a PrivateNoteDetail instance and link it to the existing Note instance
#         self.private_note_detail = PrivateNoteDetail.objects.create(
#             content="This is a private note", note=self.note
#         )
#         self.note.private_details = self.private_note_detail
#         self.note.save()

#     @parametrize(
#         "user_idx, permission, should_succeed",
#         [
#             (0, True, True),  # User with permission should succeed
#             (0, False, False),  # User without permission should not succeed
#             (1, False, False),  # Other user without permission should not succeed
#             (-1, False, False),  # Anonymous user should not succeed
#         ],
#     )
#     def test_private_note_detail_view_permission(
#         self, user_idx: int, permission: bool, should_succeed: bool
#     ):
#         query = """
#             query NoteDetail($id: ID!) {
#                 note(pk: $id) {
#                     id
#                     privateDetails {
#                         content
#                     }
#                 }
#             }
#         """
#         variables = {"id": self.note.pk}

#         # Handle user login based on the user_idx parameter
#         self._handle_user_login(user_idx)

#         response = self.execute_graphql(query, variables)

#         # Check if the private details are accessible based on 'should_succeed' parameter
#         if should_succeed:
#             self.assertIsNotNone(
#                 response["data"]["note"]["privateDetails"],
#                 "User with permission should access private details",
#             )
#             self.assertEqual(
#                 response["data"]["note"]["privateDetails"]["content"],
#                 "This is a private note",
#             )
#         else:
#             self.assertTrue(
#                 response["data"]["note"]["privateDetails"] is None
#                 or "errors" in response,
#                 "User without permission should not access private details",
#             )
