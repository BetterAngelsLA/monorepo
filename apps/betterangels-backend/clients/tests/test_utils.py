from typing import Any, Optional

import strawberry
from accounts.models import User
from clients.enums import HmisAgencyEnum
from clients.schema import (
    clean_and_validate_california_id,
    name_is_present,
    validate_california_id_unique,
    validate_client_has_name,
    validate_contacts,
    validate_hmis_profiles,
    validate_phone_numbers,
    validate_user_email_pattern,
    validate_user_email_unique,
)
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from common.enums import ErrorMessageEnum
from unittest_parametrize import parametrize


class ClientProfileUtilsTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    @parametrize(
        "name, expected_result",
        [(strawberry.UNSET, False), (None, False), ("", False), (" ", False), ("x", True)],
    )
    def test_name_is_present(self, name: Optional[str], expected_result: bool) -> None:
        self.assertEqual(name_is_present(name), expected_result)

    @parametrize(
        "first_name, middle_name, last_name, nickname, operation, should_succeed",
        [
            (strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, "create", False),
            ("", None, " ", strawberry.UNSET, "create", False),
            (None, None, None, None, "create", False),
            (" ", " ", " ", " ", "create", False),
            (None, None, None, None, "update", False),
            (" ", " ", " ", " ", "update", False),
            ("", None, " ", strawberry.UNSET, "update", True),
            (strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, "update", True),
        ],
    )
    def test_validate_client_has_name(
        self,
        first_name: Optional[str],
        middle_name: Optional[str],
        last_name: Optional[str],
        nickname: Optional[str],
        operation: str,
        should_succeed: bool,
    ) -> None:
        user = User.objects.get(pk=self.client_profile_1["user"]["id"]) if operation == "update" else None
        user_data = {
            "first_name": first_name,
            "last_name": last_name,
            "middle_name": middle_name,
        }
        errors = validate_client_has_name(user_data, nickname, user)
        if should_succeed:
            self.assertEqual(len(errors), 0)
        else:
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

    @parametrize(
        "email, expected_output, should_succeed",
        [
            (" ", None, True),
            ("", None, True),
            (None, None, True),
            ("@.c", "@.c", False),
            (strawberry.UNSET, strawberry.UNSET, True),
            (" TODD@pblivin.net ", "todd@pblivin.net", True),
            ("TODD@pblivin. net", "todd@pblivin. net", False),
        ],
    )
    def test_validate_user_email_pattern(
        self, email: Optional[str], expected_output: None, should_succeed: bool
    ) -> None:
        returned_email, returned_errors = validate_user_email_pattern(email)

        self.assertEqual(returned_email, expected_output)

        if should_succeed:
            self.assertEqual(len(returned_errors), 0)
        else:
            self.assertEqual(len(returned_errors), 1)
            self.assertEqual(returned_errors[0]["errorCode"], ErrorMessageEnum.INVALID_EMAIL.name)

    @parametrize(
        "email, should_succeed",
        [("TODD@pblivin.com", False), ("todd@pblivin.net", True)],
    )
    def test_validate_user_email_unique(self, email: str, should_succeed: bool) -> None:
        errors = validate_user_email_unique(email)

        if should_succeed:
            self.assertEqual(len(errors), 0)
        else:
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.EMAIL_IN_USE.name)

    @parametrize(
        "california_id, expected_california_id, expected_error_code",
        [
            ("l1234567", "L1234567", None),
            ("L123456", "L123456", ErrorMessageEnum.INVALID_CA_ID.name),
            ("LL 123456", "LL 123456", ErrorMessageEnum.INVALID_CA_ID.name),
            ("L123456X", "L123456X", ErrorMessageEnum.INVALID_CA_ID.name),
            ("", None, None),
            ("  ", None, None),
            (None, None, None),
        ],
    )
    def test_clean_and_validate_california_id(
        self,
        california_id: Optional[str],
        expected_california_id: Optional[str],
        expected_error_code: Optional[ErrorMessageEnum],
    ) -> None:
        returned_ca_id, returned_error = clean_and_validate_california_id(california_id)

        self.assertEqual(returned_ca_id, expected_california_id)
        if expected_error_code:
            self.assertEqual(returned_error[0]["errorCode"], expected_error_code)

    def test_validate_california_id_unique(self) -> None:
        user = User.objects.get(pk=self.client_profile_1["user"]["id"])
        california_id = self.client_profile_1["californiaId"]

        # Unique check
        errors = validate_california_id_unique(california_id, user)
        self.assertEqual(len(errors), 0)

        errors = validate_california_id_unique(california_id, None)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["field"], "californiaId")
        self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.CA_ID_IN_USE.name)

    @parametrize(
        "phone_numbers, expected_locations, expected_error_count",
        [
            (["2125551212", "2125551213", "2125551214"], None, 0),
            (
                ["2005551212", "2125551212", "212555121"],
                ["0__number", "2__number"],
                2,
            ),
            (["2125551212"], None, 0),
        ],
    )
    def test_validate_phone_numbers(
        self,
        phone_numbers: list[str],
        expected_locations: Optional[list[str]],
        expected_error_count: int,
    ) -> None:
        phone_number_dicts = [{"number": phone_number} for phone_number in phone_numbers]

        errors = validate_phone_numbers(phone_number_dicts)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            assert expected_locations
            for error, location in zip(errors, expected_locations):
                self.assertEqual(error["field"], "phoneNumbers")
                self.assertEqual(error["location"], location)
                self.assertEqual(error["errorCode"], ErrorMessageEnum.INVALID_PHONE_NUMBER.name)

    @parametrize(
        "hmis_profiles, expected_locations, expected_error_count",
        [
            ([{"agency": HmisAgencyEnum.PASADENA, "hmis_id": "4lign24"}], None, 0),
            (
                [
                    {"agency": HmisAgencyEnum.LAHSA, "hmis_id": "HMISidLAHSA1"},
                    {"agency": HmisAgencyEnum.PASADENA, "hmis_id": "yu635fbg"},
                    {"agency": HmisAgencyEnum.PASADENA, "hmis_id": "HMISidPASADENA1"},
                ],
                ["0__hmisId", "2__hmisId"],
                2,
            ),
        ],
    )
    def test_validate_hmis_profiles(
        self,
        hmis_profiles: list[dict[str, Any]],
        expected_locations: list[str],
        expected_error_count: int,
    ) -> None:
        errors = validate_hmis_profiles(hmis_profiles)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            for error, location in zip(errors, expected_locations):
                self.assertEqual(error["field"], "hmisProfiles")
                self.assertEqual(error["location"], location)
                self.assertEqual(error["errorCode"], ErrorMessageEnum.HMIS_ID_IN_USE.name)

    def test_validate_hmis_profiles_update_existing(self) -> None:
        hmis_profiles = [
            {
                "id": self.client_profile_1["hmisProfiles"][0]["id"],
                "agency": HmisAgencyEnum[self.client_profile_1["hmisProfiles"][0]["agency"]],
                "hmis_id": self.client_profile_1["hmisProfiles"][0]["hmisId"],
            },
            {
                "agency": HmisAgencyEnum[self.client_profile_1["hmisProfiles"][0]["agency"]],
                "hmis_id": self.client_profile_1["hmisProfiles"][0]["hmisId"],
            },
        ]
        errors = validate_hmis_profiles(hmis_profiles)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["field"], "hmisProfiles")
        self.assertEqual(errors[0]["location"], "1__hmisId")
        self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.HMIS_ID_IN_USE.name)

    @parametrize(
        "contacts, expected_locations, expected_error_count",
        [
            (
                [
                    {"phone_number": "2125551212"},
                    {"phone_number": "2125551213"},
                    {"phone_number": "2125551214"},
                ],
                None,
                0,
            ),
            (
                [
                    {"phone_number": "2005551212"},
                    {"phone_number": "2125551212"},
                    {"phone_number": "212555121"},
                ],
                ["0__phoneNumber", "2__phoneNumber"],
                2,
            ),
            ([{"phone_number": "2125551212"}], None, 0),
        ],
    )
    def test_validate_contacts(
        self,
        contacts: list[dict[str, str]],
        expected_locations: Optional[list[str]],
        expected_error_count: int,
    ) -> None:
        contact_dicts = [{"phone_number": c["phone_number"]} for c in contacts]

        errors = validate_contacts(contact_dicts)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            assert expected_locations
            for error, location in zip(errors, expected_locations):
                self.assertEqual(error["field"], "contacts")
                self.assertEqual(error["location"], location)
                self.assertEqual(error["errorCode"], ErrorMessageEnum.INVALID_PHONE_NUMBER.name)
