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
        # TODO: add remaining fields; create "expected_note" to assert against, vs str values
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

    def test_create_note_mutation_from_existing_tasks(self) -> None:
        task1 = self._create_task({"title": "Task 1"})
        task2 = self._create_task({"title": "Task 2"})

        expected_query_count = 37
        with self.assertNumQueries(expected_query_count):
            response = self._create_note(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "parentTasks": [{"id": task1.id}, {"id": task2.id}],
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
            {"id": str(task2.id), "title": "Task 2", "status": "In Progress"},
        )

    def test_update_note_mutation_save_note(self) -> None:
        task1 = self._create_task({"title": "Existing task 1", "status": "In Progress"})
        task2 = self._create_task(
            {"title": "Existing task 2", "status": "Draft Completed"}
        )
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "publicDetails": "Updated Body",
            "parentTasks": [
                {"id": task1.id, "status": "Draft Completed"},
                {"id": task2.id, "status": "Draft Completed"},
                {"title": "Task from Note Purpose", "status": "Draft Completed"},
            ],
            "isSubmitted": False,
        }

        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 23
        with self.assertNumQueries(expected_query_count):
            response = self._update_note(variables)

        updated_note = response["data"]["updateNote"]
        self.assertEqual(updated_note["title"], "Updated Title")
        self.assertEqual(updated_note["publicDetails"], "Updated Body")

        self.assertEqual(len(updated_note["parentTasks"]), 3)

        parent_task_1 = updated_note["parentTasks"][0]
        parent_task_2 = updated_note["parentTasks"][1]
        parent_task_3 = updated_note["parentTasks"][2]
        self.assertEqual(parent_task_1["title"], "Existing task 1")
        self.assertEqual(parent_task_1["status"], "Draft Completed")
        self.assertEqual(parent_task_2["title"], "Existing task 2")
        self.assertEqual(parent_task_2["status"], "Draft Completed")
        self.assertEqual(parent_task_3["title"], "Task from Note Purpose")
        self.assertEqual(parent_task_3["status"], "Draft Completed")

        # Assert that can delete parentTasks on update
        variables["parentTasks"] = [
            {"title": "Some other check", "status": "Draft Completed"}
        ]

        response = self._update_note(variables)

        updated_note = response["data"]["updateNote"]
        self.assertEqual(len(updated_note["parentTasks"]), 1)

        parent_task = updated_note["parentTasks"][0]
        self.assertEqual(parent_task["title"], "Some other check")
        self.assertEqual(parent_task["status"], "Draft Completed")

    def test_update_note_mutation_submit_note(self) -> None:
        task1 = self._create_task({"title": "Existing task"})

        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "publicDetails": "Updated Body",
            "parentTasks": [
                {"id": task1.id, "status": "Draft Completed"},
                {"title": "Task from Purpose", "status": "Draft Completed"},
            ],
            "isSubmitted": True,
        }

        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 22
        with self.assertNumQueries(expected_query_count):
            response = self._update_note(variables)

        updated_note = response["data"]["updateNote"]

        self.assertEqual(len(updated_note["parentTasks"]), 2)

        parent_task_1 = updated_note["parentTasks"][0]
        parent_task_2 = updated_note["parentTasks"][1]
        self.assertEqual(parent_task_1["title"], "Existing task")
        self.assertEqual(parent_task_1["status"], "Completed")
        self.assertEqual(parent_task_2["title"], "Task from Purpose")
        self.assertEqual(parent_task_2["status"], "Completed")

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
