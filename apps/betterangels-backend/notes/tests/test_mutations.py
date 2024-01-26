from typing import Any, Dict

from accounts.models import User
from django.test import TestCase, ignore_warnings
from notes.models import Note
from test_utils.mixins import GraphQLTestCaseMixin


@ignore_warnings(category=UserWarning)
class NoteGraphQLMutationTestCase(GraphQLTestCaseMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.user = User.objects.create(email="hoola@test.com", username="hoola")
        self.note = Note.objects.create(
            created_by=self.user, title="Original Title", body="Original Body"
        )

    def _create_note(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        mutation = """
            mutation CreateNote($title: String!, $body: String!) {
                createNote(input: { title: $title, body: $body }) {
                    id
                    title
                    body
                }
            }
            """
        response = self.execute_graphql(mutation, variables)
        return response

    def test_create_note_mutation_authenticated(self) -> None:
        self.graphql_client.force_login(self.user)

        response = self._create_note(
            {"title": "New Note", "body": "This is a new note."}
        )
        data = response["data"]["createNote"]

        self.assertIsNotNone(data)
        self.assertEqual(data["title"], "New Note")

    def test_update_note_mutation_authenticated(self) -> None:
        self.graphql_client.force_login(self.user)

        response = self._create_note(
            {"title": "New Note", "body": "This is a new note."}
        )
        note_data = response["data"]["createNote"]

        mutation = """
            mutation UpdateNote($id: ID!, $title: String!, $body: String!) {
                updateNote(input: { id: $id, title: $title, body: $body }) {
                    title
                    body
                }
            }
        """
        variables = {
            "id": note_data["id"],
            "title": "Updated Title",
            "body": "Updated Body",
        }
        response = self.execute_graphql(mutation, variables)
        data = response["data"]["updateNote"]

        self.assertIsNotNone(data)
        self.assertEqual(data["title"], "Updated Title")

    def test_delete_note_mutation_authenticated(self) -> None:
        self.graphql_client.force_login(self.user)

        variables = {"title": "New Note", "body": "This is a new note."}
        response = self._create_note(variables)

        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(id: $id)
            }
        """
        variables = {"id": str(self.note.id)}
        response = self.execute_graphql(mutation, variables)
        success = response["data"]["deleteNote"]

        self.assertTrue(success)
        # Check if the note is actually deleted from the database
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note.id)
