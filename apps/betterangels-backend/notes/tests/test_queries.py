from django.test import ignore_warnings
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
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
                    title
                    publicDetails
                    moods {
                        descriptor
                    }
                    publicDetails
                    privateDetails
                    historyId
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
        self.assertEqual(note["historyId"], 36)

    def test_notes_query(self) -> None:
        self._create_note_fixture(
            {
                "title": "Note 2",
                "publicDetails": "Note 2 details",
                "client": {"id": self.note_client_1.id},
            }
        )
        self._create_note_fixture(
            {
                "title": "Note 3",
                "publicDetails": "Note 3 details",
                "client": {"id": self.note_client_1.id},
            }
        )
        query = """
            {
                notes {
                    id
                    publicDetails
                    privateDetails
                    historyId
                }
            }
        """
        # TODO: update the NoteManager to prefetch permission records to lower this count
        expected_query_count = 10
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 3)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
