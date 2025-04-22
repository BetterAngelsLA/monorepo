from typing import Any, Optional

import strawberry
from clients.enums import ErrorCodeEnum, HmisAgencyEnum
from clients.schema import (
    validate_california_id,
    validate_contacts,
    validate_email,
    validate_hmis_profiles,
    validate_name,
    validate_phone_numbers,
    value_exists,
)
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from unittest_parametrize import parametrize


class ClientProfileUtilsTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    @parametrize(
        "name, expected_result",
        [
            (strawberry.UNSET, False),
            (None, False),
            ("", False),
            (" ", False),
            ("x", True),
        ],
    )
    def test_value_exists(self, name: Optional[str], expected_result: bool) -> None:
        self.assertEqual(value_exists(name), expected_result)

    @parametrize(
        "first_name, middle_name, last_name, nickname, operation, should_return_error",
        [
            (strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, "nick", "create", False),
            (strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, "create", True),
            (None, None, None, None, "create", True),
            (" ", " ", " ", " ", "create", True),
            ("", None, " ", strawberry.UNSET, "create", True),
            (strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, strawberry.UNSET, "update", False),
            (None, None, None, None, "update", True),
            (" ", " ", " ", " ", "update", True),
            ("", None, " ", strawberry.UNSET, "update", False),
        ],
    )
    def test_validate_name(
        self,
        first_name: Optional[str],
        middle_name: Optional[str],
        last_name: Optional[str],
        nickname: Optional[str],
        operation: str,
        should_return_error: bool,
    ) -> None:
        data = {
            "id": self.client_profile_1["id"] if operation == "update" else None,
            "first_name": first_name,
            "last_name": last_name,
            "middle_name": middle_name,
            "nickname": nickname,
        }

        errors = validate_name(data)
        if should_return_error:
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0]["errorCode"], ErrorCodeEnum.NAME_NOT_PROVIDED.name)
        else:
            self.assertEqual(len(errors), 0)

    @parametrize(
        "email, expected_error_code",
        [
            (strawberry.UNSET, strawberry.UNSET),
            (None, None),
            ("", None),
            ("valid_email@example.co", None),
            (" ", ErrorCodeEnum.EMAIL_INVALID.name),
            ("@.c", ErrorCodeEnum.EMAIL_INVALID.name),
            (" TODD@pblivin.net ", ErrorCodeEnum.EMAIL_INVALID.name),
            ("TODD@pblivin. net", ErrorCodeEnum.EMAIL_INVALID.name),
            ("TODD@pblivin.com", ErrorCodeEnum.EMAIL_IN_USE.name),
        ],
    )
    def test_validate_email(self, email: Optional[str], expected_error_code: Optional[ErrorCodeEnum]) -> None:
        errors = validate_email(email)

        if expected_error_code:
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0]["errorCode"], expected_error_code)
        else:
            self.assertEqual(len(errors), 0)

    def test_validate_email_update_existing(self) -> None:
        self.assertEqual(len(validate_email(self.client_profile_1["email"], self.client_profile_1["id"])), 0)

    @parametrize(
        "california_id, expected_error_code",
        [
            (strawberry.UNSET, strawberry.UNSET),
            (None, None),
            ("", None),
            ("V9753100", None),
            (" ", ErrorCodeEnum.CA_ID_INVALID.name),
            ("l1234567", ErrorCodeEnum.CA_ID_IN_USE.name),
            ("L1234567", ErrorCodeEnum.CA_ID_IN_USE.name),
            ("L123456", ErrorCodeEnum.CA_ID_INVALID.name),
            ("LL 123456", ErrorCodeEnum.CA_ID_INVALID.name),
            ("L123456X", ErrorCodeEnum.CA_ID_INVALID.name),
        ],
    )
    def test_validate_california_id(
        self,
        california_id: Optional[str],
        expected_error_code: Optional[ErrorCodeEnum],
    ) -> None:
        errors = validate_california_id(california_id)

        if expected_error_code:
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0]["errorCode"], expected_error_code)

    def test_validate_california_id_update_existing(self) -> None:
        errors = validate_california_id(
            self.client_profile_1["californiaId"],
            self.client_profile_1["id"],
        )
        self.assertEqual(len(errors), 0)

        errors = validate_california_id(
            self.client_profile_1["californiaId"],
            strawberry.UNSET,
        )
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["field"], "californiaId")
        self.assertEqual(errors[0]["errorCode"], ErrorCodeEnum.CA_ID_IN_USE.name)

    @parametrize(
        "phone_numbers, expected_locations, expected_error_count",
        [
            ([strawberry.UNSET, None, "", " "], ["3__number"], 1),
            (["2125551212", "2125551213", "2125551214"], None, 0),
            (["2005551212", "2125551212", "212555121"], ["0__number", "2__number"], 2),
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
                self.assertEqual(error["errorCode"], ErrorCodeEnum.PHONE_NUMBER_INVALID.name)

    @parametrize(
        "hmis_profiles, expected_locations, expected_error_count, expected_error_codes",
        [
            ([{"agency": HmisAgencyEnum.PASADENA, "hmis_id": "4lign24"}], None, 0, []),
            (
                [
                    {"agency": HmisAgencyEnum.LAHSA, "hmis_id": None},
                    {"agency": HmisAgencyEnum.LAHSA, "hmis_id": "hMIsidlahsa1"},
                    {"agency": HmisAgencyEnum.PASADENA, "hmis_id": "4li12324"},
                    {"agency": HmisAgencyEnum.PASADENA, "hmis_id": strawberry.UNSET},
                    {"agency": HmisAgencyEnum.PASADENA, "hmis_id": " "},
                ],
                ["0__hmisId", "1__hmisId", "3__hmisId", "4__hmisId"],
                4,
                [
                    ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name,
                    ErrorCodeEnum.HMIS_ID_IN_USE.name,
                    ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name,
                    ErrorCodeEnum.HMIS_ID_NOT_PROVIDED.name,
                ],
            ),
        ],
    )
    def test_validate_hmis_profiles(
        self,
        hmis_profiles: list[dict[str, Any]],
        expected_locations: list[str],
        expected_error_count: int,
        expected_error_codes: list[str],
    ) -> None:
        errors = validate_hmis_profiles(hmis_profiles)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            for error, location, expected_error_code in zip(errors, expected_locations, expected_error_codes):
                self.assertEqual(error["field"], "hmisProfiles")
                self.assertEqual(error["location"], location)
                self.assertEqual(error["errorCode"], expected_error_code)

    @parametrize(
        "contacts, expected_locations, expected_error_count",
        [
            (
                [
                    {"phone_number": strawberry.UNSET},
                    {"phone_number": None},
                    {"phone_number": ""},
                    {"phone_number": " "},
                ],
                ["3__phoneNumber"],
                1,
            ),
            (
                [{"phone_number": "2125551212"}, {"phone_number": "2125551213"}, {"phone_number": "2125551214"}],
                None,
                0,
            ),
            (
                [{"phone_number": "2005551212"}, {"phone_number": "2125551212"}, {"phone_number": "212555121"}],
                ["0__phoneNumber", "2__phoneNumber"],
                2,
            ),
            (
                [{"phone_number": "2125551212"}],
                None,
                0,
            ),
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
                self.assertEqual(error["errorCode"], ErrorCodeEnum.PHONE_NUMBER_INVALID.name)
