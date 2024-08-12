from unittest.mock import ANY

from accounts.enums import (
    GenderEnum,
    HmisAgencyEnum,
    LanguageEnum,
    PronounEnum,
    RelationshipTypeEnum,
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
        client_profile_contact_1 = {
            "name": "Jerry",
            "email": "jerry@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "bestie",
        }
        client_profile_contact_2 = {
            "name": "Gary",
            "email": "gary@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        client_contacts = [
            client_profile_contact_1,
            client_profile_contact_2,
        ]
        client_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        client_household_member_2 = {
            "name": "Tulips",
            "dateOfBirth": "1901-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        client_household_members = [client_household_member_1, client_household_member_2]
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
            "pronouns": PronounEnum.SHE_HER_HERS.name,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": client_profile_user,
            "contacts": client_contacts,
            "householdMembers": client_household_members,
        }

        response = self._create_client_profile_fixture(variables)

        client_profile = response["data"]["createClientProfile"]
        expected_client_profile_contact_1 = {"id": ANY, **client_profile_contact_1}
        expected_client_profile_contact_2 = {"id": ANY, **client_profile_contact_2}
        expected_client_contacts = [expected_client_profile_contact_1, expected_client_profile_contact_2]
        expected_client_household_member_1 = {"id": ANY, **client_household_member_1}
        expected_client_household_member_2 = {"id": ANY, **client_household_member_2}
        expected_client_household_members = [expected_client_household_member_1, expected_client_household_member_2]
        expected_user = {"id": ANY, **client_profile_user}
        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting some fields
            "id": ANY,
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "contacts": expected_client_contacts,
            "user": expected_user,
            "hmisProfiles": [expected_hmis_profile],
            "householdMembers": expected_client_household_members,
        }
        self.assertEqual(client_profile, expected_client_profile)

    def test_update_client_profile_mutation(self) -> None:
        client_profile_user = {
            "id": self.client_profile_1["user"]["id"],
            "firstName": "Firstey",
            "lastName": "Lastey",
            "middleName": "Middley",
            "email": "firstey_lastey@example.com",
        }
        client_profile_contact_1 = {
            "id": self.client_profile_1["contacts"][0]["id"],
            "name": "Jerryyy",
            "email": "jerryyy@example.co",
            "phoneNumber": "6465551212",
            "mailingAddress": "1235 Main Street",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "bff",
        }
        client_profile_contact_2 = {
            "id": self.client_profile_1["contacts"][1]["id"],
            "name": "Garyyy",
            "email": "garyyy@example.co",
            "phoneNumber": "6465551212",
            "mailingAddress": "1235 Main Street",
            "relationshipToClient": RelationshipTypeEnum.PET.name,
            "relationshipToClientOther": None,
        }

        # Make sure we can add a new contact while updating existing contacts
        client_profile_contact_3 = {
            "name": "New guy",
            "email": "new_guy@example.co",
            "phoneNumber": "3475551212",
            "mailingAddress": "1236 Main Street",
            "relationshipToClient": RelationshipTypeEnum.UNCLE.name,
            "relationshipToClientOther": None,
        }
        client_contacts = [
            client_profile_contact_1,
            client_profile_contact_2,
            client_profile_contact_3,
        ]
        client_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        client_household_member_2 = {
            "name": "Tulips",
            "dateOfBirth": "1901-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        client_household_member_3 = {
            "name": "Roses",
            "dateOfBirth": "1902-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.MOTHER.name,
            "relationshipToClientOther": None,
        }
        client_household_members = [client_household_member_1, client_household_member_2, client_household_member_3]
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
            "pronouns": PronounEnum.SHE_HER_HERS.name,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "contacts": client_contacts,
            "user": client_profile_user,
            "householdMembers": client_household_members,
        }
        response = self._update_client_profile_fixture(variables)
        client = response["data"]["updateClientProfile"]

        client_profile_contact_3["id"] = ANY
        hmis_profile_to_create = {
            **hmis_profile_to_create,
            "id": ANY,
        }
        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting dob
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "age": self.EXPECTED_CLIENT_AGE,
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

        expected_query_count = 35
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteClientProfile"])

        with self.assertRaises(ClientProfile.DoesNotExist):
            ClientProfile.objects.get(id=client_profile_id)

        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user.pk)

        self.assertEqual(HmisProfile.objects.filter(id__in=hmis_profile_ids).count(), 0)
