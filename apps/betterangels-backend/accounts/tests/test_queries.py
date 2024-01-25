from accounts.models import User
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(GraphQLTestCaseMixin, TestCase):
    def test_anonymous_user_query(self) -> None:
        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """
        response = self.execute_graphql(query)
        self.assertEqual(response["errors"][0]["message"], "User is not logged in.")
        self.assertIsNone(response["data"]["currentUser"])

    def test_logged_in_user_query(self) -> None:
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
        response = self.execute_graphql(query)

        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["currentUser"])
        self.assertEqual(response["data"]["currentUser"]["email"], user.email)
        self.assertEqual(response["data"]["currentUser"]["username"], user.username)
