from unittest.mock import ANY
from django.test import ignore_warnings
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login(0)

    def test_create_note_mutation(self) -> None:
        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 29
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {"title": "New Note", "publicDetails": "This is a new note."}
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New Note",
            "moods": [],
            "publicDetails": "This is a new note.",
            "createdBy": {"id": str(self.case_manager.pk)},
            "client": {"id": str(self.note_client.pk)},
        }

        self.assertEqual(created_note, expected_note)

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"title": "ANXIOUS"}, {"title": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
            "client": {"id": str(self.note_client.pk)},
        }

        expected_query_count = 15
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"title": "ANXIOUS"}, {"title": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "createdBy": {"id": str(self.case_manager.pk)},
            "client": {"id": str(self.note_client.pk)},
        }
        self.assertEqual(updated_note, expected_note)

    def test_delete_note_mutation(self) -> None:
        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(data: { id: $id }) {
                    id
                }
            }
        """
        variables = {"id": self.note["id"]}

        expected_query_count = 14
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])
