from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(GraphQLTestCaseMixin, TestCase):
    def test_anonymous_user_query(self) -> None:
        """
        Test querying the currentUser with an anonymous user.
        Expect a single error indicating the user is not logged in and
        that no user data is returned.
        """
        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """

        response = self.execute_graphql(query)

        self.assertEqual(len(response["errors"]), 1, "Expected exactly one error")
        self.assertEqual(response["errors"][0]["message"], "User is not logged in.")
        self.assertIsNone(response["data"])

    def test_logged_in_user_query(self) -> None:
        """
        Test querying the currentUser with a logged-in user.
        Expect no errors and the currentUser data to match the logged-in user's details.
        """
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

        self.assertIsNone(response.get("errors"), "Expected no errors in the response")
        self.assertIn(
            "currentUser",
            response["data"],
            "'currentUser' data should be present in the response",
        )
        self.assertIsNotNone(response["data"]["currentUser"], "'currentUser' data should not be None")
        self.assertEqual(
            response["data"]["currentUser"]["email"],
            user.email,
            "Email does not match the logged-in user",
        )
        self.assertEqual(
            response["data"]["currentUser"]["username"],
            user.username,
            "Username does not match the logged-in user",
        )


class ClientGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_get_client_query(self) -> None:
        client_id = self.client_1.pk
        query = """
            query ViewClient($id: ID!) {
                client(pk: $id) {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """

        variables = {"id": client_id}
        expected_query_count = 1

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        returned_client = response["data"]["client"]
        expected_client = {
            "id": str(client_id),
            "firstName": self.client_1.first_name,
            "lastName": self.client_1.last_name,
            "email": self.client_1.email,
        }

        self.assertEqual(returned_client, expected_client)

    def test_get_clients_query(self) -> None:
        query = """
            query GetClients {
                clients {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """
        expected_query_count = 1
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        clients = response["data"]["clients"]
        client_count = User.objects.filter(client_profile__isnull=False).count()
        self.assertEqual(client_count, len(clients))
