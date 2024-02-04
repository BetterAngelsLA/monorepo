from accounts.models import User
from django.test import ignore_warnings
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase
from model_bakery import baker


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login(0)

    def test_create_note_mutation_linked_to_existing_task(self) -> None:
        task1 = self._create_task({"title": "Task 1"})
        task2 = self._create_task({"title": "Task 2"})
        print("created tasks " * 100)
        # I think there as an opportunity to limit the amount of queries needed
        # TODO: turn back on
        # expected_query_count = 56
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self._create_note(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "parentTasks": [{"id": task1.id}, {"id": task2.id}],
                    "client": {"id": self.note_client.id},
                    # "client": self.note_client.id,
                    # "createdBy": self.users[0],
                }
            )
        created_note = response["data"]["createNote"]
        self.assertIsNotNone(response["data"]["createNote"])
        self.assertEqual(created_note["title"], "New Note")
        self.assertEqual(
            created_note["parentTasks"][0],
            {"id": str(task1.id), "title": "Task 1", "status": "In Progress"},
        )
        self.assertEqual(
            created_note["parentTasks"][1],
            {"id": str(task2.id), "title": "Task 2", "status": "In Progress"},
        )
        self.assertEqual(created_note["createdBy"]["id"], str(self.users[0].id))
        self.assertEqual(created_note["client"]["id"], str(self.note_client.id))

    def test_create_note_mutation_without_existing_task(self) -> None:
        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 56
        # TODO: turn back on
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self._create_note(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "parentTasks": [{"title": "Wellness check"}],
                }
            )
        created_note = response["data"]["createNote"]
        self.assertIsNotNone(response["data"]["createNote"])
        self.assertEqual(created_note["title"], "New Note")
        self.assertEqual(created_note["parentTasks"][0]["title"], "Wellness check")
        self.assertEqual(created_note["parentTasks"][0]["status"], "In Progress")
        self.assertIsNotNone(created_note["parentTasks"][0]["id"])

    def test_update_note_mutation(self) -> None:
        mutation = """
            mutation UpdateNote($id: ID!, $title: String!, $publicDetails: String!) {
                updateNote(data: { id: $id, title: $title, publicDetails: $publicDetails }) {
                    title
                    publicDetails
                }
            }
        """
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "publicDetails": "Updated Body",
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
                    id
                }
            }
        """
        variables = {"id": self.note["id"]}

        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 18
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])
