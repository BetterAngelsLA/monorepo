from unittest.mock import ANY

from accounts.models import User
from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    SocialMediaEnum,
    YesNoPreferNotToSayEnum,
)
from clients.models import ClientProfile, HmisProfile
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from common.models import Attachment
from deepdiff import DeepDiff
from django.test import override_settings


class ClientProfileMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_client_profile_mutation(self) -> None:
        user = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "middleName": "Middly",
            "email": "firsty_lasty@example.com",
        }
        contact = {
            "name": "Jerry",
            "email": "jerry@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "bestie",
        }
        hmis_profile = {
            "hmisId": "12345678",
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        household_member = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "genderOther": None,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        phone_number = {
            "number": "2125551212",
            "isPrimary": True,
        }
        social_media_profile = {
            "platform": SocialMediaEnum.FACEBOOK.name,
            "platformUserId": "firsty_lasty",
        }

        variables = {
            "adaAccommodation": [AdaAccommodationEnum.VISUAL.name],
            "address": "1234 Main St",
            "californiaId": "L7654321",
            "contacts": [contact],
            "dateOfBirth": self.date_of_birth,
            "eyeColor": EyeColorEnum.BROWN.name,
            "gender": GenderEnum.OTHER.name,
            "genderOther": "genderqueer",
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 71.75,
            "hmisId": "12345678",
            "hmisProfiles": [hmis_profile],
            "householdMembers": [household_member],
            "importantNotes": "I am an important note",
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "mailingAddress": "1234 Mailing Street",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "phoneNumbers": [phone_number],
            "physicalDescription": "eerily cat-like",
            "placeOfBirth": "Los Angeles",
            "preferredCommunication": [],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": PronounEnum.SHE_HER_HERS.name,
            "pronounsOther": None,
            "race": RaceEnum.ASIAN.name,
            "residenceAddress": "1234 Residence Street",
            "socialMediaProfiles": social_media_profile,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "user": user,
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
        }
        response = self._create_client_profile_fixture(variables)
        client_profile = response["data"]["createClientProfile"]

        expected_contacts = [{"id": ANY, **contact}]
        expected_hmis_profiles = [{"id": ANY, **hmis_profile}]
        expected_household_members = [{"id": ANY, "displayGender": "Female", **household_member}]
        expected_phone_numbers = [{"id": ANY, **phone_number}]
        expected_social_media_profiles = [{"id": ANY, **social_media_profile}]
        expected_user = {"id": ANY, **user}
        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting some fields
            "id": ANY,
            "age": self.EXPECTED_CLIENT_AGE,
            "contacts": expected_contacts,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": "Not Assigned",
            "displayGender": "genderqueer",
            "displayPronouns": "She/Her/Hers",
            "hmisProfiles": expected_hmis_profiles,
            "householdMembers": expected_household_members,
            "phoneNumbers": expected_phone_numbers,
            "profilePhoto": None,
            "socialMediaProfiles": expected_social_media_profiles,
            "user": expected_user,
        }
        client_differences = DeepDiff(
            expected_client_profile,
            client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$"],
        )

        self.assertFalse(client_differences)

    def test_update_client_profile_mutation(self) -> None:
        user = {
            "id": self.client_profile_1["user"]["id"],
            "firstName": "Firstey",
            "lastName": "Lastey",
            "middleName": "Middley",
            "email": "firstey_lastey@example.com",
        }

        contact_1 = {
            "id": self.client_profile_1["contacts"][0]["id"],
            "name": "Jerryyy",
            "email": "jerryyy@example.co",
            "phoneNumber": "6465551212",
            "mailingAddress": "1235 Main Street",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "bff",
        }
        contact_new = {
            "name": "New guy",
            "email": "new_guy@example.co",
            "phoneNumber": "3475551212",
            "mailingAddress": "1236 Main Street",
            "relationshipToClient": RelationshipTypeEnum.UNCLE.name,
            "relationshipToClientOther": None,
        }
        contacts = [contact_1, contact_new]

        hmis_profiles: list = []

        household_member_1 = {
            "id": self.client_profile_1["householdMembers"][0]["id"],
            "name": "Daffodils",
            "dateOfBirth": "1900-01-02",
            "gender": GenderEnum.NON_BINARY.name,
            "genderOther": None,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        household_member_new = {
            "name": "Rose",
            "dateOfBirth": "1902-01-01",
            "gender": GenderEnum.OTHER.name,
            "genderOther": "pangender",
            "relationshipToClient": RelationshipTypeEnum.MOTHER.name,
            "relationshipToClientOther": None,
        }
        household_members = [household_member_1, household_member_new]

        client_1_phone_number_1 = {
            "id": self.client_profile_1["phoneNumbers"][0]["id"],
            "number": "2125551212",
            "isPrimary": False,
        }
        client_1_phone_number_new = {
            "number": "6465551212",
            "isPrimary": True,
        }
        client_1_phone_numbers = [client_1_phone_number_1, client_1_phone_number_new]
        client_1_social_media_profile_2 = {
            "platform": SocialMediaEnum.TWITTER.name,
            "platformUserId": "bortman",
        }
        client_1_social_media_profiles = [client_1_social_media_profile_2]

        variables = {
            "id": self.client_profile_1["id"],
            "adaAccommodation": [AdaAccommodationEnum.VISUAL.name, AdaAccommodationEnum.HEARING.name],
            "address": "1234 Main St",
            "californiaId": "L7654321",
            "contacts": contacts,
            "dateOfBirth": self.date_of_birth,
            "eyeColor": EyeColorEnum.GRAY.name,
            "gender": GenderEnum.FEMALE.name,
            "genderOther": None,
            "hairColor": HairColorEnum.GRAY.name,
            "heightInInches": 71.75,
            "hmisId": "12345678",  # TODO: remove after fe implements hmis profiles
            "hmisProfiles": hmis_profiles,
            "importantNotes": "I am a very important note",
            "householdMembers": household_members,
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "maritalStatus": MaritalStatusEnum.SEPARATED.name,
            "mailingAddress": "1234 Mailing St",
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "phoneNumbers": client_1_phone_numbers,
            "physicalDescription": "normally cat-like",
            "placeOfBirth": "Los Angeles, CA",
            "preferredCommunication": [PreferredCommunicationEnum.WHATSAPP.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": PronounEnum.OTHER.name,
            "pronounsOther": "she/her/theirs",
            "race": RaceEnum.BLACK_AFRICAN_AMERICAN.name,
            "residenceAddress": "1234 Residence St",
            "socialMediaProfiles": client_1_social_media_profiles,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "user": user,
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        # Add display fields to nested objects and update variables
        expected_household_member_1 = {"displayGender": "Non-binary", **household_member_1}
        expected_household_member_new = {"displayGender": "pangender", **household_member_new}
        expected_household_members = [expected_household_member_1, expected_household_member_new]
        variables["householdMembers"] = expected_household_members

        expected_client_profile = {
            **variables,  # Needs to be first because we're overwriting dob
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": "Not Assigned",
            "displayGender": "Female",
            "displayPronouns": "she/her/theirs",
            "profilePhoto": {"name": self.client_profile_1_photo_name},
        }
        client_differences = DeepDiff(
            expected_client_profile,
            client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$"],
        )

        self.assertFalse(client_differences)

    def test_partial_update_client_profile_mutation(self) -> None:
        # Manually update profile photo because it's created after the client profile fixture.
        self.client_profile_1["profilePhoto"] = {"name": self.client_profile_1_photo_name}

        variables = {
            "id": self.client_profile_1["id"],
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        self.assertEqual(client_profile, self.client_profile_1)

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

        expected_query_count = 41
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteClientProfile"])

        with self.assertRaises(ClientProfile.DoesNotExist):
            ClientProfile.objects.get(id=client_profile_id)

        with self.assertRaises(User.DoesNotExist):
            User.objects.get(id=user.pk)

        self.assertEqual(HmisProfile.objects.filter(id__in=hmis_profile_ids).count(), 0)

    @override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
    def test_update_client_profile_photo(self) -> None:
        client_profile_id = self.client_profile_1["id"]
        photo_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04\x01\x0a\x00"
            b"\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
        )
        photo_name = "profile_photo.jpg"

        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_client_profile_photo_fixture(
                client_profile_id,
                photo_content,
                photo_name,
            )

        photo_name = response["data"]["updateClientProfilePhoto"]["profilePhoto"]["name"]
        client_profile = ClientProfile.objects.get(id=client_profile_id)
        self.assertEqual(client_profile.profile_photo.name, photo_name)

        response = self._update_client_profile_photo_fixture(
            client_profile_id,
            photo_content,
            photo_name,
        )

        updated_photo_name = response["data"]["updateClientProfilePhoto"]["profilePhoto"]["name"]
        client_profile.refresh_from_db()
        self.assertEqual(client_profile.profile_photo.name, updated_photo_name)


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
            "The client document should have been created and persisted in the database.",
        )

    def test_delete_client_document(self) -> None:
        client_document_id = self.client_profile_1_document_1["id"]
        self.assertTrue(Attachment.objects.filter(id=client_document_id).exists())

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
            self._delete_client_document_fixture(client_document_id)

        self.assertFalse(
            Attachment.objects.filter(id=client_document_id).exists(),
            "The document should have been deleted from the database.",
        )
