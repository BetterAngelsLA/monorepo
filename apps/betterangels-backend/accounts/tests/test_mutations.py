from accounts.models import User
from accounts.tests.utils import CurrentUserGraphQLBaseTestCase
from django.test import TestCase, ignore_warnings


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(CurrentUserGraphQLBaseTestCase, TestCase):
    def test_anonymous_user_logout(self) -> None:
        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(response["data"]["logout"])

    def test_logged_in_user_logout(self) -> None:
        self.graphql_client.force_login(self.user)

        query = """
        mutation {
            logout
        }
        """
        response = self.execute_graphql(query)
        self.assertIsNone(response.get("errors"))
        self.assertTrue(response["data"]["logout"])

    def test_update_current_user_mutation(self) -> None:
        variables = {
            "id": str(self.user.pk),
            "firstName": "Daley",
            "lastName": "Coopery",
            "middleName": "Barty",
            "email": "dale@example.co",
            "hasAcceptedTos": False,
            "hasAcceptedPrivacyPolicy": False,
        }

        self.graphql_client.force_login(self.user)
        response = self._update_current_user_fixture(variables)
        user = response["data"]["updateCurrentUser"]
        expected_user = {
            **variables,
            "isOutreachAuthorized": True,
            "organizations": [
                {"id": str(self.user_organization.pk), "name": self.user_organization.name},
            ],
        }

        self.assertEqual(user, expected_user)

    def test_delete_current_user(self) -> None:
        initial_user_count = User.objects.count()
        self.graphql_client.force_login(self.user)

        mutation: str = """
            mutation DeleteCurrentUser {
                deleteCurrentUser {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        response = self.execute_graphql(mutation)["data"]["deleteCurrentUser"]
        self.assertEqual(response["id"], self.user.pk)
        self.assertEqual(User.objects.count(), initial_user_count - 1)
