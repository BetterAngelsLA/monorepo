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

    def test_create_note_mutation(self) -> None:
        expected_query_count = 35
        with self.assertNumQueries(expected_query_count):
            response = self._create_note(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "client": {"id": self.note_client.id},
                }
            )

        created_note = response["data"]["createNote"]
        self.assertEqual(created_note["title"], "New Note")
        self.assertEqual(created_note["createdBy"]["id"], str(self.users[0].id))
        self.assertEqual(created_note["client"]["id"], str(self.note_client.id))

    def test_create_note_mutation_linked_to_existing_task(self) -> None:
        task1 = self._create_task({"title": "Task 1"})
        task2 = self._create_task({"title": "Task 2"})

        expected_query_count = 39
        with self.assertNumQueries(expected_query_count):
            response = self._create_note(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "parentTasks": [{"id": task1.id, "status": "In Progress"}, {"id": task2.id, "status": "Completed"}],
                    "client": {"id": self.note_client.id},
                }
            )

        created_note = response["data"]["createNote"]
        self.assertEqual(
            created_note["parentTasks"][0],
            {"id": str(task1.id), "title": "Task 1", "status": "In Progress"},
        )
        self.assertEqual(
            created_note["parentTasks"][1],
            {"id": str(task2.id), "title": "Task 2", "status": "Completed"},
        )

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "publicDetails": "Updated Body",
            "parentTasks": [{"title": "Wellness check", "status": "Completed"}],
        }

        # I think there as an opportunity to limit the amount of queries needed
        # expected_query_count = 13
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self._update_note(variables)

        updated_note = response["data"]["updateNote"]
        self.assertEqual(updated_note["title"], "Updated Title")
        self.assertEqual(updated_note["publicDetails"], "Updated Body")

        self.assertEqual(len(updated_note["parentTasks"]), 1)
        parent_task = updated_note["parentTasks"][0]

        self.assertEqual(parent_task["title"], "Wellness check")
        self.assertEqual(parent_task["status"], "Completed")

        # Assert that can delete parentTasks on update
        variables["parentTasks"] = [{"title": "Some other check", "status": "Completed"}]

        response = self._update_note(variables)

        updated_note = response["data"]["updateNote"]
        self.assertEqual(len(updated_note["parentTasks"]), 1)

        parent_task = updated_note["parentTasks"][0]
        self.assertEqual(parent_task["title"], "Some other check")
        self.assertEqual(parent_task["status"], "Completed")

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
