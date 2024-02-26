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
        expected_query_count = 34
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
            "providedServices": [],
            "requestedServices": [],
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
            "services": [
                {"descriptor": "BLANKET", "serviceType": "PROVIDED"},
                {"descriptor": "WATER", "serviceType": "PROVIDED"},
                {"descriptor": "WATER", "serviceType": "REQUESTED"},
                {
                    "descriptor": "OTHER",
                    "customDescriptor": "another service",
                    "serviceType": "REQUESTED",
                },
            ],
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }

        expected_query_count = 53
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "providedServices": [
                {"descriptor": "BLANKET", "customDescriptor": ""},
                {"descriptor": "WATER", "customDescriptor": ""},
            ],
            "requestedServices": [
                {"descriptor": "WATER", "customDescriptor": ""},
                {
                    "descriptor": "OTHER",
                    "customDescriptor": "another service",
                },
            ],
            "publicDetails": "Updated Body",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.note_client_1.pk)},
        }

        # TODO: Break this out into its own test.
        # Verify that Note isn't returned with another note's properties.
        another_response = self._create_note_fixture(
            {
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": str(self.note_client_1.pk)},
            }
        )
        another_note = another_response["data"]["createNote"]
        another_note_variables = {
            "id": another_note["id"],
            "title": "Another Updated Title",
            "moods": [{"descriptor": "INDIFFERENT"}, {"descriptor": "RESTLESS"}],
            "services": [
                {"descriptor": "FOOD", "serviceType": "PROVIDED"},
                {"descriptor": "DENTAL", "serviceType": "PROVIDED"},
                {"descriptor": "SHELTER", "serviceType": "REQUESTED"},
                {
                    "descriptor": "OTHER",
                    "customDescriptor": "moar svc",
                    "serviceType": "REQUESTED",
                },
            ],
        }
        self._update_note_fixture(another_note_variables)

        self.assertEqual(updated_note, expected_note)

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
