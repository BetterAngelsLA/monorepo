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
from test_utils.vcr_config import scrubbed_vcr

GET_CLIENT_QUERY = """
    query ($personalId: ID!) {
        hmisGetClient(personalId: $personalId) {
            __typename
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
            ... on HmisGetClientError { message field }
        }
    }
"""

LIST_CLIENTS_QUERY = """
    query ($filter: HmisClientFilterInput, $pagination: HmisPaginationInput) {
        hmisListClients (filter: $filter, pagination: $pagination) {
            ... on HmisClientListType{
                items {
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
                meta {
                    currentPage
                    pageCount
                    perPage
                    totalCount
                }
            }
            ... on HmisListClientsError {
                message
            }
        }
    }
"""

LIST_ENROLLMENTS_QUERY = """
    query ($personalId: ID!, $dynamicFields: [String]!, $pagination: HmisPaginationInput) {
        hmisListEnrollments(personalId: $personalId, dynamicFields: $dynamicFields, pagination: $pagination) {
            ... on HmisEnrollmentListType {
                items {
                    personalId
                    dateCreated
                    dateUpdated
                    enrollmentId
                    entryDate
                    exitDate
                    householdId
                    data {
                        field
                        value
                    }
                    enrollmentHouseholdMembers {
                        personalId
                        enrollmentId
                    }
                    project {
                        projectId
                        projectName
                        projectType
                        dateCreated
                        dateUpdated
                    }
                }
                meta {
                    currentPage
                    pageCount
                    perPage
                    totalCount
                }
            }
            ... on HmisListEnrollmentsError {
                message
            }
        }
    }
"""

GET_CLIENT_NOTE_QUERY = """
    query ($personalId: ID!, $enrollmentId: ID!, $id: ID!) {
        hmisGetClientNote (personalId: $personalId, enrollmentId: $enrollmentId, id: $id) {
            ... on HmisClientNoteType {
                id
                title
                note
                date
                category
                client { personalId }
                enrollment { enrollmentId }
            }
            ... on HmisGetClientNoteError {
                message
                field
            }
        }
    }
"""

LIST_CLIENT_NOTES_QUERY = """
    query ($personalId: ID!, $enrollmentId: ID!, $pagination: HmisPaginationInput) {
        hmisListClientNotes (personalId: $personalId, enrollmentId: $enrollmentId, pagination: $pagination) {
            ... on HmisClientNoteListType {
                items {
                    id
                    title
                    note
                    date
                    category
                    client { personalId }
                    enrollment { enrollmentId }
                }
                meta {
                    currentPage
                    pageCount
                    perPage
                    totalCount
                }
            }
            ... on HmisListClientNotesError {
                message
                field
            }
        }
    }
"""


LIST_ENROLLMENTS_QUERY = """
    query ($personalId: ID!, $dynamicFields: [String]!, $pagination: HmisPaginationInput) {
        hmisListEnrollments(personalId: $personalId, dynamicFields: $dynamicFields, pagination: $pagination) {
            ... on HmisEnrollmentListType {
                items {
                    personalId
                    dateCreated
                    dateUpdated
                    enrollmentId
                    entryDate
                    exitDate
                    householdId
                    data {
                        field
                        value
                    }
                    enrollmentHouseholdMembers {
                        personalId
                        enrollmentId
                    }
                    project {
                        projectId
                        projectName
                        projectType
                        dateCreated
                        dateUpdated
                    }
                }
                meta {
                    currentPage
                    pageCount
                    perPage
                    totalCount
                }
            }
            ... on HmisListEnrollmentsError {
                message
            }
        }
    }
"""


@override_settings(HMIS_REST_URL="https://example.com", HMIS_HOST="example.com")
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

    @scrubbed_vcr.use_cassette("test_hmis_client_profile_query.yaml")
    def test_hmis_client_profile_query(self) -> None:
        query = f"""
            query ($hmis_id: String!) {{
                hmisClientProfile(hmisId: $hmis_id) {{
                    {self.hmis_client_profile_fields}
                }}
            }}
        """
        variables = {"hmis_id": self.hmis_client_profile.hmis_id}
        response = self.execute_graphql(query, variables)

        hmis_client_profile = response["data"]["hmisClientProfile"]
        expected = {
            # ID & metadata fields
            "hmisId": "1",
            "personalId": "7e401eed7ee14c36a7641ef44626695c",
            "uniqueIdentifier": "69E44770D",
            "addedDate": "2025-08-06T13:43:43",
            "lastUpdated": "2025-11-06T11:14:54",
            # Client fields
            "alias": None,
            "birthDate": "2001-01-01",
            "dobQuality": HmisDobQualityEnum.FULL.name,
            "firstName": "John",
            "lastName": "Smith",
            "nameQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "4321",
            "ssnQuality": HmisSsnQualityEnum.FULL.name,
            # SV fields
            "age": 24,
            "gender": [HmisGenderEnum.WOMAN_GIRL.name, HmisGenderEnum.DIFFERENT.name],
            "genderIdentityText": "Gen Id",
            "nameMiddle": "B",
            "nameSuffix": HmisSuffixEnum.JR.name,
            "raceEthnicity": [HmisRaceEnum.INDIGENOUS.name, HmisRaceEnum.ASIAN.name],
            "additionalRaceEthnicityDetail": "AddlRace",
            "veteran": HmisVeteranStatusEnum.YES.name,
            # BA fields
            "adaAccommodation": [AdaAccommodationEnum.HEARING.name, AdaAccommodationEnum.MOBILITY.name],
            "address": "123 Main St",
            "californiaId": "A1357246",
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "email": "jbs@example.com",
            "eyeColor": EyeColorEnum.BLUE.name,
            "hairColor": HairColorEnum.BLACK.name,
            "heightInInches": 72.0,
            "importantNotes": "important notes",
            "livingSituation": LivingSituationEnum.OPEN_AIR.name,
            "mailingAddress": "123 Mail St",
            "maritalStatus": MaritalStatusEnum.DIVORCED.name,
            "phoneNumbers": [{"id": ANY, "number": "2125551212", "isPrimary": True}],
            "physicalDescription": "physdesc",
            "placeOfBirth": "Los Angeles",
            "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
            "preferredLanguage": LanguageEnum.ARABIC.name,
            "profilePhoto": None,
            "pronouns": PronounEnum.OTHER.name,
            "pronounsOther": "pronouns",
            "residenceAddress": "123 Res St",
            "residenceGeolocation": self.residence_geolocation,
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
        }

        self.assertEqual(expected, hmis_client_profile)


class HmisClientQueryTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_hmis_get_client_success(self) -> None:
        return_value = {
            "data": {
                "getClient": {
                    "personalId": "1",
                    "uniqueIdentifier": "123AB456C",
                    "firstName": "Firsty",
                    "lastName": "Lasty",
                    "nameDataQuality": 1,
                    "ssn1": "***",
                    "ssn2": "**",
                    "ssn3": "xxxx",
                    "ssnDataQuality": 99,
                    "dob": "2001-01-01",
                    "dobDataQuality": 1,
                    "data": {
                        "middleName": "Middly",
                        "nameSuffix": 1,
                        "alias": "Nicky",
                        "raceEthnicity": [1],
                        "additionalRaceEthnicity": "add re",
                        "differentIdentityText": "diff id",
                        "gender": [1],
                        "veteranStatus": 1,
                    },
                }
            }
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                GET_CLIENT_QUERY,
                variables={"personalId": "1"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisGetClient"]
        self.assertEqual(payload["__typename"], "HmisClientType")
        self.assertEqual(payload["personalId"], "1")

        expected_data = {
            "middleName": "Middly",
            "nameSuffix": "JR",
            "alias": "Nicky",
            "additionalRaceEthnicity": "add re",
            "differentIdentityText": "diff id",
            "raceEthnicity": [HmisRaceEnum.INDIGENOUS.name],
            "gender": [HmisGenderEnum.MAN_BOY.name],
            "veteranStatus": HmisVeteranStatusEnum.YES.name,
        }
        expected_client = {
            "__typename": "HmisClientType",
            "personalId": "1",
            "uniqueIdentifier": "123AB456C",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnDataQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
            "dob": "2001-01-01",
            "dobDataQuality": HmisDobQualityEnum.FULL.name,
            "data": expected_data,
        }

        self.assertEqual(payload, expected_client)

    def test_hmis_get_client_does_not_exist(self) -> None:
        return_value = {
            "data": {"getClient": None},
            "errors": [
                {
                    "path": ["getClient"],
                    "data": None,
                    "errorType": "404",
                    "errorInfo": None,
                    "locations": [{"line": 2, "column": 3, "sourceName": None}],
                    "message": '{"name":"Not Found","message":"Page not found.","code":0,"status":404}',
                },
                {
                    "path": ["getClient", "personalId"],
                    "locations": None,
                    "message": "Cannot return null for non-nullable type: 'ID' within parent 'Client' (/getClient/personalId)",
                },
            ],
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                GET_CLIENT_QUERY,
                variables={"personalId": "bad id"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisGetClient"]
        self.assertEqual(payload["__typename"], "HmisGetClientError")
        self.assertIn("Page not found", payload["message"])

    def test_hmis_list_clients_success(self) -> None:
        return_value = {
            "data": {
                "listClients": {
                    "items": [
                        {
                            "personalId": "1",
                            "uniqueIdentifier": "11111111A",
                            "firstName": "f1",
                            "lastName": "l1",
                            "nameDataQuality": 1,
                            "ssn1": "***",
                            "ssn2": "**",
                            "ssn3": "xxxx",
                            "ssnDataQuality": 99,
                            "dob": "2001-01-01",
                            "dobDataQuality": 1,
                            "data": {
                                "middleName": "m1",
                                "nameSuffix": 1,
                                "alias": "n1",
                                "raceEthnicity": [1],
                                "additionalRaceEthnicity": "add re",
                                "differentIdentityText": "diff id",
                                "gender": [1],
                                "veteranStatus": 1,
                            },
                        },
                        {
                            "personalId": "2",
                            "uniqueIdentifier": "22222222B",
                            "firstName": "f2",
                            "lastName": "l2",
                            "nameDataQuality": 2,
                            "ssn1": "***",
                            "ssn2": "**",
                            "ssn3": "xxxx",
                            "ssnDataQuality": 99,
                            "dob": "2002-02-02",
                            "dobDataQuality": 2,
                            "data": {
                                "middleName": "m2",
                                "nameSuffix": 2,
                                "alias": "n2",
                                "raceEthnicity": [2],
                                "additionalRaceEthnicity": "add re",
                                "differentIdentityText": "diff id",
                                "gender": [2],
                                "veteranStatus": 8,
                            },
                        },
                    ],
                    "meta": {
                        "per_page": 10,
                        "current_page": 1,
                        "page_count": 1,
                        "total_count": 2,
                    },
                }
            }
        }

        with patch(
            "hmis.gql_api_bridge.HmisGraphQLApiBridge._make_request",
            return_value=return_value,
        ):
            resp = self.execute_graphql(
                LIST_CLIENTS_QUERY,
                variables={
                    "pagination": {"page": 1, "perPage": 10},
                    "filter": {"search": ""},
                },
            )

        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisListClients"]
        clients = payload["items"]
        pagination_info = payload["meta"]

        expected_clients = [
            {
                "personalId": "1",
                "uniqueIdentifier": "11111111A",
                "firstName": "f1",
                "lastName": "l1",
                "nameDataQuality": HmisNameQualityEnum.FULL.name,
                "ssn1": "***",
                "ssn2": "**",
                "ssn3": "xxxx",
                "ssnDataQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
                "dob": "2001-01-01",
                "dobDataQuality": HmisDobQualityEnum.FULL.name,
                "data": {
                    "middleName": "m1",
                    "nameSuffix": "JR",
                    "alias": "n1",
                    "additionalRaceEthnicity": "add re",
                    "differentIdentityText": "diff id",
                    "raceEthnicity": [HmisRaceEnum.INDIGENOUS.name],
                    "gender": [HmisGenderEnum.MAN_BOY.name],
                    "veteranStatus": HmisVeteranStatusEnum.YES.name,
                },
            },
            {
                "personalId": "2",
                "uniqueIdentifier": "22222222B",
                "firstName": "f2",
                "lastName": "l2",
                "nameDataQuality": HmisNameQualityEnum.PARTIAL.name,
                "ssn1": "***",
                "ssn2": "**",
                "ssn3": "xxxx",
                "ssnDataQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
                "dob": "2002-02-02",
                "dobDataQuality": HmisDobQualityEnum.PARTIAL.name,
                "data": {
                    "middleName": "m2",
                    "nameSuffix": "SR",
                    "alias": "n2",
                    "additionalRaceEthnicity": "add re",
                    "differentIdentityText": "diff id",
                    "raceEthnicity": [HmisRaceEnum.ASIAN.name],
                    "gender": [HmisGenderEnum.SPECIFIC.name],
                    "veteranStatus": HmisVeteranStatusEnum.DONT_KNOW.name,
                },
            },
        ]

        expected_pagination_info = {
            "perPage": 10,
            "currentPage": 1,
            "pageCount": 1,
            "totalCount": 2,
        }

        self.assertEqual(clients, expected_clients)
        self.assertEqual(pagination_info, expected_pagination_info)


class HmisEnrollmentQueryTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

    @scrubbed_vcr.use_cassette("test_hmis_list_enrollments_success.yaml")
    @skip("need to fix vcrpy in ci")
    def test_hmis_list_enrollments_success(self) -> None:
        resp = self.execute_graphql(
            LIST_ENROLLMENTS_QUERY,
            variables={
                "personalId": "1",
                "pagination": {"page": 1, "perPage": 10},
                "dynamicFields": [
                    "program_date",
                    "cocCode",
                    "disablingCondition",
                    "relationshipToHoH",
                ],
            },
        )

        expected_enrollments = [
            {
                "personalId": "1",
                "dateCreated": "2025-10-14 04:55:25",
                "dateUpdated": "2025-10-14 04:55:25",
                "enrollmentId": "517",
                "entryDate": "2025-10-14",
                "exitDate": None,
                "householdId": "535",
                "data": [
                    {"field": "program_date", "value": "2025-10-14"},
                    {"field": "relationshipToHoH", "value": "1"},
                    {"field": "disablingCondition", "value": "1"},
                    {"field": "cocCode", "value": "Default"},
                ],
                "project": {
                    "projectId": "2",
                    "projectName": "Housing Program 01",
                    "projectType": "10",
                    "dateCreated": "2025-08-25 17:43:58",
                    "dateUpdated": "2025-08-28 08:40:58",
                },
                "enrollmentHouseholdMembers": [{"personalId": "1", "enrollmentId": "517"}],
            },
            {
                "personalId": "1",
                "dateCreated": "2025-10-14 05:00:10",
                "dateUpdated": "2025-10-14 05:00:10",
                "enrollmentId": "518",
                "entryDate": "2025-10-14",
                "exitDate": None,
                "householdId": "536",
                "data": [
                    {"field": "program_date", "value": "2025-10-14"},
                    {"field": "relationshipToHoH", "value": "1"},
                    {"field": "disablingCondition", "value": "0"},
                    {"field": "cocCode", "value": "Default"},
                ],
                "project": {
                    "projectId": "3",
                    "projectName": "Services Program 01",
                    "projectType": "4",
                    "dateCreated": "2025-08-27 16:59:41",
                    "dateUpdated": "2025-08-27 17:35:20",
                },
                "enrollmentHouseholdMembers": [{"personalId": "1", "enrollmentId": "518"}],
            },
        ]

        expected_pagination_info = {"currentPage": 1, "pageCount": 1, "perPage": 10, "totalCount": 2}

        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisListEnrollments"]
        enrollments = payload["items"]
        pagination_info = payload["meta"]

        self.assertEqual(enrollments, expected_enrollments)
        self.assertEqual(pagination_info, expected_pagination_info)


class HmisClientNoteQueryTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

    @scrubbed_vcr.use_cassette("apps/betterangels-backend/hmis/tests/cassettes/test_hmis_get_client_note_success.yaml")
    @skip("need to fix vcrpy in ci")
    def test_hmis_get_client_note_success(self) -> None:
        resp = self.execute_graphql(
            GET_CLIENT_NOTE_QUERY,
            variables={"personalId": "1", "enrollmentId": "517", "id": "413"},
        )

        expected_client_note = {
            "id": "413",
            "title": "first last housing note",
            "note": "<p>take note</p>",
            "date": "2025-10-16",
            "category": None,
            "client": {"personalId": "1"},
            "enrollment": {"enrollmentId": "517"},
        }

        self.assertIsNone(resp.get("errors"))

        client_note = resp["data"]["hmisGetClientNote"]
        self.assertEqual(client_note, expected_client_note)

    @scrubbed_vcr.use_cassette(
        "apps/betterangels-backend/hmis/tests/cassettes/test_hmis_list_client_notes_success.yaml"
    )
    @skip("need to fix vcrpy in ci")
    def test_hmis_list_client_notes_success(self) -> None:
        resp = self.execute_graphql(
            LIST_CLIENT_NOTES_QUERY,
            variables={
                "personalId": "1",
                "enrollmentId": "517",
                "pagination": {"page": 1, "perPage": 10},
            },
        )
        self.assertIsNone(resp.get("errors"))

        payload = resp["data"]["hmisListClientNotes"]
        client_notes = payload["items"]
        pagination_info = payload["meta"]

        expected_client_notes = [
            {
                "id": "413",
                "title": "first last housing note",
                "note": "<p>take note</p>",
                "date": "2025-10-16",
                "category": None,
                "client": {"personalId": "1"},
                "enrollment": {"enrollmentId": "517"},
            }
        ]
        expected_pagination_info = {
            "perPage": 10,
            "currentPage": 1,
            "pageCount": 1,
            "totalCount": 1,
        }

        self.assertEqual(client_notes, expected_client_notes)
        self.assertEqual(pagination_info, expected_pagination_info)
