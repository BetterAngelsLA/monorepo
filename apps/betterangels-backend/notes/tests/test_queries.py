from django.test import ignore_warnings
from notes.enums import MoodEnum, TaskStatusEnum
from notes.models import Location, Mood
from notes.tests.utils import NoteGraphQLBaseTestCase
from model_bakery import baker

from django.contrib.gis.geos import Point


@ignore_warnings(category=UserWarning)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.users[0])

    def test_note_query(self) -> None:
        case_manager = self.users[0]
        mock_point = Point(1.232433, 2.456546)
        location = baker.make(Location, point=mock_point, zip_code=90000)
        # mood1 = baker.make(Mood, title=MoodEnum.ANXIOUS.value)
        # mood2 = baker.make(Mood, title=MoodEnum.EUTHYMIC.value)

        task1 = self._create_task(
            dict(
                title="Wellness check week 1",
                status=TaskStatusEnum.COMPLETED,
                location=location,
                client=self.note_client,
                created_by=case_manager,
            )
        )
        task2 = self._create_task(
            dict(
                title="DMV",
                location=location,
                client=self.note_client,
                created_by=case_manager,
            )
        )
        response = self._create_note(
            {
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": self.note_client.id},
                "parentTasks": [{"id": task1.id}, {"id": task2.id}],
            }
        )
        note_id = response["data"]["createNote"]["id"]
        note = self._update_note(
            {
                "id": note_id,
                "title": "New Note",
                "publicDetails": "This is a new note.",
                "client": {"id": self.note_client.id},
                "parentTasks": [{"id": task1.id}, {"id": task2.id}],
                "moods": [
                    {"title": MoodEnum.ANXIOUS.value},
                    {"title": MoodEnum.EUTHYMIC.value},
                ],
                "isSubmitted": False,
            }
        )
        query = """
            query ViewNote($id: ID!) {
                note(pk: $id) {
                    id
                    parentTasks {
                        status
                        title
                    }
                    childTasks{
                        status
                        title
                    }
                    moods {
                        title
                    }
                    publicDetails
                }
            }
        """
        variables = {"id": note_id}
        expected_query_count = 8
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]

        self.assertEqual(note["publicDetails"], "This is a new note.")
        self.assertEqual(note["moods"], [{"title": "Anxious"}, {"title": "Euthymic"}])
        self.assertEqual(
            note["parentTasks"],
            [
                {"title": "Wellness check week 1", "status": "Completed"},
                {"title": "DMV", "status": "In Progress"},
            ],
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
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0]["publicDetails"], self.note["publicDetails"])
