import datetime
from unittest.mock import ANY, patch

from clients.enums import (
    AdaAccommodationEnum,
    EyeColorEnum,
    HairColorEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
)
from common.models import PhoneNumber
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.test import TestCase, override_settings
from hmis.enums import (
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisSuffixEnum,
    HmisVeteranStatusEnum,
)
from hmis.models import HmisClientProfile, HmisNote
from hmis.tests.utils import HmisClientProfileBaseTestCase, HmisNoteBaseTestCase
from model_bakery import baker
from test_utils.vcr_config import scrubbed_vcr

LOGIN_MUTATION = """
    mutation ($email: String!, $password: String!) {
        hmisLogin(email: $email, password: $password) {
            __typename
            ... on UserType { id isHmisUser }
            ... on HmisLoginError { message field }
        }
    }
"""


@override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
class HmisNoteMutationTests(HmisNoteBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.hmis_client_profile = baker.make(HmisClientProfile, hmis_id="388")

    @scrubbed_vcr.use_cassette("test_create_hmis_note_mutation.yaml")
    def test_create_hmis_note_mutation(self) -> None:
        variables = {
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "clientHmisId": "388",
            "title": "pitle",
            "note": "pote",
            "date": "2010-10-10",
        }
        response = self._create_hmis_note_fixture(variables)
        note = response["data"]["createHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "471",
            "clientHmisId": "388",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "pitle",
            "note": "pote",
            "date": "2010-10-10",
            "addedDate": "2025-11-12T23:58:27",
            "lastUpdated": "2025-11-12T23:58:27",
            "refClientProgram": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    @scrubbed_vcr.use_cassette("test_create_hmis_program_note_mutation.yaml")
    def test_create_hmis_program_note_mutation(self) -> None:
        variables = {
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "clientHmisId": "388",
            "title": "prog note title",
            "note": "prog note note",
            "date": "2011-11-11",
            "refClientProgram": "525",
        }
        response = self._create_hmis_note_fixture(variables)
        note = response["data"]["createHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "480",
            "clientHmisId": "388",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "prog note title",
            "note": "prog note note",
            "date": "2011-11-11",
            "addedDate": "2025-11-13T00:35:34",
            "lastUpdated": "2025-11-13T00:35:34",
            "refClientProgram": "525",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    @scrubbed_vcr.use_cassette("test_update_hmis_note_mutation.yaml")
    def test_update_hmis_note_mutation(self) -> None:
        hmis_note = baker.make(
            HmisNote,
            hmis_id="479",
            client_hmis_id="388",
            hmis_client_profile_id=self.hmis_client_profile.pk,
            title="prog note title",
            note="prog note note",
            date="2011-11-11",
            created_by=self.org_1_case_manager_1,
        )

        variables = {
            "id": str(hmis_note.pk),
            "hmisId": "479",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "clientHmisId": "388",
            "title": "updated note title",
            "note": "updated note note",
            "date": "2012-12-12",
            "refClientProgram": "525",
        }
        response = self._update_hmis_note_fixture(variables)
        note = response["data"]["updateHmisNote"]

        expected = {
            "id": ANY,
            "hmisId": "479",
            "clientHmisId": "388",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "updated note title",
            "note": "updated note note",
            "date": "2012-12-12",
            "addedDate": "2025-11-13T00:34:40",
            "lastUpdated": "2025-11-13T00:58:42",
            "refClientProgram": "525",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
        }

        self.assertEqual(expected, note)

    def test_create_hmis_note_mutation_client_id_mismatch(self) -> None:
        variables = {
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "clientHmisId": "389",
            "title": "title",
            "note": "note",
            "date": "2025-11-13",
        }
        response = self._create_hmis_note_fixture(variables)
        messages = response["data"]["createHmisNote"]["messages"]

        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0],
            {
                "kind": "VALIDATION",
                "field": None,
                "message": "Client ID mismatch",
            },
        )

    def test_update_hmis_note_mutation_client_id_mismatch(self) -> None:
        hmis_note = baker.make(
            HmisNote,
            hmis_id="480",
            client_hmis_id="388",
            hmis_client_profile_id=self.hmis_client_profile.pk,
            title="prog note title",
            note="prog note note",
            date="2011-11-11",
            created_by=self.org_1_case_manager_1,
        )

        variables = {
            "id": str(hmis_note.pk),
            "hmisId": "480",
            "clientHmisId": "389",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "title",
            "note": "note",
            "date": "2025-11-13",
        }
        response = self._update_hmis_note_fixture(variables)
        messages = response["data"]["updateHmisNote"]["messages"]

        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0],
            {
                "kind": "VALIDATION",
                "field": None,
                "message": "Client ID mismatch",
            },
        )

    def test_update_hmis_note_mutation_note_id_mismatch(self) -> None:
        hmis_note = baker.make(
            HmisNote,
            hmis_id="480",
            client_hmis_id="388",
            hmis_client_profile_id=self.hmis_client_profile.pk,
            title="prog note title",
            note="prog note note",
            date="2011-11-11",
            created_by=self.org_1_case_manager_1,
        )

        variables = {
            "id": str(hmis_note.pk),
            "hmisId": "481",
            "clientHmisId": "389",
            "hmisClientProfileId": str(self.hmis_client_profile.pk),
            "title": "title",
            "note": "note",
            "date": "2025-11-13",
        }
        response = self._update_hmis_note_fixture(variables)
        messages = response["data"]["updateHmisNote"]["messages"]

        self.assertEqual(len(messages), 1)
        self.assertEqual(
            messages[0],
            {
                "kind": "VALIDATION",
                "field": None,
                "message": "Note ID mismatch",
            },
        )


@override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
class HmisClientProfileMutationTests(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.residence_geolocation = [-118.2437207, 34.0521723]

        self.hmis_client_profile = baker.make(
            HmisClientProfile,
            # ID & Metadata Fields
            hmis_id=self._get_random_id(),
            added_date=datetime.datetime.strptime("2025-08-06 13:43:43", "%Y-%m-%d %H:%M:%S"),
            last_updated=datetime.datetime.strptime("2025-11-06 11:14:54", "%Y-%m-%d %H:%M:%S"),
            # Client Fields
            alias=None,
            birth_date=datetime.date.fromisoformat("2001-01-01"),
            dob_quality=HmisDobQualityEnum.FULL,
            first_name="John",
            last_name="Smith",
            name_quality=HmisNameQualityEnum.FULL,
            ssn1="***",
            ssn2="**",
            ssn3="4321",
            ssn_quality=HmisSsnQualityEnum.FULL,
            # Client Sub Fields
            age=24,
            gender=[HmisGenderEnum.WOMAN_GIRL, HmisGenderEnum.DIFFERENT],
            gender_identity_text="Gen Id",
            name_middle="B",
            name_suffix=HmisSuffixEnum.JR,
            race_ethnicity=[HmisRaceEnum.INDIGENOUS, HmisRaceEnum.ASIAN],
            additional_race_ethnicity_detail="AddlRace",
            veteran=HmisVeteranStatusEnum.YES,
            # BA Fields
            ada_accommodation=[AdaAccommodationEnum.HEARING, AdaAccommodationEnum.MOBILITY],
            address="123 Main St",
            california_id="A1357246",
            email="jbs@example.com",
            eye_color=EyeColorEnum.BLUE,
            hair_color=HairColorEnum.BLACK,
            height_in_inches=72,
            important_notes="important notes",
            living_situation=LivingSituationEnum.OPEN_AIR,
            mailing_address="123 Mail St",
            marital_status=MaritalStatusEnum.DIVORCED,
            physical_description="physdesc",
            place_of_birth="Los Angeles",
            preferred_communication=[PreferredCommunicationEnum.CALL],
            preferred_language=LanguageEnum.ARABIC,
            pronouns=PronounEnum.OTHER,
            pronouns_other="pronouns",
            residence_address="123 Res St",
            residence_geolocation=Point(self.residence_geolocation),
            spoken_languages=[LanguageEnum.ENGLISH, LanguageEnum.SPANISH],
            created_by=self.org_1_case_manager_1,
        )
        content_type = ContentType.objects.get_for_model(HmisClientProfile)
        PhoneNumber.objects.create(
            content_type=content_type,
            object_id=self.hmis_client_profile.pk,
            number="2125551212",
            is_primary=True,
        )

    @scrubbed_vcr.use_cassette("test_create_hmis_client_profile_mutation_minimal.yaml")
    def test_create_hmis_client_profile_mutation_minimal(self) -> None:
        variables = {
            "firstName": "Edgar",
            "lastName": "Poe",
            "nameQuality": HmisNameQualityEnum.FULL.name,
        }
        response = self._create_hmis_client_profile_fixture(variables)
        client = response["data"]["createHmisClientProfile"]

        expected = {
            # ID & Metadata Fields
            "hmisId": ANY,
            "uniqueIdentifier": ANY,
            "personalId": None,
            "addedDate": ANY,
            "lastUpdated": ANY,
            # Client Fields
            "alias": None,
            "birthDate": None,
            "dobQuality": HmisDobQualityEnum.NOT_COLLECTED.name,
            "firstName": "Edgar",
            "lastName": "Poe",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
            # Client Sub Fields
            "age": 0,
            "gender": [HmisGenderEnum.NOT_COLLECTED.name],
            "genderIdentityText": None,
            "nameMiddle": None,
            "nameSuffix": None,
            "raceEthnicity": [HmisRaceEnum.NOT_COLLECTED.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NOT_COLLECTED.name,
            # BA Fields
            "adaAccommodation": None,
            "address": None,
            "californiaId": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": None,
            "eyeColor": None,
            "hairColor": None,
            "heightInInches": None,
            "importantNotes": None,
            "livingSituation": None,
            "mailingAddress": None,
            "maritalStatus": None,
            "phoneNumbers": [],
            "physicalDescription": None,
            "placeOfBirth": None,
            "preferredCommunication": None,
            "preferredLanguage": None,
            "profilePhoto": None,
            "pronouns": None,
            "pronounsOther": None,
            "residenceAddress": None,
            "residenceGeolocation": None,
            "spokenLanguages": None,
        }

        self.assertEqual(expected, client)

    @scrubbed_vcr.use_cassette("test_update_hmis_client_profile_mutation.yaml")
    def test_update_hmis_client_profile_mutation(self) -> None:
        hmis_client_profile = baker.make(
            HmisClientProfile,
            # ID Fields
            hmis_id="384",
            unique_identifier="9AD65C3CF",
            # Client Fields
            dob_quality=HmisDobQualityEnum.NOT_COLLECTED,
            first_name="Edgar",
            last_name="Poe",
            name_quality=HmisNameQualityEnum.FULL,
            ssn3="xxxx",
            ssn_quality=HmisSsnQualityEnum.NOT_COLLECTED,
            # Client Sub Fields
            gender=[HmisGenderEnum.NOT_COLLECTED],
            race_ethnicity=[HmisRaceEnum.NOT_COLLECTED],
            veteran=HmisVeteranStatusEnum.NOT_COLLECTED,
            created_by=self.org_1_case_manager_1,
        )

        variables = {
            "hmisId": str(hmis_client_profile.hmis_id),
            #
            "alias": "the raven",
            "birthDate": datetime.date.fromisoformat("1909-01-19"),
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "Eddie",
            "lastName": "Po",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "13",
            "ssn2": "57",
            "ssn3": "9246",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            #
            "gender": [HmisGenderEnum.MAN_BOY.name],
            "genderIdentityText": "genid",
            "nameMiddle": "Allen",
            "nameSuffix": HmisSuffixEnum.FIRST.name,
            "raceEthnicity": [HmisRaceEnum.WHITE.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NO.name,
            #
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
            "address": "3 Amity St.",
            "californiaId": "R0192837",
            "email": "ed@example.com",
            "eyeColor": EyeColorEnum.BROWN.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 68.0,
            "importantNotes": "spooky",
            "livingSituation": LivingSituationEnum.HOUSING.name,
            "mailingAddress": "3 Amity Mail St.",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "phoneNumbers": [{"number": "6175551212", "isPrimary": True}],
            "physicalDescription": "tall",
            "placeOfBirth": "Boston",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "residenceAddress": "3 Amity Res St.",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name],
        }
        response = self._update_hmis_client_profile_fixture(variables)
        client = response["data"]["updateHmisClientProfile"]

        expected = {
            "hmisId": ANY,
            "uniqueIdentifier": ANY,
            "personalId": ANY,
            "addedDate": ANY,
            "lastUpdated": ANY,
            #
            "alias": "the raven",
            "birthDate": "1909-01-19",
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "Eddie",
            "lastName": "Po",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "9246",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            #
            "age": 116,
            "gender": [HmisGenderEnum.MAN_BOY.name],
            "genderIdentityText": "genid",
            "nameMiddle": "Allen",
            "nameSuffix": HmisSuffixEnum.FIRST.name,
            "raceEthnicity": [HmisRaceEnum.WHITE.name],
            "additionalRaceEthnicityDetail": None,
            "veteran": HmisVeteranStatusEnum.NO.name,
            #
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
            "address": "3 Amity St.",
            "californiaId": "R0192837",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": "ed@example.com",
            "eyeColor": EyeColorEnum.BROWN.name,
            "hairColor": HairColorEnum.BROWN.name,
            "heightInInches": 68.0,
            "importantNotes": "spooky",
            "livingSituation": LivingSituationEnum.HOUSING.name,
            "mailingAddress": "3 Amity Mail St.",
            "maritalStatus": MaritalStatusEnum.SINGLE.name,
            "phoneNumbers": [{"id": ANY, "number": "6175551212", "isPrimary": True}],
            "physicalDescription": "tall",
            "placeOfBirth": "Boston",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.HE_HIM_HIS.name,
            "pronounsOther": None,
            "residenceAddress": "3 Amity Res St.",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name],
        }

        self.assertEqual(expected, client)


@override_settings(AUTHENTICATION_BACKENDS=["django.contrib.auth.backends.ModelBackend"])
class HmisLoginMutationTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.existing_user = baker.make(get_user_model(), _fill_optional=["email"])

        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY3Mjc2NjAyOCwiZXhwIjoxNjc0NDk0MDI4fQ.kCak9sLJr74frSRVQp0_27BY4iBCgQSmoT3vQVWKzJg"
        self.success_response = {"data": {"createAuthToken": {"authToken": token}}}

    @override_settings(HMIS_TOKEN_KEY="LeUjRutbzg_txpcdszNmKbpX8rFiMWLnpJtPbF2nsS0=")
    def test_hmis_login_success(self) -> None:
        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=self.success_response,
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "anything"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "UserType")
        self.assertEqual(payload["id"], str(self.existing_user.pk))
        self.assertEqual(payload["isHmisUser"], True)

        # Session should now contain the logged-in user
        session = self.graphql_client.session
        self.assertIn("_auth_user_id", session)
        self.assertEqual(session["_auth_user_id"], str(self.existing_user.pk))
        self.assertEqual(
            session.get("_auth_user_backend"),
            "django.contrib.auth.backends.ModelBackend",
        )

    def test_hmis_login_invalid_credentials(self) -> None:
        return_value = {
            "data": {"createAuthToken": {"authToken": None}},
            "errors": [
                {
                    "path": ["createAuthToken"],
                    "data": None,
                    "errorType": "422",
                    "errorInfo": None,
                    "locations": [{"line": 5, "column": 5, "sourceName": None}],
                    "message": '{"name":"Unprocessable entity","message":"{\\"username\\":[\\"Incorrect username or password.\\"]}","code":0,"status":422,"messages":{"username":["Incorrect username or password."]}}',
                }
            ],
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "wrong"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginError")
        self.assertIn("Invalid credentials", payload["message"])

    def test_hmis_login_unknown_email_no_autocreate(self) -> None:
        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=self.success_response,
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": "nonexistent_user@example.org", "password": "pw"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginError")
        self.assertIn("Invalid credentials or HMIS login failed", payload["message"])
