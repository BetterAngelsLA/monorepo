from unittest.mock import ANY

from django.test import ignore_warnings
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

        expected_query_count = 36
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

    def test_revert_note_version_mutation_removes_added_moods(self) -> None:
        """
        Asserts that when revert note version mutation is called, the Note is
        reverted to the specified version.

        Test actions:
        1. Update note title and add 1 mood
        2. Get note and save it's lastSavedAt
        3. Add another mood
        4. Revert to lastSavedAt from Step 2
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
        self._update_note_fixture(persisted_update_variables)

        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    moods {
                        descriptor
                    }
                    lastSavedAt
                }
            }
        """
        response = self.execute_graphql(query, {"id": note_id})
        returned_note = response["data"]["note"]

        self.assertEqual(len(returned_note["moods"]), 1)
        last_saved_at = returned_note["lastSavedAt"]

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
            mutation RevertNoteVersion($data: RevertNoteVersionInput!) {
                revertNoteVersion(data: $data) {
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
        variables = {"id": note_id, "lastSavedAt": last_saved_at}

        expected_query_count = 8
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNoteVersion"]
        self.assertEqual(len(reverted_note["moods"]), 1)
        self.assertEqual(reverted_note["title"], "Updated Title")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")

    def test_revert_note_version_mutation_returns_removed_moods(self) -> None:
        """
        Asserts that when revert note version mutation is called, the Note is
        reverted to the specified version.

        Test actions:
        1. Update note title and add 1 mood
        2. Delete 1 mood
        3. Get note and save lastSavedAt
        4. Add 1 mood
        5. Revert to lastSavedAt from Step 3
        """
        note_id = self.note["id"]

        # Update - should be overriden
        persisted_update_variables = {
            "id": note_id,
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }
        self._update_note_fixture(persisted_update_variables)

        # Update - should be persisted
        persisted_update_variables["moods"] = []
        self._update_note_fixture(persisted_update_variables)

        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    moods {
                        descriptor
                    }
                    lastSavedAt
                }
            }
        """
        response = self.execute_graphql(query, {"id": note_id})
        returned_note = response["data"]["note"]

        self.assertEqual(len(returned_note["moods"]), 0)
        last_saved_at = returned_note["lastSavedAt"]

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
            mutation RevertNoteVersion($data: RevertNoteVersionInput!) {
                revertNoteVersion(data: $data) {
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
        variables = {"id": note_id, "lastSavedAt": last_saved_at}

        expected_query_count = 8
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNoteVersion"]
        self.assertEqual(len(reverted_note["moods"]), 0)
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
