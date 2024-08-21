from unittest.mock import ANY

from accounts.enums import (
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    MaritalStatusEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    YesNoPreferNotToSayEnum,
)
from accounts.models import ClientProfile, HmisProfile, User
from accounts.tests.utils import (
    ClientProfileGraphQLBaseTestCase,
    CurrentUserGraphQLBaseTestCase,
)
from common.models import Attachment
from deepdiff import DeepDiff
from django.test import TestCase, ignore_warnings, override_settings


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
        client_profile_contacts = [
            client_profile_contact_1,
            client_profile_contact_2,
        ]
        client_profile_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        client_profile_household_member_2 = {
            "name": "Tulips",
            "dateOfBirth": "1901-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        client_profile_household_members = [client_profile_household_member_1, client_profile_household_member_2]
        client_profile_hmis_profile = {
            "hmisId": "12345678",
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        expected_hmis_profile = {**client_profile_hmis_profile, "id": ANY}

        variables = {
            "address": "1234 Main St",
            "placeOfBirth": "Los Angeles",
            "contacts": client_profile_contacts,
            "dateOfBirth": self.date_of_birth,
            "eyeColor": EyeColorEnum.BROWN.name,
            "gender": GenderEnum.FEMALE.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 71.75,
            "hmisId": "12345678",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "hmisProfiles": [client_profile_hmis_profile],
            "householdMembers": client_profile_household_members,
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "physicalDescription": "eerily cat-like",
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": PronounEnum.SHE_HER_HERS.name,
            "pronounsOther": None,
            "race": RaceEnum.ASIAN.name,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": client_profile_user,
        }

        response = self._create_client_profile_fixture(variables)

        client_profile = response["data"]["createClientProfile"]
        expected_client_profile_contact_1 = {"id": ANY, **client_profile_contact_1}
        expected_client_profile_contact_2 = {"id": ANY, **client_profile_contact_2}
        expected_client_profile_contacts = [expected_client_profile_contact_1, expected_client_profile_contact_2]
        expected_client_profile_household_member_1 = {"id": ANY, **client_profile_household_member_1}
        expected_client_profile_household_member_2 = {"id": ANY, **client_profile_household_member_2}
        expected_client_profile_household_members = [
            expected_client_profile_household_member_1,
            expected_client_profile_household_member_2,
        ]
        expected_user = {"id": ANY, **client_profile_user}
        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting some fields
            "id": ANY,
            "age": self.EXPECTED_CLIENT_AGE,
            "contacts": expected_client_profile_contacts,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayPronouns": "She/Her/Hers",
            "displayCaseManager": "Not Assigned",
            "hmisProfiles": [expected_hmis_profile],
            "householdMembers": expected_client_profile_household_members,
            "user": expected_user,
        }

        client_differences = DeepDiff(
            client_profile,
            expected_client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$"],
        )

        self.assertFalse(client_differences)

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
        client_profile_contact_new = {
            "name": "New guy",
            "email": "new_guy@example.co",
            "phoneNumber": "3475551212",
            "mailingAddress": "1236 Main Street",
            "relationshipToClient": RelationshipTypeEnum.UNCLE.name,
            "relationshipToClientOther": None,
        }
        client_profile_contacts = [
            client_profile_contact_1,
            client_profile_contact_2,
            client_profile_contact_new,
        ]
        client_profile_household_member_1 = {
            "id": self.client_profile_1["householdMembers"][0]["id"],
            "name": "Daffodils",
            "dateOfBirth": "1900-01-02",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        client_profile_household_member_2 = {
            "id": self.client_profile_1["householdMembers"][1]["id"],
            "name": "Tulips",
            "dateOfBirth": "1901-01-02",
            "gender": GenderEnum.MALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "it's complicated",
        }
        client_profile_household_member_new = {
            "name": "Rose",
            "dateOfBirth": "1902-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.MOTHER.name,
            "relationshipToClientOther": None,
        }
        client_profile_household_members = [
            client_profile_household_member_1,
            client_profile_household_member_2,
            client_profile_household_member_new,
        ]
        client_profile_hmis_profile_1 = {
            "hmisId": "UPDATEDHMISidSANTAMONICA1",
            "agency": HmisAgencyEnum.SANTA_MONICA.name,
        }
        client_profile_hmis_profile_2 = {
            "hmisId": "UPDATEDHMISidCHAMP1",
            "agency": HmisAgencyEnum.CHAMP.name,
        }
        client_profile_hmis_profile_new = {
            "hmisId": "NEWHMISid1",
            "agency": HmisAgencyEnum.VASH.name,
        }
        hmis_profiles = [
            client_profile_hmis_profile_1,
            client_profile_hmis_profile_2,
            client_profile_hmis_profile_new,
        ]

        variables = {
            "id": self.client_profile_1["id"],
            "address": "1234 Main St",
            "placeOfBirth": "Los Angeles, CA",
            "contacts": client_profile_contacts,
            "dateOfBirth": self.date_of_birth,
            "eyeColor": EyeColorEnum.GRAY.name,
            "gender": GenderEnum.FEMALE.name,
            "hairColor": HairColorEnum.GRAY.name,
            "heightInInches": 71.75,
            "hmisId": "12345678",  # TODO: remove after fe implements hmis profiles
            "hmisProfiles": hmis_profiles,
            "householdMembers": client_profile_household_members,
            "maritalStatus": MaritalStatusEnum.SEPARATED.name,
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "physicalDescription": "normally cat-like",
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": PronounEnum.OTHER.name,
            "pronounsOther": "she/her/theirs",
            "race": RaceEnum.BLACK_AFRICAN_AMERICAN.name,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
            "user": client_profile_user,
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        client_profile_contact_new["id"] = ANY
        client_profile_household_member_new["id"] = ANY
        client_profile_hmis_profile_new["id"] = ANY

        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting dob
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayPronouns": "she/her/theirs",
            "displayCaseManager": "Not Assigned",
        }
        client_differences = DeepDiff(
            expected_client_profile,
            client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$"],
        )
        self.assertFalse(client_differences)

    def test_partial_update_client_profile_mutation(self) -> None:
        variables = {
            "id": self.client_profile_1["id"],
        }
        response = self._update_client_profile_fixture(variables)
        client = response["data"]["updateClientProfile"]

        self.assertEqual(client, self.client_profile_1)

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

        expected_query_count = 39
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteClientProfile"])

        with self.assertRaises(ClientProfile.DoesNotExist):
            ClientProfile.objects.get(id=client_profile_id)

        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user.pk)

        self.assertEqual(HmisProfile.objects.filter(id__in=hmis_profile_ids).count(), 0)


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class ClientDocumentMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_client_document(self) -> None:
        file_content = b"Test client document content"
        file_name = "test_client_document.txt"

        expected_query_count = 23
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._create_client_document_fixture(
                self.client_profile_1["id"],
                ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
                file_content,
                file_name,
            )

        client_document_id = response["data"]["createClientDocument"]["id"]
        self.assertEqual(
            response["data"]["createClientDocument"]["originalFilename"],
            file_name,
        )
        self.assertIsNotNone(response["data"]["createClientDocument"]["file"]["name"])
        self.assertTrue(
            Attachment.objects.filter(id=client_document_id).exists(),
            "The client document should have been created and exist in the database.",
        )

    def test_delete_client_document(self) -> None:
        client_document_id = self.client_profile_1_document_1["id"]
        self.assertTrue(Attachment.objects.filter(id=client_document_id).exists())

        expected_query_count = 14
        with self.assertNumQueriesWithoutCache(expected_query_count):
            self._delete_client_document_fixture(client_document_id)

        self.assertFalse(
            Attachment.objects.filter(id=client_document_id).exists(),
            "The document should have been deleted from the database.",
        )
