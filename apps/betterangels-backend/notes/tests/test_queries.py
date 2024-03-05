from django.test import ignore_warnings
from freezegun import freeze_time
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
@freeze_time("2024-03-04")
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
        self.update_note_fixture(
            {
                "id": note_id,
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "moods": [
                    {"descriptor": "ANXIOUS"},
                    {"descriptor": "EUTHYMIC"},
                ],
                "isSubmitted": False,
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    title
                    publicDetails
                    timestamp
                    purposes {
                        id
                        title
                    }
                    nextSteps {
                        id
                        title
                    }
                    moods {
                        descriptor
                    }
                    publicDetails
                    privateDetails
                }
            }
        """
        variables = {"id": note_id}
        expected_query_count = 7

        note = Note.objects.get(id=note_id)
        note.purposes.add(*self.purposes)
        note.next_steps.add(*self.next_steps)

        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        returned_note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "title": "New Note",
            "publicDetails": "This is a new note.",
            "timestamp": "2024-03-04T00:00:00+00:00",
            "purposes": [
                {"id": str(self.purposes[0].id), "title": self.purposes[0].title},
                {"id": str(self.purposes[1].id), "title": self.purposes[1].title},
            ],
            "nextSteps": [
                {"id": str(self.next_steps[0].id), "title": self.next_steps[0].title},
                {"id": str(self.next_steps[1].id), "title": self.next_steps[1].title},
            ],
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "privateDetails": "",
        }
        self.assertEqual(returned_note, expected_note)

    def test_notes_query(self) -> None:
        query = """
            {
                notes {
                    id
                    publicDetails
                    privateDetails
                }
            }
        """
        expected_query_count = 6
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
