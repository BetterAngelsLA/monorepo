from django.contrib.gis.geos import Point
from django.test import ignore_warnings
from model_bakery import baker
from notes.models import Location
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.case_manager)

    def test_note_query(self) -> None:
        case_manager = self.case_manager
        mock_point = Point(1.232433, 2.456546)
        location = baker.make(Location, point=mock_point, zip_code="90210-1234")

        response = self._create_note(
            {
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": self.note_client.id},
            }
        )
        note_id = response["data"]["createNote"]["id"]
        note = self._update_note(
            {
                "id": note_id,
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": self.note_client.id},
                "moods": [
                    {"title": "ANXIOUS"},
                    {"title": "EUTHYMIC"},
                ],
                "isSubmitted": False,
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    moods {
                        title
                    }
                    publicDetails
                }
            }
        """
        variables = {"id": note_id}
        expected_query_count = 3
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]

        self.assertEqual(note["publicDetails"], "This is a new note.")
        self.assertEqual(note["moods"], [{"title": "ANXIOUS"}, {"title": "EUTHYMIC"}])

    def test_notes_query(self) -> None:
        query = """
          {
              notes {
                  id
                  publicDetails
              }
          }
        """

        expected_query_count = 2
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
