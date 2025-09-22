from unittest.mock import patch

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from hmis.enums import (
    HmisDobQualityEnum,
    HmisGenderEnum,
    HmisNameQualityEnum,
    HmisRaceEnum,
    HmisSsnQualityEnum,
    HmisVeteranStatusEnum,
)
from model_bakery import baker

LOGIN_MUTATION = """
    mutation ($email: String!, $password: String!) {
        hmisLogin(email: $email, password: $password) {
            __typename
            ... on UserType { id }
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


@override_settings(AUTHENTICATION_BACKENDS=["django.contrib.auth.backends.ModelBackend"])
class HmisLoginMutationTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.existing_user = baker.make(get_user_model(), _fill_optional=["email"])

    def test_hmis_login_success(self) -> None:
        with patch(
            "hmis.api_bridge.HmisApiBridge.create_auth_token",
            return_value="success",
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "anything"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "UserType")
        self.assertEqual(payload["id"], str(self.existing_user.pk))

        # Session should now contain the logged-in user
        session = self.graphql_client.session
        self.assertIn("_auth_user_id", session)
        self.assertEqual(session["_auth_user_id"], str(self.existing_user.pk))
        self.assertEqual(
            session.get("_auth_user_backend"),
            "django.contrib.auth.backends.ModelBackend",
        )

    def test_hmis_login_invalid_credentials(self) -> None:
        with patch(
            "hmis.api_bridge.HmisApiBridge.create_auth_token",
            return_value=None,
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
            "hmis.api_bridge.HmisApiBridge.create_auth_token",
            return_value="TOK_ABC",
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
        client_input = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn1": "***",
            "ssn2": "**",
            "ssn3": "xxxx",
            "ssnDataQuality": 99,
            "dob": "2001-01-01",
            "dobDataQuality": 1,
        }
        client_sub_items_input = {
            "middleName": "Middly",
            "nameSuffix": 1,
            "alias": "Nicky",
            "additionalRaceEthnicity": "add re",
            "differentIdentityText": "diff id",
            "raceEthnicity": [1],
            "gender": [1],
            "veteranStatus": 1,
        }

        return_value = {
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
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

        with patch(
            "hmis.api_bridge.HmisApiBridge.create_client",
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
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
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

    def test_partial_hmis_create_client_success(self) -> None:
        client_input = {
            "firstName": "Firsty",
            "lastName": "Lasty",
        }
        client_sub_items_input = {
            "middleName": "",
            "alias": "",
        }

        return_value = {
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn3": "xxxx",
            "ssnDataQuality": 99,
            "dob": None,
            "dobDataQuality": 99,
            "data": {
                "raceEthnicity": [99],
                "gender": [99],
                "veteranStatus": 99,
            },
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.create_client",
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
            "nameSuffix": None,
            "alias": None,
            "additionalRaceEthnicity": None,
            "differentIdentityText": None,
            "raceEthnicity": [HmisRaceEnum.NOT_COLLECTED.name],
            "gender": [HmisGenderEnum.NOT_COLLECTED.name],
            "veteranStatus": HmisVeteranStatusEnum.NOT_COLLECTED.name,
        }
        expected_client = {
            "personalId": "1",
            "uniqueIdentifier": "981C4E53A",
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": HmisNameQualityEnum.FULL.name,
            "ssn1": None,
            "ssn2": None,
            "ssn3": "xxxx",
            "ssnDataQuality": HmisSsnQualityEnum.NOT_COLLECTED.name,
            "dob": None,
            "dobDataQuality": HmisDobQualityEnum.NOT_COLLECTED.name,
            "data": expected_data,
        }

        self.assertEqual(payload, expected_client)

    def test_hmis_create_client_invalid_input(self) -> None:
        client_input = {
            "firstName": "Firsty",
            "lastName": "Lasty",
            "nameDataQuality": 1,
            "ssn3": "xxxx",
            "ssnDataQuality": 99999999,
            "dob": "2001-01-01",
            "dobDataQuality": 1,
        }
        client_sub_items_input = {
            "raceEthnicity": [1],
            "gender": [1],
            "veteranStatus": 1,
        }

        return_value = {
            "errors": [
                {
                    "path": ["createClient"],
                    "data": None,
                    "errorType": "422",
                    "errorInfo": None,
                    "locations": [{"line": 6, "column": 17, "sourceName": None}],
                    "message": (
                        '{"name":"Unprocessable entity","message":"{\\"ssnQuality\\":[\\"Quality of SSN'
                        'is invalid.\\"],\\"ssn_quality\\":[\\"Quality of SSN is invalid.\\"]}","code":0,'
                        '"status":422,"messages":{"ssnQuality":["Quality of SSN is invalid."],"ssn_quality":'
                        '["Quality of SSN is invalid."]}}'
                    ),
                },
                {
                    "path": ["createClient"],
                    "locations": None,
                    "message": (
                        "Cannot return null for non-nullable "
                        "type: 'ID' within parent 'Client' (/createClient/personalId)"
                    ),
                },
            ]
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.create_client",
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
            "veteranStatus": 8,
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
                "veteranStatus": 8,
            },
        }

        with patch(
            "hmis.api_bridge.HmisApiBridge.update_client",
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
            "veteranStatus": HmisVeteranStatusEnum.DONT_KNOW.name,
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
            "dob": "2001-01-01",
            "dobDataQuality": HmisDobQualityEnum.PARTIAL.name,
            "data": expected_data,
        }

        self.assertEqual(payload, expected_client)
