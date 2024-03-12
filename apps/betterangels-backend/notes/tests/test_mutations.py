from unittest.mock import ANY

from django.test import ignore_warnings
from django.utils import timezone
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    def test_create_note_mutation(self) -> None:
        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 32
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "This is a new note.",
                    "client": {"id": str(self.note_client_1.pk)},
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New Note",
            "moods": [],
            "publicDetails": "This is a new note.",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.note_client_1.pk)},
        }

        self.assertEqual(created_note, expected_note)

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "publicDetails": "Updated Body",
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
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.note_client_1.pk)},
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
                    ... on NoteType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.note["id"]}

        expected_query_count = 16
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])
