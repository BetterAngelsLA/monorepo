from typing import Any
from unittest.mock import ANY, patch

from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentNamespaceEnum,
    ErrorCodeEnum,
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
    VeteranStatusEnum,
)
from clients.models import ClientContact, ClientHouseholdMember, ClientProfile, HmisProfile, SocialMediaProfile
from clients.tests.utils import (
    ClientContactBaseTestCase,
    ClientHouseholdMemberBaseTestCase,
    ClientProfileGraphQLBaseTestCase,
    HmisProfileBaseTestCase,
    SocialMediaProfileBaseTestCase,
)
from common.models import Attachment
from deepdiff import DeepDiff
from unittest_parametrize import parametrize


class ClientProfileMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_client_profile_mutation(self) -> None:
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
            "email": "firsty_lasty@example.com",
            "eyeColor": EyeColorEnum.BROWN.name,
            "firstName": "Firsty",
            "gender": GenderEnum.OTHER.name,
            "genderOther": "genderqueer",
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 71.75,
            "hmisProfiles": [hmis_profile],
            "householdMembers": [household_member],
            "importantNotes": "I am an important note",
            "lastName": "Lasty",
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "mailingAddress": "1234 Mailing Street",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "middleName": "Middly",
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
            "residenceGeolocation": self.residence_geolocation,
            "socialMediaProfiles": social_media_profile,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "unhousedStartDate": "2026-01-01",
            "veteranStatus": VeteranStatusEnum.YES.name,
        }
        response = self._create_client_profile_fixture(variables)
        client_profile = response["data"]["createClientProfile"]

        expected_contacts = [{"id": ANY, "updatedAt": ANY, **contact}]
        expected_hmis_profiles = [{"id": ANY, **hmis_profile}]
        expected_household_members = [{"id": ANY, "displayGender": "Female", **household_member}]
        expected_phone_numbers = [{"id": ANY, **phone_number}]
        expected_social_media_profiles = [{"id": ANY, **social_media_profile}]
        expected_client_profile = {
            **variables,
            "id": ANY,
            "age": self.EXPECTED_CLIENT_AGE,
            "contacts": expected_contacts,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": "Not Assigned",
            "displayGender": "genderqueer",
            "displayPronouns": "She/Her",
            "hmisProfiles": expected_hmis_profiles,
            "householdMembers": expected_household_members,
            "phoneNumbers": expected_phone_numbers,
            "profilePhoto": None,
            "socialMediaProfiles": expected_social_media_profiles,
            "veteranStatus": VeteranStatusEnum.YES.name,
        }
        client_differences = DeepDiff(
            expected_client_profile,
            client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$", r"\['updatedAt'\]$"],
        )

        self.assertFalse(client_differences)

    def test_update_client_profile_mutation(self) -> None:
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
            "email": "firstey_lastey@example.com",
            "eyeColor": EyeColorEnum.GRAY.name,
            "firstName": "Firstey",
            "gender": GenderEnum.FEMALE.name,
            "genderOther": None,
            "hairColor": HairColorEnum.GRAY.name,
            "heightInInches": 71.75,
            "hmisProfiles": hmis_profiles,
            "householdMembers": household_members,
            "importantNotes": "I am a very important note",
            "lastName": "Lastey",
            "livingSituation": LivingSituationEnum.VEHICLE.name,
            "mailingAddress": "1234 Mailing St",
            "maritalStatus": MaritalStatusEnum.SEPARATED.name,
            "middleName": "Middley",
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
            "residenceGeolocation": [-118, 34],
            "socialMediaProfiles": social_media_profiles,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "unhousedStartDate": "2025-01-01",
            "veteranStatus": VeteranStatusEnum.YES.name,
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        # Add display fields to nested objects and update variables
        expected_household_member_update = {"displayGender": "Non-binary", **household_member_update}
        expected_household_member_new = {"displayGender": "pangender", **household_member_new}
        expected_household_members = [expected_household_member_update, expected_household_member_new]
        variables["householdMembers"] = expected_household_members

        expected_client_profile = {
            **variables,
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "displayCaseManager": "Not Assigned",
            "displayGender": "Female",
            "displayPronouns": "she/her/theirs",
            "profilePhoto": {"url": self.client_profile_1_photo_url},
            "veteranStatus": VeteranStatusEnum.YES.name,
        }
        client_differences = DeepDiff(
            expected_client_profile,
            client_profile,
            ignore_order=True,
            exclude_regex_paths=[r"\['id'\]$", r"\['profilePhoto'\]\['url'\]$"],
        )
        self.assertFalse(client_differences)

        # Verify profile photo URL path matches (ignoring presigned query params)
        expected_photo_url = self.client_profile_1_photo_url.split("?")[0]
        actual_photo_url = client_profile["profilePhoto"]["url"].split("?")[0]
        self.assertEqual(expected_photo_url, actual_photo_url)

    def test_client_profile_mutation_validation(self) -> None:
        contact = {
            "phoneNumber": "125551212",
            "relationshipToClient": RelationshipTypeEnum.AUNT.name,
        }
        hmis_profile = {
            "hmisId": " ",
            "agency": self.client_profile_1["hmisProfiles"][0]["agency"],
        }
        phone_number = {
            "number": "125551212",
            "isPrimary": True,
        }

        variables = {
            "id": self.client_profile_2["id"],
            "firstName": "",
            "lastName": "",
            "middleName": "",
            "email": " invalid email",
            "californiaId": "invalid id",
            "contacts": [contact],
            "hmisProfiles": [hmis_profile],
            "nickname": "",
            "phoneNumbers": [phone_number],
        }

        update_response = self._update_client_profile_fixture(variables)
        self.assertEqual(len(update_response["errors"]), 1)

        expected_update_error_messages = [
            {"field": "client_name", "location": None, "errorCode": ErrorCodeEnum.NAME_NOT_PROVIDED.name},
            {"field": "email", "location": None, "errorCode": ErrorCodeEnum.EMAIL_INVALID.name},
            {"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_INVALID.name},
            {
                "field": "contacts",
                "location": "0__phoneNumber",
                "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name,
            },
            {"field": "hmisProfiles", "location": "0__hmisId", "errorCode": ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name},
            {"field": "phoneNumbers", "location": "0__number", "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name},
        ]

        self.assertCountEqual(update_response["errors"][0]["extensions"]["errors"], expected_update_error_messages)

        variables.pop("id")

        variables["californiaId"] = self.client_profile_1["californiaId"]
        variables["email"] = self.client_profile_1["email"]
        variables["hmisProfiles"][0]["hmisId"] = self.client_profile_1["hmisProfiles"][0]["hmisId"].upper()

        create_response = self._create_client_profile_fixture(variables)
        self.assertEqual(len(create_response["errors"]), 1)

        expected_create_error_messages = [
            {"field": "client_name", "location": None, "errorCode": ErrorCodeEnum.NAME_NOT_PROVIDED.name},
            {"field": "email", "location": None, "errorCode": ErrorCodeEnum.EMAIL_IN_USE.name},
            {"field": "californiaId", "location": None, "errorCode": ErrorCodeEnum.CA_ID_IN_USE.name},
            {
                "field": "contacts",
                "location": "0__phoneNumber",
                "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name,
            },
            {"field": "hmisProfiles", "location": "0__hmisId", "errorCode": ErrorCodeEnum.HMIS_ID_IN_USE.name},
            {"field": "phoneNumbers", "location": "0__number", "errorCode": ErrorCodeEnum.PHONE_NUMBER_INVALID.name},
        ]

        self.assertCountEqual(create_response["errors"][0]["extensions"]["errors"], expected_create_error_messages)

    def test_client_profile_mutation_client_name_validation(self) -> None:
        variables = {"nickname": "Mikey"}

        response = self._create_client_profile_fixture(variables)
        self.assertIsNone(response.get("errors"))

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
        self.client_profile_1["profilePhoto"] = {"url": self.client_profile_1_photo_url}

        variables = {"id": self.client_profile_1["id"]}
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        # Presigned URL query params (timestamps/signatures) may differ between requests,
        # so compare the URL path separately then normalize for the full profile comparison.
        expected_photo_url = self.client_profile_1["profilePhoto"]["url"].split("?")[0]
        actual_photo_url = client_profile["profilePhoto"]["url"].split("?")[0]
        self.assertEqual(expected_photo_url, actual_photo_url)

        client_profile["profilePhoto"] = self.client_profile_1["profilePhoto"]
        self.assertEqual(client_profile, self.client_profile_1)

    def test_update_client_profile_email_upper_mutation(self) -> None:
        variables = {
            "id": self.client_profile_1["id"],
            "email": "EMAIL@EXAMPLE.com",
        }
        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]

        self.assertEqual(client_profile["email"], "email@example.com")

    def test_update_client_profile_null_email(self) -> None:
        variables = {
            "id": self.client_profile_1["id"],
            "email": None,
        }

        response = self._update_client_profile_fixture(variables)
        client_profile = response["data"]["updateClientProfile"]
        self.assertEqual(client_profile["email"], None)

    def test_update_client_profile_duplicate_email_lower_mutation(self) -> None:
        dupe_email_lower = self.client_profile_2["email"].lower()
        variables = {
            "id": self.client_profile_1["id"],
            "email": dupe_email_lower,
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(validation_errors["message"], "Validation Errors")
        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["field"], "email")
        self.assertEqual(error_messages[0]["location"], None)
        self.assertEqual(error_messages[0]["errorCode"], ErrorCodeEnum.EMAIL_IN_USE.name)

    def test_update_client_profile_duplicate_email_upper_mutation(self) -> None:
        dupe_email_upper = self.client_profile_2["email"].upper()
        variables = {
            "id": self.client_profile_1["id"],
            "email": dupe_email_upper,
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(validation_errors["message"], "Validation Errors")
        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["field"], "email")
        self.assertEqual(error_messages[0]["location"], None)
        self.assertEqual(error_messages[0]["errorCode"], ErrorCodeEnum.EMAIL_IN_USE.name)

    def test_delete_client_profile_mutation(self) -> None:
        client_profile = self._create_client_profile_fixture({"firstName": "to delete"})["data"]["createClientProfile"]

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
        variables = {"id": client_profile["id"]}

        expected_query_count = 19
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteClientProfile"])
        self.assertFalse(ClientProfile.objects.filter(id=client_profile["id"]).exists())

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

        photo_name = response["data"]["updateClientProfilePhoto"]["profilePhoto"]["url"]
        client_profile = ClientProfile.objects.get(id=client_profile_id)
        self.assertIn(photo_name, client_profile.profile_photo.url)

        response = self._update_client_profile_photo_fixture(
            client_profile_id,
            photo_content,
            photo_name,
        )

        updated_photo_name = response["data"]["updateClientProfilePhoto"]["profilePhoto"]["url"]
        client_profile.refresh_from_db()
        self.assertIn(updated_photo_name, client_profile.profile_photo.url)

    def test_generate_client_profile_photo_upload(self) -> None:
        with patch(
            "clients.services.client_profile_photo.generate_s3_presigned_upload_urls",
            return_value={
                "uploads": [
                    {
                        "ref_id": "photo-ref-1",
                        "key": "media/client_profile_photos/photo.jpg",
                        "url": "https://s3.example.com/upload-photo",
                        "fields": {"Policy": "abc", "X-Amz-Signature": "sig1"},
                    },
                ]
            },
        ), patch(
            "clients.services.client_profile_photo.create_upload_token",
            return_value="photo-token-1",
        ):
            expected_query_count = 5
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._generate_client_profile_photo_upload_fixture(
                    client_profile_id=self.client_profile_1["id"],
                    ref_id="photo-ref-1",
                    filename="photo.jpg",
                    content_type="image/jpeg",
                )

        result = response["data"]["generateClientProfilePhotoUpload"]
        self.assertEqual(result["refId"], "photo-ref-1")
        self.assertEqual(result["url"], "https://s3.example.com/upload-photo")
        self.assertEqual(result["presignedKey"], "media/client_profile_photos/photo.jpg")
        self.assertEqual(result["uploadToken"], "photo-token-1")
        self.assertIn("Policy", result["fields"])

    def test_resolve_client_profile_photo_upload(self) -> None:
        with patch("clients.services.client_profile_photo.validate_upload_token", return_value=True), patch(
            "clients.services.client_profile_photo.s3_key_exists", return_value=True
        ), patch(
            "clients.services.client_profile_photo.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        ):
            expected_query_count = 8
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._resolve_client_profile_photo_upload_fixture(
                    client_profile_id=self.client_profile_1["id"],
                    presigned_key="media/client_profile_photos/photo.jpg",
                    upload_token="valid-photo-token",
                )

        result = response["data"]["resolveClientProfilePhotoUpload"]
        self.assertEqual(result["id"], self.client_profile_1["id"])
        self.assertIsNotNone(result["profilePhoto"])
        self.assertIn("client_profile_photos/photo.jpg", result["profilePhoto"]["url"])

        # Verify database was updated
        client_profile = ClientProfile.objects.get(id=self.client_profile_1["id"])
        self.assertIn("client_profile_photos/photo.jpg", client_profile.profile_photo.name)

    def test_resolve_client_profile_photo_upload_invalid_token(self) -> None:
        with patch("clients.services.client_profile_photo.validate_upload_token", return_value=False):
            expected_query_count = 6
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._resolve_client_profile_photo_upload_fixture(
                    client_profile_id=self.client_profile_1["id"],
                    presigned_key="media/client_profile_photos/photo.jpg",
                    upload_token="bad-token",
                )

        self.assertIsNotNone(response.get("errors"))


class ClientContactMutationTestCase(ClientContactBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_create_client_contact_mutation(self) -> None:
        variables = {
            "clientProfile": self.client_profile_id,
            "email": "client_contact_3@example.com",
            "mailingAddress": "333 Main Street",
            "name": "Sam Smith",
            "phoneNumber": "2125553232x123",
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            client_contact = self._create_client_contact_fixture(variables)["data"]["createClientContact"]

        expected_client_contact = {"id": ANY, "updatedAt": ANY, **variables}
        expected_client_contact.pop("clientProfile")

        self.assertEqual(client_contact, expected_client_contact)

        client_client_contacts = ClientProfile.objects.filter(id=self.client_profile_id).values_list(
            "contacts", flat=True
        )
        self.assertIn(int(client_contact["id"]), client_client_contacts)

    def test_update_client_contact_mutation(self) -> None:
        variables = {
            "id": self.client_contact_1["id"],
            "email": "client_contact_1_update@example.com",
            "mailingAddress": "111 Main Street Update",
            "name": "Jane Smith Update",
            "phoneNumber": "2125552121x321",
            "relationshipToClient": RelationshipTypeEnum.PAST_CASE_MANAGER.name,
            "relationshipToClientOther": None,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            client_contact = self._update_client_contact_fixture(variables)["data"]["updateClientContact"]

        expected_client_contact = {"updatedAt": ANY, **variables}

        self.assertEqual(expected_client_contact, client_contact)

    def test_delete_client_contact_mutation(self) -> None:
        variables = {"object": "ClientContact", "object_id": self.client_contact_1["id"]}

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._delete_fixture(**variables)

        self.assertNotIn("messages", response["data"]["deleteClientContact"])
        self.assertFalse(ClientContact.objects.filter(id=self.client_contact_1["id"]).exists())

    @parametrize(
        ("phone_number", "should_succeed", "expected_phone_number"),
        [
            (None, True, None),
            ("", True, None),
            (" ", True, None),
            ("a", False, None),
            ("212555121", False, None),
            (" 2125552121 ", True, "2125552121"),
        ],
    )
    def test_update_client_contact_mutation_validation(
        self,
        phone_number: str | None,
        should_succeed: bool,
        expected_phone_number: str | None,
    ) -> None:
        original_phone_number = ClientContact.objects.get(id=self.client_contact_1["id"]).phone_number

        variables = {
            "id": self.client_contact_1["id"],
            "phoneNumber": phone_number,
        }
        response = self._update_client_contact_fixture(variables)

        updated_phone_number = ClientContact.objects.get(id=self.client_contact_1["id"]).phone_number

        if should_succeed:
            self.assertEqual(response["data"]["updateClientContact"]["phoneNumber"], expected_phone_number)
            self.assertEqual(expected_phone_number, updated_phone_number)
        else:
            self.assertEqual(len(response["data"]["updateClientContact"]["messages"]), 1)
            self.assertEqual(
                response["data"]["updateClientContact"]["messages"][0],
                {
                    "kind": "VALIDATION",
                    "field": "phoneNumber",
                    "message": "The phone number entered is not valid.",
                },
            )
            self.assertEqual(original_phone_number, updated_phone_number)


class ClientHouseholdMemberMutationTestCase(ClientHouseholdMemberBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_create_client_household_member_mutation(self) -> None:
        variables = {
            "clientProfile": self.client_profile_id,
            "name": "Sam Smith",
            "dateOfBirth": "2003-03-03",
            "gender": GenderEnum.FEMALE.name,
            "genderOther": None,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            client_household_member = self._create_client_household_member_fixture(variables)["data"][
                "createClientHouseholdMember"
            ]

        expected_client_household_member = {"id": ANY, "displayGender": "Female", **variables}
        expected_client_household_member.pop("clientProfile")

        self.assertEqual(client_household_member, expected_client_household_member)

        client_client_household_members = ClientProfile.objects.filter(id=self.client_profile_id).values_list(
            "household_members", flat=True
        )
        self.assertIn(int(client_household_member["id"]), client_client_household_members)

    def test_update_client_household_member_mutation(self) -> None:
        variables = {
            "id": self.client_household_member_1["id"],
            "name": "Joey Doe",
            "dateOfBirth": "2004-04-04",
            "gender": GenderEnum.OTHER.name,
            "genderOther": "gender queer",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "fren",
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            client_household_member = self._update_client_household_member_fixture(variables)["data"][
                "updateClientHouseholdMember"
            ]

        expected_client_household_member = {**variables, "displayGender": "gender queer"}

        self.assertEqual(expected_client_household_member, client_household_member)

    def test_delete_client_household_member_mutation(self) -> None:
        variables = {"object": "ClientHouseholdMember", "object_id": self.client_household_member_1["id"]}

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._delete_fixture(**variables)

        self.assertNotIn("messages", response["data"]["deleteClientHouseholdMember"])
        self.assertFalse(ClientHouseholdMember.objects.filter(id=self.client_household_member_1["id"]).exists())


class HmisProfileMutationTestCase(HmisProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_create_hmis_profile_mutation(self) -> None:
        variables = {
            "hmisId": "new hmis id",
            "agency": HmisAgencyEnum.LAHSA.name,
            "clientProfile": self.client_profile_id,
        }

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            hmis_profile = self._create_hmis_profile_fixture(variables)["data"]["createHmisProfile"]

        expected_hmis_profile = {**variables, "id": ANY}
        expected_hmis_profile.pop("clientProfile")
        self.assertEqual(hmis_profile, expected_hmis_profile)

        client_hmis_profiles = ClientProfile.objects.filter(id=self.client_profile_id).values_list(
            "hmis_profiles", flat=True
        )
        self.assertIn(int(hmis_profile["id"]), client_hmis_profiles)

    def test_update_hmis_profile_mutation(self) -> None:
        variables = {
            "id": self.hmis_profile_1["id"],
            "hmisId": "hmis id 1 updated",
            "agency": HmisAgencyEnum.PASADENA.name,
        }

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            hmis_profile = self._update_hmis_profile_fixture(variables)["data"]["updateHmisProfile"]

        self.assertEqual(variables, hmis_profile)

    def test_delete_hmis_profile_mutation(self) -> None:
        variables = {"object": "HmisProfile", "object_id": self.hmis_profile_1["id"]}

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._delete_fixture(**variables)

        self.assertNotIn("messages", response["data"]["deleteHmisProfile"])
        self.assertFalse(HmisProfile.objects.filter(id=self.hmis_profile_1["id"]).exists())

    @parametrize(
        ("hmis_id", "expected_error_message", "expected_query_count"),
        [
            ("hmis id 1", None, 12),
            (" ", "This field cannot be null.", 11),
            ("", "This field cannot be null.", 11),
            ("hmis id 2", "Constraint “unique_hmis_id_agency” is violated.", 12),
            (None, "This field cannot be null.", 11),
        ],
    )
    def test_update_hmis_profile_mutation_validation(
        self, hmis_id: str | None, expected_error_message: str, expected_query_count: int
    ) -> None:
        variables = {
            "id": self.hmis_profile_1["id"],
            "hmisId": hmis_id,
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_hmis_profile_fixture(variables)["data"]["updateHmisProfile"]

        if expected_error_message:
            self.assertEqual(len(response["messages"]), 1)
            self.assertEqual(response["messages"][0]["message"], expected_error_message)
        else:
            self.assertEqual(response, variables)


class SocialMediaProfileMutationTestCase(SocialMediaProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_create_social_media_profile_mutation(self) -> None:
        variables = {
            "platformUserId": "new social media id",
            "platform": SocialMediaEnum.TWITTER.name,
            "clientProfile": self.client_profile_id,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            social_media_profile = self._create_social_media_profile_fixture(variables)["data"][
                "createSocialMediaProfile"
            ]

        expected_social_media_profile = {**variables, "id": ANY}
        expected_social_media_profile.pop("clientProfile")
        self.assertEqual(social_media_profile, expected_social_media_profile)

        client_social_media_profiles = ClientProfile.objects.filter(id=self.client_profile_id).values_list(
            "social_media_profiles", flat=True
        )
        self.assertIn(int(social_media_profile["id"]), client_social_media_profiles)

    def test_update_social_media_profile_mutation(self) -> None:
        variables = {
            "id": self.social_media_profile_1["id"],
            "platformUserId": "social media id 1 updated",
            "platform": SocialMediaEnum.WHATSAPP.name,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            social_media_profile = self._update_social_media_profile_fixture(variables)["data"][
                "updateSocialMediaProfile"
            ]

        self.assertEqual(variables, social_media_profile)

    def test_delete_social_media_profile_mutation(self) -> None:
        variables = {"object": "SocialMediaProfile", "object_id": self.social_media_profile_1["id"]}

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._delete_fixture(**variables)

        self.assertNotIn("messages", response["data"]["deleteSocialMediaProfile"])
        self.assertFalse(SocialMediaProfile.objects.filter(id=self.social_media_profile_1["id"]).exists())

    @parametrize(
        ("platform_user_id", "expected_error_message"),
        [
            (" ", "This field cannot be null."),
            (None, "This field cannot be null."),
        ],
    )
    def test_update_social_media_profile_mutation_validation(
        self, platform_user_id: str | None, expected_error_message: str
    ) -> None:
        variables = {
            "id": self.social_media_profile_1["id"],
            "platformUserId": platform_user_id,
            "platform": SocialMediaEnum.FACEBOOK.name,
        }

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_social_media_profile_fixture(variables)["data"]["updateSocialMediaProfile"]

        if expected_error_message:
            self.assertEqual(len(response["messages"]), 1)
            self.assertEqual(response["messages"][0]["message"], expected_error_message)
        else:
            self.assertEqual(response, variables)


class ClientDocumentMutationTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self._setup_client_documents()

    def test_create_client_document(self) -> None:
        file_content = b"Test file content"
        file_name = "test file name.txt"

        expected_query_count = 22
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
        self.assertEqual(
            Attachment.objects.get(id=client_document_id).original_filename,
            file_name,
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

    def test_update_client_document(self) -> None:
        """Test successful update of a client document's filename."""

        self._handle_user_login("org_1_case_manager_1")

        new_filename = "updated_document_name.txt"
        document_id = self.client_profile_1_document_1["id"]

        variables = {
            "id": document_id,
            "originalFilename": new_filename,
        }
        response = self._update_client_document_fixture(variables)

        self.assertEqual(response["data"]["updateClientDocument"]["originalFilename"], new_filename)

        # Verify database was updated
        document = Attachment.objects.get(id=document_id)
        self.assertEqual(document.original_filename, new_filename)

    def test_generate_client_document_uploads(self) -> None:
        uploads = [
            {"refId": "ref-1", "filename": "doc1.pdf", "contentType": "application/pdf"},
            {"refId": "ref-2", "filename": "doc2.jpg", "contentType": "image/jpeg"},
        ]

        with patch(
            "clients.services.client_document.generate_s3_presigned_upload_urls",
            return_value={
                "uploads": [
                    {
                        "ref_id": "ref-1",
                        "key": "media/attachments/doc1.pdf",
                        "url": "https://s3.example.com/upload1",
                        "fields": {"Policy": "abc", "X-Amz-Signature": "sig1"},
                    },
                    {
                        "ref_id": "ref-2",
                        "key": "media/attachments/doc2.jpg",
                        "url": "https://s3.example.com/upload2",
                        "fields": {"Policy": "def", "X-Amz-Signature": "sig2"},
                    },
                ]
            },
        ), patch("clients.services.client_document.create_upload_token", side_effect=["token-1", "token-2"]):
            expected_query_count = 5
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._generate_client_document_uploads_fixture(
                    self.client_profile_1["id"],
                    uploads,
                )

        result_uploads = response["data"]["generateClientDocumentUploads"]["uploads"]
        self.assertEqual(len(result_uploads), 2)

        self.assertEqual(result_uploads[0]["refId"], "ref-1")
        self.assertEqual(result_uploads[0]["url"], "https://s3.example.com/upload1")
        self.assertEqual(result_uploads[0]["presignedKey"], "media/attachments/doc1.pdf")
        self.assertEqual(result_uploads[0]["uploadToken"], "token-1")
        self.assertIn("Policy", result_uploads[0]["fields"])

        self.assertEqual(result_uploads[1]["refId"], "ref-2")
        self.assertEqual(result_uploads[1]["url"], "https://s3.example.com/upload2")
        self.assertEqual(result_uploads[1]["presignedKey"], "media/attachments/doc2.jpg")
        self.assertEqual(result_uploads[1]["uploadToken"], "token-2")

    def test_resolve_client_document_uploads(self) -> None:
        documents = [
            {
                "presignedKey": "media/attachments/doc1.pdf",
                "uploadToken": "valid-token-1",
                "filename": "doc1.pdf",
                "contentType": "application/pdf",
                "namespace": ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
            },
            {
                "presignedKey": "media/attachments/doc2.jpg",
                "uploadToken": "valid-token-2",
                "filename": "doc2.jpg",
                "contentType": "image/jpeg",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
        ]

        with patch("clients.services.client_document.validate_upload_token", return_value=True), patch(
            "clients.services.client_document.s3_key_exists", return_value=True
        ), patch(
            "clients.services.client_document.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        ):
            expected_query_count = 35
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._resolve_client_document_uploads_fixture(
                    self.client_profile_1["id"],
                    documents,
                )

        result_docs = response["data"]["resolveClientDocumentUploads"]["documents"]
        self.assertEqual(len(result_docs), 2)

        self.assertEqual(result_docs[0]["originalFilename"], "doc1.pdf")
        self.assertEqual(result_docs[0]["mimeType"], "application/pdf")
        self.assertEqual(result_docs[0]["namespace"], ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name)
        self.assertIsNotNone(result_docs[0]["id"])

        self.assertEqual(result_docs[1]["originalFilename"], "doc2.jpg")
        self.assertEqual(result_docs[1]["mimeType"], "image/jpeg")
        self.assertEqual(result_docs[1]["namespace"], ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name)
        self.assertIsNotNone(result_docs[1]["id"])

        # Verify documents were created in the database
        for doc in result_docs:
            attachment = Attachment.objects.get(id=doc["id"])
            self.assertEqual(attachment.object_id, int(self.client_profile_1["id"]))

    def test_resolve_client_document_uploads_invalid_token(self) -> None:
        documents = [
            {
                "presignedKey": "media/attachments/doc1.pdf",
                "uploadToken": "bad-token",
                "filename": "doc1.pdf",
                "contentType": "application/pdf",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
        ]

        with patch("clients.services.client_document.validate_upload_token", return_value=False):
            expected_query_count = 9
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self._resolve_client_document_uploads_fixture(
                    self.client_profile_1["id"],
                    documents,
                )

        self.assertGraphQLError(
            response,
            "Invalid or expired upload signature for 'doc1.pdf'",
        )

    def test_resolve_client_document_uploads_batch_validation_failure_creates_no_records(self) -> None:
        """When the 2nd doc has an invalid token, upfront validation fails
        and transaction.atomic() ensures no attachments are persisted."""
        initial_count = Attachment.objects.count()
        documents = [
            {
                "presignedKey": "media/attachments/doc1.pdf",
                "uploadToken": "valid-token-1",
                "filename": "doc1.pdf",
                "contentType": "application/pdf",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
            {
                "presignedKey": "media/attachments/doc2.jpg",
                "uploadToken": "bad-token",
                "filename": "doc2.jpg",
                "contentType": "image/jpeg",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
        ]

        with patch("clients.services.client_document.validate_upload_token", side_effect=[True, False]), patch(
            "clients.services.client_document.s3_key_exists", return_value=True
        ):
            response = self._resolve_client_document_uploads_fixture(
                self.client_profile_1["id"],
                documents,
            )

        self.assertGraphQLError(response, "Invalid or expired upload signature for 'doc2.jpg'")
        self.assertEqual(Attachment.objects.count(), initial_count)

    def test_resolve_client_document_uploads_save_error_rolls_back_all(self) -> None:
        """When all validation passes but the 2nd attachment.save() fails,
        transaction.atomic() rolls back the 1st attachment too."""
        initial_count = Attachment.objects.count()
        documents = [
            {
                "presignedKey": "media/attachments/doc1.pdf",
                "uploadToken": "valid-token-1",
                "filename": "doc1.pdf",
                "contentType": "application/pdf",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
            {
                "presignedKey": "media/attachments/doc2.jpg",
                "uploadToken": "valid-token-2",
                "filename": "doc2.jpg",
                "contentType": "image/jpeg",
                "namespace": ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            },
        ]

        original_save = Attachment.save
        call_count = 0

        def save_side_effect(self_attachment: Attachment, *args: Any, **kwargs: Any) -> None:
            nonlocal call_count
            call_count += 1
            if call_count == 2:
                raise RuntimeError("Simulated DB error on second save")
            original_save(self_attachment, *args, **kwargs)

        with patch("clients.services.client_document.validate_upload_token", return_value=True), patch(
            "clients.services.client_document.s3_key_exists", return_value=True
        ), patch.object(Attachment, "save", save_side_effect):
            response = self._resolve_client_document_uploads_fixture(
                self.client_profile_1["id"],
                documents,
            )

        self.assertGraphQLError(response, "Simulated DB error on second save")
        # transaction.atomic() in the mutation rolls back both saves
        self.assertEqual(Attachment.objects.count(), initial_count)
