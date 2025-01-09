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

    def test_update_client_profile_mutation_validation(self) -> None:
        contact = {
            "phoneNumber": "125551212",
            "relationshipToClient": RelationshipTypeEnum.AUNT.name,
        }
        hmis_profile = {
            "hmisId": self.client_profile_1["hmisProfiles"][0]["hmisId"],
            "agency": self.client_profile_1["hmisProfiles"][0]["agency"],
        }
        phone_number = {
            "number": "125551212",
            "isPrimary": True,
        }
        user = {
            "id": self.client_profile_2["user"]["id"],
            "firstName": "",
            "lastName": "",
            "middleName": "",
            "email": self.client_profile_1["user"]["email"],
        }

        variables = {
            "id": self.client_profile_2["id"],
            "contacts": [contact],
            "hmisProfiles": [hmis_profile],
            "nickname": "",
            "phoneNumbers": [phone_number],
            "user": user,
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(validation_errors["message"], "Validation Errors")
        self.assertEqual(len(error_messages), 5)
        self.assertEqual(error_messages[0]["field"], "full_name")
        self.assertEqual(error_messages[0]["message"], "At least one name field is required")
        self.assertEqual(error_messages[1]["field"], "email")
        self.assertEqual(error_messages[1]["message"], "This email is already in use")
        self.assertEqual(error_messages[2]["field"], "contacts__0__phone_number")
        self.assertEqual(error_messages[2]["message"], "The phone number entered is not valid")
        self.assertEqual(error_messages[3]["field"], "hmis_profiles__0")
        self.assertEqual(error_messages[3]["message"], "This LAHSA HMIS ID is already in use")
        self.assertEqual(error_messages[4]["field"], "phone_numbers__0__number")
        self.assertEqual(error_messages[4]["message"], "The phone number entered is not valid")

    def test_update_client_profile_mutation(self) -> None:
        user = {
            "id": self.client_profile_1["user"]["id"],
            "firstName": "Firstey",
            "lastName": "Lastey",
            "middleName": "Middley",
            "email": "firstey_lastey@example.com",
        }

        contacts: list = []

        hmis_profile_update = {
            "id": self.client_profile_1["hmisProfiles"][0]["id"],
            "agency": HmisAgencyEnum.LAHSA.name,
            "hmisId": "HMISidLAHSA1Updated",
        }
        hmis_profile_new = {
            "hmisId": "HMISidPASADENA1New",
            "agency": HmisAgencyEnum.PASADENA.name,
        }
        hmis_profiles = [hmis_profile_update, hmis_profile_new]

        household_member_update = {
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
        household_members = [household_member_update, household_member_new]

        phone_number_update = {
            "id": self.client_profile_1["phoneNumbers"][0]["id"],
            "number": "2125551212",
            "isPrimary": False,
        }
        phone_number_new = {
            "number": "6465551212",
            "isPrimary": True,
        }
        phone_numbers = [phone_number_update, phone_number_new]
        social_media_profile_new = {
            "platform": SocialMediaEnum.TWITTER.name,
            "platformUserId": "bortman",
        }
        social_media_profiles = [social_media_profile_new]

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
            "hmisProfiles": hmis_profiles,
            "importantNotes": "I am a very important note",
            "householdMembers": household_members,
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "maritalStatus": MaritalStatusEnum.SEPARATED.name,
            "mailingAddress": "1234 Mailing St",
            "nickname": "Fasty",
            "phoneNumber": "2125551212",
            "phoneNumbers": phone_numbers,
            "physicalDescription": "normally cat-like",
            "placeOfBirth": "Los Angeles, CA",
            "preferredCommunication": [PreferredCommunicationEnum.WHATSAPP.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": PronounEnum.OTHER.name,
            "pronounsOther": "she/her/theirs",
            "race": RaceEnum.BLACK_AFRICAN_AMERICAN.name,
            "residenceAddress": "1234 Residence St",
            "socialMediaProfiles": social_media_profiles,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "user": user,
            "veteranStatus": YesNoPreferNotToSayEnum.YES.name,
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        # Add display fields to nested objects and update variables
        expected_household_member_update = {"displayGender": "Non-binary", **household_member_update}
        expected_household_member_new = {"displayGender": "pangender", **household_member_new}
        expected_household_members = [expected_household_member_update, expected_household_member_new]
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

    def test_update_client_profile_mutation_related_objects(self) -> None:
        """Verifies that updating a client profile's doesn't affect other client profiles."""
        client_profile_2 = ClientProfile.objects.get(id=self.client_profile_2["id"])
        self.assertEqual(client_profile_2.hmis_profiles.count(), 1)
        self.assertEqual(client_profile_2.phone_numbers.count(), 1)

        hmis_profile_update = {
            "id": self.client_profile_1["hmisProfiles"][0]["id"],
            "agency": HmisAgencyEnum.LAHSA.name,
            "hmisId": "HMISidLAHSA1Updated",
        }
        hmis_profile_new = {
            "hmisId": "HMISidPASADENA1New",
            "agency": HmisAgencyEnum.PASADENA.name,
        }
        hmis_profiles = [hmis_profile_update, hmis_profile_new]
        phone_number_update = {
            "id": self.client_profile_1["phoneNumbers"][0]["id"],
            "number": "2125551212",
            "isPrimary": False,
        }
        phone_number_new = {
            "number": "6465551212",
            "isPrimary": True,
        }
        phone_numbers = [phone_number_update, phone_number_new]

        variables = {
            "id": self.client_profile_1["id"],
            "hmisProfiles": hmis_profiles,
            "phoneNumbers": phone_numbers,
        }
        self._update_client_profile_fixture(variables)

        self.assertEqual(client_profile_2.hmis_profiles.count(), 1)
        self.assertEqual(client_profile_2.phone_numbers.count(), 1)

    def test_partial_update_client_profile_mutation(self) -> None:
        # Manually update profile photo because it's created after the client profile fixture.
        self.client_profile_1["profilePhoto"] = {"name": self.client_profile_1_photo_name}

        variables = {
            "id": self.client_profile_1["id"],
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        self.assertEqual(client_profile, self.client_profile_1)

    def test_update_client_profile_email_upper_mutation(self) -> None:
        email_upper = "EMAIL@EXAMPLE.com"
        user_update = {
            "id": self.client_profile_1["user"]["id"],
            "email": email_upper,
        }

        variables = {
            "id": self.client_profile_1["id"],
            "user": user_update,
        }
        response = self._update_client_profile_fixture(variables)

        client_profile = response["data"]["updateClientProfile"]

        self.assertEqual(client_profile["user"]["email"], "email@example.com")

    def test_update_client_profile_duplicate_email_lower_mutation(self) -> None:
        dupe_email_lower = self.client_profile_2["user"]["email"].lower()
        user_update = {
            "id": self.client_profile_1["user"]["id"],
            "email": dupe_email_lower,
        }

        variables = {
            "id": self.client_profile_1["id"],
            "user": user_update,
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(validation_errors["message"], "Validation Errors")
        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["field"], "email")
        self.assertEqual(error_messages[0]["message"], "This email is already in use")

    def test_update_client_profile_duplicate_email_upper_mutation(self) -> None:
        dupe_email_upper = self.client_profile_2["user"]["email"].upper()
        user_update = {
            "id": self.client_profile_1["user"]["id"],
            "email": dupe_email_upper,
        }

        variables = {
            "id": self.client_profile_1["id"],
            "user": user_update,
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(validation_errors["message"], "Validation Errors")
        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["field"], "email")
        self.assertEqual(error_messages[0]["message"], "This email is already in use")

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

        expected_query_count = 8
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

        expected_query_count = 17
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
