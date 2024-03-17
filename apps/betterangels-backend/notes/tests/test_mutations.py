from unittest.mock import ANY

from common.models import Attachment
from django.test import ignore_warnings, override_settings
from django.utils import timezone
from freezegun import freeze_time
from notes.enums import NoteNamespaceEnum
from notes.models import Note, Task
from notes.tests.utils import NoteGraphQLBaseTestCase, TaskGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_note_mutation(self) -> None:
        expected_query_count = 32
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "client": {"id": str(self.client_1.pk)},
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New Note",
            "moods": [],
            "publicDetails": "This is a new note.",
            "privateDetails": "",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "client": {"id": str(self.client_1.pk)},
        }

        self.assertEqual(created_note, expected_note)

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
        }

        expected_query_count = 32
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "privateDetails": "Updated private details",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "client": {"id": str(self.client_1.pk)},
        }
        self.assertEqual(updated_note, expected_note)

    def test_revert_note_mutation_removes_added_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.

        Test actions:
        1. Update note title and add 1 mood
        2. Save now as saved_at
        3. Add another mood
        4. Revert to saved_at from Step 2
        5. Assert note has only 1 mood
        """
        note_id = self.note["id"]

        # Update - should be persisted
        persisted_update_variables = {
            "id": note_id,
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(persisted_update_variables)
        returned_note = response["data"]["updateNote"]
        self.assertEqual(len(returned_note["moods"]), 1)

        # Select a moment to revert to
        saved_at = timezone.now()

        # Update - should be discarded
        discarded_update_variables = {
            "id": note_id,
            "title": "Discarded Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Discarded Body",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(discarded_update_variables)
        self.assertEqual(len(response["data"]["updateNote"]["moods"]), 2)

        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 8
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["moods"]), 1)
        self.assertEqual(reverted_note["title"], "Updated Title")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")

    def test_revert_note_mutation_returns_removed_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.

        Test actions:
        1. Update note title and add 2 moods
        2. Save now as saved_at
        3. Delete 1 mood
        4. Revert to savedAt from Step 2
        5. Assert note has 2 moods again
        """
        note_id = self.note["id"]

        # Update - should be persisted
        persisted_update_variables = {
            "id": note_id,
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(persisted_update_variables)
        returned_note = response["data"]["updateNote"]
        self.assertEqual(len(returned_note["moods"]), 2)

        # Select a moment to revert to
        saved_at = timezone.now()

        # Update - should be discarded
        discarded_update_variables = {
            "id": note_id,
            "title": "Discarded Title",
            "moods": [{"descriptor": "ANXIOUS"}],
            "publicDetails": "Discarded Body",
            "isSubmitted": False,
        }
        response = self._update_note_fixture(discarded_update_variables)
        self.assertEqual(len(response["data"]["updateNote"]["moods"]), 1)

        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 8
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["moods"]), 2)
        self.assertEqual(reverted_note["title"], "Updated Title")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")

    def test_delete_note_mutation(self) -> None:
        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.note["id"]}

        expected_query_count = 17
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_note_attachment(self) -> None:
        file_content = b"Test attachment content"
        file_name = "test_attachment.txt"

        with self.assertNumQueries(22):
            create_response = self._create_note_attachment_fixture(
                self.note["id"],
                NoteNamespaceEnum.MOOD_ASSESSMENT.name,
                file_content,
                file_name,
            )

        attachment_id = create_response["data"]["createNoteAttachment"]["id"]
        self.assertEqual(
            create_response["data"]["createNoteAttachment"]["originalFilename"],
            file_name,
        )
        self.assertIsNotNone(
            create_response["data"]["createNoteAttachment"]["file"]["name"]
        )
        self.assertTrue(
            Attachment.objects.filter(id=attachment_id).exists(),
            "The attachment should have been created and exist in the database.",
        )

    def test_delete_note_attachment(self) -> None:
        file_content = b"Content for deletion test"
        file_name = "delete_test_attachment.txt"
        create_response = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            file_content,
            file_name,
        )

        attachment_id = create_response["data"]["createNoteAttachment"]["id"]
        self.assertTrue(Attachment.objects.filter(id=attachment_id).exists())

        with self.assertNumQueries(13):
            self._delete_note_attachment_fixture(attachment_id)

        self.assertFalse(
            Attachment.objects.filter(id=attachment_id).exists(),
            "The attachment should have been deleted from the database.",
        )


@freeze_time("2024-02-26")
@ignore_warnings(category=UserWarning)
class TaskMutationTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_task_mutation(self) -> None:
        expected_query_count = 28
        with self.assertNumQueries(expected_query_count):
            response = self._create_task_fixture(
                {
                    "title": "New Task",
                    "status": "TO_DO",
                }
            )
        created_task = response["data"]["createTask"]
        expected_task = {
            "id": ANY,
            "title": "New Task",
            "status": "TO_DO",
            "dueBy": None,
            "client": None,
            "createdAt": "2024-02-26T00:00:00+00:00",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }
        self.assertEqual(created_task, expected_task)

    def test_update_task_mutation(self) -> None:
        variables = {
            "id": self.task["id"],
            "title": "Updated task title",
            "client": {"id": str(self.client_1.pk)},
            "status": "COMPLETED",
        }

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "COMPLETED",
            "dueBy": None,
            "client": {"id": str(self.client_1.pk)},
            "createdAt": "2024-02-26T00:00:00+00:00",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }
        self.assertEqual(updated_task, expected_task)

    def test_delete_task_mutation(self) -> None:
        mutation = """
            mutation DeleteTask($id: ID!) {
                deleteTask(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on TaskType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.task["id"]}

        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=self.task["id"])
