from unittest import skip
from unittest.mock import patch

from common.tests.utils import GraphQLBaseTestCase
from django.test import TestCase
from hmis.enums import (
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisVeteranStatusEnum,
)
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
            "hmis.api_bridge.HmisApiBridge._make_request",
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
            "hmis.api_bridge.HmisApiBridge._make_request",
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
            "hmis.api_bridge.HmisApiBridge._make_request",
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
