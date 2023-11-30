from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin


class GraphQLTestCase(GraphQLTestCaseMixin, TestCase):
    def test_anonymous_user(self) -> None:
        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """
        response = self.execute_graphql_query(query)
        self.assertIsNone(response.get("errors"))
        self.assertIsNone(response["data"]["currentUser"])

    def test_logged_in_user(self) -> None:
        user = baker.make(User, email="test@example.com", username="testuser")
        self.graphql_client.force_login(user)

        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """
        response = self.execute_graphql_query(query)

        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["currentUser"])
        self.assertEqual(response["data"]["currentUser"]["email"], user.email)
        self.assertEqual(response["data"]["currentUser"]["username"], user.username)
