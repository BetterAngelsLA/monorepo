from unittest.mock import ANY

from accounts.models import User
from accounts.tests.utils import ClientGraphQLBaseTestCase
from django.test import TestCase, ignore_warnings
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(GraphQLTestCaseMixin, TestCase):
    def test_anonymous_user_logout(self) -> None:
        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["logout"], False)

    def test_logged_in_user_logout(self) -> None:
        user = baker.make(User, email="test@example.com", username="testuser")
        self.graphql_client.force_login(user)

        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["logout"], True)


class ClientMutationTestCase(ClientGraphQLBaseTestCase):
    def test_create_client_mutation(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        client_profile = {"hmisId": "12345678"}
        variables = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "email": "firsty_lasty@example.com",
            "clientProfile": client_profile,
        }

        response = self._create_client_fixture(variables)
        client = response["data"]["createClient"]
        expected_client = {
            "id": ANY,
            "username": ANY,
            "firstName": "Firsty",
            "lastName": "Lasty",
            "email": "firsty_lasty@example.com",
            "clientProfile": {
                "hmisId": "12345678",
            },
        }
        self.assertEqual(client, expected_client)
