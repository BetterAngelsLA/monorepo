import datetime
from unittest import skip
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
from hmis.models import HmisClientProfile
from hmis.tests.utils import HmisClientProfileBaseTestCase
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

CREATE_CLIENT_MUTATION = """
    mutation hmisCreateClient(
        $clientInput: HmisCreateClientInput!,
        $clientSubItemsInput: HmisCreateClientSubItemsInput!
    ) {
        hmisCreateClient(
            clientInput: $clientInput,
            clientSubItemsInput: $clientSubItemsInput,
        ) {
            ... on HmisClientType {
                personalId
                uniqueIdentifier
                firstName
                lastName
                nameDataQuality
                ssn1
                ssn2
                ssn3
                ssnDataQuality
                dob
                dobDataQuality
                data {
                    middleName
                    nameSuffix
                    alias
                    raceEthnicity
                    additionalRaceEthnicity
                    differentIdentityText
                    gender
                    veteranStatus
                }
            }
            ... on HmisCreateClientError { message field }
        }
    }
"""

UPDATE_CLIENT_MUTATION = """
    mutation hmisUpdateClient(
        $clientInput: HmisUpdateClientInput!,
        $clientSubItemsInput: HmisUpdateClientSubItemsInput!
    ) {
        hmisUpdateClient(
            clientInput: $clientInput,
            clientSubItemsInput: $clientSubItemsInput,
        ) {
            ... on HmisClientType {
                personalId
                uniqueIdentifier
                firstName
                lastName
                nameDataQuality
                ssn1
                ssn2
                ssn3
                ssnDataQuality
                dob
                dobDataQuality
                data {
                    middleName
                    nameSuffix
                    alias
                    raceEthnicity
                    additionalRaceEthnicity
                    differentIdentityText
                    gender
                    veteranStatus
                }
            }
            ... on HmisUpdateClientError { message field }
        }
    }
"""

CREATE_CLIENT_NOTE_MUTATION = """
    mutation hmisCreateClientNote($clientNoteInput: HmisCreateClientNoteInput!) {
        hmisCreateClientNote(clientNoteInput: $clientNoteInput) {
            ... on HmisClientNoteType {
                id
                title
                note
                date
                category
                client { personalId }
                enrollment { enrollmentId }
            }
            ... on HmisCreateClientNoteError {
                message
                field
            }
        }
    }
"""

UPDATE_CLIENT_NOTE_MUTATION = """
    mutation hmisUpdateClientNote($clientNoteInput: HmisUpdateClientNoteInput!) {
        hmisUpdateClientNote(clientNoteInput: $clientNoteInput) {
            ... on HmisClientNoteType {
                id
                title
                note
                date
                category
                client { personalId }
                enrollment { enrollmentId }
            }
            ... on HmisUpdateClientNoteError {
                message
                field
            }
        }
    }
"""


class HmisClientProfileQueryTests(HmisClientProfileBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.residence_geolocation = [-118.2437207, 34.0521723]

        self.hmis_client_profile = HmisClientProfile.objects.create(
            # ID & Metadata Fields
            hmis_id="1",
            personal_id="7e401eed7ee14c36a7641ef44626695c",
            unique_identifier="69E44770D",
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

    @override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
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

    @override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
    @scrubbed_vcr.use_cassette("test_update_hmis_client_profile_mutation.yaml")
    def test_update_hmis_client_profile_mutation(self) -> None:
        hmis_client_profile = HmisClientProfile.objects.create(
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


class HmisCreateClientMutationTests(GraphQLBaseTestCase, TestCase):
    def test_hmis_create_client_success(self) -> None:
        return_value = {
            "data": {
                "createClient": {
                    "personalId": "1",
                    "uniqueIdentifier": "123AB456C",
                    "firstName": "Firsty",
                    "lastName": "Lasty",
                    "nameDataQuality": 1,
                    "ssn1": "***",
                    "ssn2": "**",
                    "ssn3": "xxxx",
                    "ssnDataQuality": 99,
                    "dob": None,
                    "dobDataQuality": 99,
                    "data": {
                        "middleName": None,
                        "nameSuffix": 9,
                        "alias": None,
                        "raceEthnicity": [99],
                        "additionalRaceEthnicity": None,
                        "differentIdentityText": None,
                        "gender": [99],
                        "veteranStatus": 99,
                    },
                }
            }
        }

        client_input = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnDataQuality": 99,
            "dob": None,
            "dobDataQuality": 99,
        }
        client_sub_items_input = {
            "middleName": None,
            "nameSuffix": 9,
            "alias": None,
            "additionalRaceEthnicity": None,
            "differentIdentityText": None,
            "raceEthnicity": [99],
            "gender": [99],
            "veteranStatus": 99,
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                CREATE_CLIENT_MUTATION,
                variables={
                    "clientInput": client_input,
                    "clientSubItemsInput": client_sub_items_input,
                },
            )

        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisCreateClient"]

        expected_data = {
            "middleName": None,
            "nameSuffix": HmisSuffixEnum.NO_ANSWER.name,
            "alias": None,
            "additionalRaceEthnicity": None,
            "differentIdentityText": None,
            "raceEthnicity": [HmisRaceEnum.NOT_COLLECTED.name],
            "gender": [HmisGenderEnum.NOT_COLLECTED.name],
            "veteranStatus": HmisVeteranStatusEnum.NOT_COLLECTED.name,
        }
        expected_client = {
            "personalId": "1",
            "uniqueIdentifier": "123AB456C",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnDataQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
            "dob": None,
            "dobDataQuality": HmisDobQualityEnum.NOT_COLLECTED.name,
            "data": expected_data,
        }

        self.assertEqual(payload, expected_client)

    def test_hmis_create_client_invalid_input(self) -> None:
        return_value = {
            "data": {"createClient": None},
            "errors": [
                {
                    "path": ["createClient"],
                    "data": None,
                    "errorType": "422",
                    "errorInfo": None,
                    "locations": [{"line": 6, "column": 17, "sourceName": None}],
                    "message": '{"name":"Unprocessable entity","message":"{\\"ssnQuality\\":[\\"Quality of SSN is invalid.\\"],\\"nameQuality\\":[\\"Quality of Name is invalid.\\"],\\"dobQuality\\":[\\"Quality of DOB is invalid.\\"],\\"ssn_quality\\":[\\"Quality of SSN is invalid.\\"],\\"name_quality\\":[\\"Quality of Name is invalid.\\"],\\"dob_quality\\":[\\"Quality of DOB is invalid.\\"]}","code":0,"status":422,"messages":{"ssnQuality":["Quality of SSN is invalid."],"nameQuality":["Quality of Name is invalid."],"dobQuality":["Quality of DOB is invalid."],"ssn_quality":["Quality of SSN is invalid."],"name_quality":["Quality of Name is invalid."],"dob_quality":["Quality of DOB is invalid."]}}',
                },
                {
                    "path": ["createClient", "personalId"],
                    "locations": None,
                    "message": "Cannot return null for non-nullable type: 'ID' within parent 'Client' (/createClient/personalId)",
                },
            ],
        }

        client_input = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 22,
            "ssn3": "xxxx",
            "ssnDataQuality": 22,
            "dob": "2001-01-01",
            "dobDataQuality": 22,
        }
        client_sub_items_input = {
            "raceEthnicity": [22],
            "gender": [22],
            "veteranStatus": 22,
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                CREATE_CLIENT_MUTATION,
                variables={
                    "clientInput": client_input,
                    "clientSubItemsInput": client_sub_items_input,
                },
            )

        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisCreateClient"]

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisCreateClient"]
        self.assertIn("Quality of SSN is invalid.", payload["message"])

    def test_hmis_update_client_success(self) -> None:
        client_input = {
            "personalId": "1",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn1": "123",
            "ssn2": "45",
            "ssn3": "6789",
            "ssnDataQuality": 2,
            "dob": "2002-02-02",
            "dobDataQuality": 2,
        }
        client_sub_items_input = {
            "middleName": "Middly",
            "nameSuffix": 2,
            "alias": "Nicky",
            "additionalRaceEthnicity": "add re",
            "differentIdentityText": "diff id",
            "raceEthnicity": [2],
            "gender": [2],
            "veteranStatus": 0,
        }

        return_value = {
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "6789",
            "ssnDataQuality": 2,
            "dob": "2002-02-02",
            "dobDataQuality": 2,
            "data": {
                "middleName": "Middly",
                "nameSuffix": 2,
                "alias": "Nicky",
                "additionalRaceEthnicity": "add re",
                "differentIdentityText": "diff id",
                "raceEthnicity": [2],
                "gender": [2],
                "veteranStatus": 0,
            },
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge.update_client",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                UPDATE_CLIENT_MUTATION,
                variables={
                    "clientInput": client_input,
                    "clientSubItemsInput": client_sub_items_input,
                },
            )

        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisUpdateClient"]

        expected_data = {
            "middleName": "Middly",
            "nameSuffix": "SR",
            "alias": "Nicky",
            "additionalRaceEthnicity": "add re",
            "differentIdentityText": "diff id",
            "raceEthnicity": [HmisRaceEnum.ASIAN.name],
            "gender": [HmisGenderEnum.SPECIFIC.name],
            "veteranStatus": HmisVeteranStatusEnum.NO.name,
        }
        expected_client = {
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "6789",
            "ssnDataQuality": HmisSsnQualityEnum.PARTIAL.name,
            "dob": "2002-02-02",
            "dobDataQuality": HmisDobQualityEnum.PARTIAL.name,
            "data": expected_data,
        }

        self.assertEqual(payload, expected_client)


@skip("need to fix vcrpy in ci")
class HmisCreateClientNoteMutationTests(GraphQLBaseTestCase, TestCase):
    @scrubbed_vcr.use_cassette(
        "apps/betterangels-backend/hmis/tests/cassettes/test_hmis_create_client_note_success.yaml"
    )
    def test_hmis_create_client_note_success(self) -> None:
        client_note_input = {
            "personalId": "1",
            "enrollmentId": "517",
            "title": "api test note",
            "note": "duly noted",
            "date": "2025-10-17",
            "category": "1",
        }

        resp = self.execute_graphql(
            CREATE_CLIENT_NOTE_MUTATION,
            variables={
                "clientNoteInput": client_note_input,
            },
        )

        self.assertIsNone(resp.get("errors"))

        client_note = resp["data"]["hmisCreateClientNote"]

        expected_client_note = {
            "id": "418",
            "title": "api test note",
            "note": "duly noted",
            "date": "2025-10-17",
            "category": None,
            "client": {"personalId": "1"},
            "enrollment": {"enrollmentId": "517"},
        }

        self.assertEqual(client_note, expected_client_note)

    @scrubbed_vcr.use_cassette(
        "apps/betterangels-backend/hmis/tests/cassettes/test_hmis_update_client_note_success.yaml"
    )
    def test_hmis_update_client_note_success(self) -> None:
        client_note_input = {
            "id": "418",
            "personalId": "1",
            "enrollmentId": "517",
            "title": "api test note update",
            "note": "duly updated",
            "date": "2024-09-16",
            "category": "1",
        }

        resp = self.execute_graphql(
            UPDATE_CLIENT_NOTE_MUTATION,
            variables={
                "clientNoteInput": client_note_input,
            },
        )

        self.assertIsNone(resp.get("errors"))

        client_note = resp["data"]["hmisUpdateClientNote"]

        expected_client_note = {
            "id": "418",
            "title": "api test note update",
            "note": "duly updated",
            "date": "2024-09-16",
            "category": None,
            "client": {"personalId": "1"},
            "enrollment": {"enrollmentId": "517"},
        }

        self.assertEqual(client_note, expected_client_note)
