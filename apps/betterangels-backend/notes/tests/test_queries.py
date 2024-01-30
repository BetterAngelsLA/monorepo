from django.test import ignore_warnings
from notes.tests.utils import NoteGraphQLBaseTestCase


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.users[0])

    def test_note_query(self) -> None:
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    body
                }
            }
        """
        variables = {"id": self.note["id"]}
        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)
        note = response["data"]["note"]
        self.assertEqual(note["body"], self.note["body"])

    def test_notes_query(self) -> None:
        query = """
          {
              notes {
                  id
                  body
              }
          }
        """
        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["body"], self.note["body"])
