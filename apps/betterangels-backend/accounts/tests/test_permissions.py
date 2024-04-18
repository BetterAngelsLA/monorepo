from accounts.models import Client
from accounts.tests.utils import ClientGraphQLBaseTestCase
from unittest_parametrize import parametrize


class ClientPermissionTestCase(ClientGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_client_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        client_count = Client.objects.count()
        client_profile = {"hmisId": "12345678"}
        variables = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "email": "firsty_lasty@example.com",
            "clientProfile": client_profile,
        }
        response = self._create_client_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createClient"]["id"])
            self.assertEqual(client_count + 1, Client.objects.count())
        else:
            self.assertEqual(
                response["data"]["createClient"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createClient",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(client_count, Client.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_client_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewClient($id: ID!) {
                client(pk: $id) {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """
        variables = {"id": self.client_1["id"]}
        response = self.execute_graphql(mutation, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other CM in different org should not succeed
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_clients_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        client_count = Client.objects.count()
        mutation = """
            query ViewClients {
                clients {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """
        variables = {"id": self.client_1["id"]}

        response = self.execute_graphql(mutation, variables)

        expected_client_count = client_count if should_succeed else 0
        self.assertTrue(len(response["data"]["clients"]) == expected_client_count)
