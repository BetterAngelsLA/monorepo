from accounts.enums import GenderEnum, LanguageEnum
from accounts.models import ClientProfile
from accounts.tests.utils import ClientProfileGraphQLBaseTestCase
from unittest_parametrize import parametrize


class ClientPermissionTestCase(ClientProfileGraphQLBaseTestCase):
    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case manager should succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        client_count = ClientProfile.objects.count()
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

        if should_succeed:
            self.assertIsNotNone(response["data"]["createClientProfile"]["id"])
            self.assertEqual(client_count + 1, ClientProfile.objects.count())
        else:
            self.assertEqual(
                response["data"]["createClientProfile"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "createClientProfile",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(client_count, ClientProfile.objects.count())

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
    def test_view_client_profile_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        mutation = """
            query ViewClientProfile($id: ID!) {
                clientProfile(pk: $id) {
                    id
                    hmisId
                    user {
                        firstName
                        lastName
                        email
                    }
                }
            }
        """
        variables = {"id": self.client_profile_1["id"]}
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
    def test_view_client_profiles_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)
        client_count = ClientProfile.objects.count()
        mutation = """
            query ViewClientProfiles {
                clientProfiles {
                    id
                    hmisId
                    user {
                        firstName
                        lastName
                        email
                    }
                }
            }
        """
        variables = {"id": self.client_profile_1["id"]}

        response = self.execute_graphql(mutation, variables)

        expected_client_count = client_count if should_succeed else 0
        self.assertTrue(len(response["data"]["clientProfiles"]) == expected_client_count)
