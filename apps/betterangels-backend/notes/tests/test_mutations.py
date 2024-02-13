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
        expected_query_count = 23
        with self.assertNumQueries(expected_query_count):
            response = self._create_note(
                {"title": "New Note", "body": "This is a new note."}
            )
        self.assertIsNotNone(response["data"]["createNote"])
        self.assertEqual(response["data"]["createNote"]["title"], "New Note")

    def test_update_note_mutation(self) -> None:
        mutation = """
            mutation UpdateNote($id: ID!, $title: String!, $body: String!) {
                updateNote(data: { id: $id, title: $title, body: $body }) {
                    ... on NoteType {
                        title
                        body
                    }
                }
            }
        """
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "body": "Updated Body",
        }

        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertEqual(response["data"]["updateNote"]["title"], "Updated Title")

    def test_delete_note_mutation(self) -> None:
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

        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])
