from accounts.models import User
from django.test import TestCase, ignore_warnings
from notes.models import Note
from test_utils.mixins import GraphQLTestCaseMixin


@ignore_warnings(category=UserWarning)
class NoteGraphQLTestCase(GraphQLTestCaseMixin, TestCase):
    def setUp(self) -> None:
        super().setUp()
        # Create test user and notes here
        self.user = User.objects.create(email="hoola@test.com", username="hoola")
        self.note1 = Note.objects.create(
            created_by=self.user, body="Test Note 1", title="testnote title 1"
        )
        self.note2 = Note.objects.create(
            created_by=self.user, body="Test Note 2", title="testnote title 2"
        )

    def test_notes_query_authenticated(self) -> None:
        self.graphql_client.force_login(self.user)

        query = """
          {
              notes {
                  id
                  body
              }
          }
        """
        response = self.execute_graphql(query)
        data = response["data"]["notes"]

        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["body"], "Test Note 1")
        # Add more assertions as necessary

    def test_notes_query_unauthenticated(self) -> None:
        query = """
            {
                notes {
                    id
                    body
                }
            }
        """
        response = self.execute_graphql(query)
        data = response["data"]["notes"]

        self.assertEqual(len(data), 0)
