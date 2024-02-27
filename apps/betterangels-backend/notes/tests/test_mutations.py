from unittest.mock import ANY

from django.test import ignore_warnings
from freezegun import freeze_time
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("case_manager_1")

    @freeze_time("2024-02-26")
    def test_create_note_mutation(self) -> None:
        # I think there as an opportunity to limit the amount of queries needed
        expected_query_count = 36
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": f"Session with {self.note_client_1.first_name}",
                    "client": {"id": str(self.note_client_1.pk)},
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": f"Session with {self.note_client_1.first_name}",
            "timestamp": "2024-02-26T00:00:00+00:00",
            "moods": [],
            "providedServices": [],
            "requestedServices": [],
            "publicDetails": "",
            "privateDetails": "",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.note_client_1.pk)},
        }
        self.assertEqual(created_note, expected_note)

    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "providedServices": [
                {"descriptor": "BLANKET"},
                {"descriptor": "WATER"},
            ],
            "requestedServices": [
                {"descriptor": "WATER"},
                {
                    "descriptor": "OTHER",
                    "customDescriptor": "another service",
                },
            ],
            "publicDetails": "Updated public note",
            "privateDetails": "Updated private note",
            "isSubmitted": False,
        }

        expected_query_count = 52
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "timestamp": ANY,
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
            "publicDetails": "Updated public note",
            "privateDetails": "Updated private note",
            "createdBy": {"id": str(self.case_manager_1.pk)},
            "client": {"id": str(self.note_client_1.pk)},
        }

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

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteNote"])
        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])
