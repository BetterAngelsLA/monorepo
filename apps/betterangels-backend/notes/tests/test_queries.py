from django.test import ignore_warnings
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager)

    def test_note_query(self) -> None:
        response = self._create_note_fixture(
            {
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": self.note_client.id},
            }
        )
        note_id = response["data"]["createNote"]["id"]
        note = self._update_note_fixture(
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
                    moods {
                        descriptor
                    }
                    publicDetails
                }
            }
        """
        variables = {"id": note_id}
        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]

        self.assertEqual(note["publicDetails"], "This is a new note.")
        self.assertEqual(
            note["moods"], [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}]
        )

    def test_notes_query(self) -> None:
        query = """
            {
                notes {
                    id
                    publicDetails
                }
            }
        """
        expected_query_count = 4
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
