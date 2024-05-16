from unittest.mock import ANY

from accounts.enums import GenderEnum, LanguageEnum
from accounts.models import User
from accounts.tests.utils import ClientProfileGraphQLBaseTestCase
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


class ClientProfileMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def test_create_client_profile_mutation(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        client_profile_user = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "email": "firsty_lasty@example.com",
        }

        variables = {
            "hmisId": "12345678",
            "dateOfBirth": self.date_of_birth,
            "gender": GenderEnum.FEMALE.name,
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "user": client_profile_user,
        }

        response = self._create_client_profile_fixture(variables)
        client = response["data"]["createClientProfile"]
        expected_client_profile = {
            "id": ANY,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "age": self.EXPECTED_CLIENT_AGE,
            "gender": GenderEnum.FEMALE.name,
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "hmisId": "12345678",
            "user": {
                "username": ANY,
                "firstName": "Firsty",
                "lastName": "Lasty",
                "email": "firsty_lasty@example.com",
            },
        }

        self.assertEqual(client, expected_client_profile)
