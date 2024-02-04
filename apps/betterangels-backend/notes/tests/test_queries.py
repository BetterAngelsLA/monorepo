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
                    publicDetails
                }
            }
        """
        variables = {"id": self.note["id"]}
        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)
        note = response["data"]["note"]
        self.assertEqual(note["publicDetails"], self.note["publicDetails"])

    def test_detailed_note_query(self) -> None:
        detailed_note = self._create_detailed_note()
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    moods {
                        title
                    }
                    parentTasks {
                        status
                        title

                    }
                    childTasks{
                        status
                        title
                    }
                    publicDetails
                }
            }
        """
        variables = {"id": detailed_note.id}
        # TODO: turn back on
        # expected_query_count = 6
        # with self.assertNumQueries(expected_query_count):
        response = self.execute_graphql(query, variables)
        print("$" * 100)
        print(response)
        note = response["data"]["note"]
        self.assertEqual(note["publicDetails"], "Some public details")
        self.assertEqual(note["moods"], [{"title": "Anxious"}, {"title": "Euthymic"}])
        self.assertEqual(
            note["parentTasks"],
            [
                {"title": "Wellness check week 1", "status": "Completed"},
                {"title": "DMV", "status": "In Progress"},
            ],
        )
        self.assertEqual(
            note["childTasks"],
            [{"title": "Wellness check week 2", "status": "In Progress"}],
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
        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query)
        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 2)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
