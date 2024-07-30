from unittest.mock import ANY

from accounts.enums import (
    GenderEnum,
    HmisAgencyEnum,
    LanguageEnum,
    YesNoPreferNotToSayEnum,
)
from accounts.models import ClientProfile, HmisProfile, User
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
        self.assertFalse(response["data"]["logout"])

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
        self.assertTrue(response["data"]["logout"])

    def test_delete_current_user(self) -> None:
        initial_user_count = User.objects.count()
        user = baker.make(User)
        self.assertEqual(initial_user_count + 1, User.objects.count())

        self.graphql_client.force_login(user)

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
        self.assertEqual(response["id"], user.pk)
        self.assertEqual(initial_user_count, User.objects.count())


class ClientProfileMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_client_profile_mutation(self) -> None:
        client_profile_user = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "middleName": "Middly",
            "email": "firsty_lasty@example.com",
        }
        client_profile_hmis_profile = {
            "hmisId": "12345678",
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        expected_hmis_profile = {**client_profile_hmis_profile, "id": ANY}

        variables = {
            "address": "1234 Main St",
            "dateOfBirth": self.date_of_birth,
            "gender": GenderEnum.FEMALE.name,
            "hmisId": "12345678",
            "hmisProfiles": [client_profile_hmis_profile],
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": "she/her",
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": client_profile_user,
        }

        response = self._create_client_profile_fixture(variables)
        client = response["data"]["createClientProfile"]
        expected_client_profile = {
            "id": ANY,
            "age": self.EXPECTED_CLIENT_AGE,
            "address": "1234 Main St",
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "gender": GenderEnum.FEMALE.name,
            "hmisId": "12345678",
            "hmisProfiles": [expected_hmis_profile],
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": "she/her",
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": {
                "id": ANY,
                "firstName": "Firsty",
                "lastName": "Lasty",
                "middleName": "Middly",
                "email": "firsty_lasty@example.com",
            },
        }

        self.assertEqual(client, expected_client_profile)

    def test_update_client_profile_mutation(self) -> None:
        client_profile_user = {
            "id": self.client_profile_1["user"]["id"],
            "firstName": "Firstey",
            "lastName": "Lastey",
            "middleName": "Middley",
            "email": "firstey_lastey@example.com",
        }
        hmis_profile_to_update = {
            "id": str(self.client_profile_1_hmis_profile_1.id),
            "hmisId": "UPDATEDHMISID",
            "agency": HmisAgencyEnum.SANTA_MONICA.name,
        }
        hmis_profile_to_create = {
            "hmisId": "NEWHMISPROFILEID",
            "agency": HmisAgencyEnum.VASH.name,
        }
        hmis_profiles = [
            hmis_profile_to_update,
            hmis_profile_to_create,
        ]

        variables = {
            "id": self.client_profile_1["id"],
            "address": "1234 Main St",
            "dateOfBirth": self.date_of_birth,
            "gender": GenderEnum.FEMALE.name,
            "hmisId": "12345678",
            "hmisProfiles": hmis_profiles,
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": "she/her",
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": client_profile_user,
        }

        response = self._update_client_profile_fixture(variables)
        client = response["data"]["updateClientProfile"]

        hmis_profile_to_create = {
            **hmis_profile_to_create,
            "id": ANY,
        }
        expected_client_profile = {
            **variables,
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
        }
        self.assertCountEqual(client, expected_client_profile)

    def test_delete_client_profile_mutation(self) -> None:
        client_profile_id = self.client_profile_1["id"]
        client_profile = ClientProfile.objects.get(id=client_profile_id)
        user = client_profile.user
        hmis_profile_ids = client_profile.hmis_profiles.values_list("id", flat=True)

        mutation = """
            mutation DeleteClientProfile($id: ID!) {
                deleteClientProfile(data: { id: $id }) {
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
        variables = {"id": client_profile_id}

        expected_query_count = 33
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteClientProfile"])

        with self.assertRaises(ClientProfile.DoesNotExist):
            ClientProfile.objects.get(id=client_profile_id)

        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user.pk)

        self.assertEqual(HmisProfile.objects.filter(id__in=hmis_profile_ids).count(), 0)
