from typing import Any, Optional

import strawberry
from clients.enums import ClientDocumentNamespaceEnum, ErrorCodeEnum, HmisAgencyEnum
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
from clients.types import CLIENT_DOCUMENT_NAMESPACE_GROUPS
from django.test import TestCase
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
            self.assertIn("client_name", errors)
            self.assertEqual(errors["client_name"].code, ErrorCodeEnum.NAME_NOT_PROVIDED.name)
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
            error = next(iter(errors.values()))
            self.assertEqual(error.code, expected_error_code)
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
            error = next(iter(errors.values()))
            self.assertEqual(error.code, expected_error_code)

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
        self.assertIn("california_id", errors)
        self.assertEqual(errors["california_id"].code, ErrorCodeEnum.CA_ID_IN_USE.name)

    @parametrize(
        "phone_numbers, expected_keys, expected_error_count",
        [
            ([strawberry.UNSET, None, "", " "], ["phone_numbers.3.number"], 1),
            (["2125551212", "2125551213", "2125551214"], None, 0),
            (["2005551212", "2125551212", "212555121"], ["phone_numbers.0.number", "phone_numbers.2.number"], 2),
            (["2125551212"], None, 0),
        ],
    )
    def test_validate_phone_numbers(
        self,
        phone_numbers: list[str],
        expected_keys: Optional[list[str]],
        expected_error_count: int,
    ) -> None:
        phone_number_dicts = [{"number": phone_number} for phone_number in phone_numbers]

        errors = validate_phone_numbers(phone_number_dicts)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            assert expected_keys
            for expected_key in expected_keys:
                self.assertIn(expected_key, errors)
                self.assertEqual(errors[expected_key].code, ErrorCodeEnum.PHONE_NUMBER_INVALID.name)

    @parametrize(
        "hmis_profiles, expected_keys, expected_error_count, expected_error_codes",
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
                [
                    "hmis_profiles.0.hmis_id",
                    "hmis_profiles.1.hmis_id",
                    "hmis_profiles.3.hmis_id",
                    "hmis_profiles.4.hmis_id",
                ],
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
        expected_keys: Optional[list[str]],
        expected_error_count: int,
        expected_error_codes: list[str],
    ) -> None:
        errors = validate_hmis_profiles(hmis_profiles)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            assert expected_keys
            for expected_key, expected_error_code in zip(expected_keys, expected_error_codes):
                self.assertIn(expected_key, errors)
                self.assertEqual(errors[expected_key].code, expected_error_code)

    @parametrize(
        "contacts, expected_keys, expected_error_count",
        [
            (
                [
                    {"phone_number": strawberry.UNSET},
                    {"phone_number": None},
                    {"phone_number": ""},
                    {"phone_number": " "},
                ],
                ["contacts.3.phone_number"],
                1,
            ),
            (
                [{"phone_number": "2125551212"}, {"phone_number": "2125551213"}, {"phone_number": "2125551214"}],
                None,
                0,
            ),
            (
                [{"phone_number": "2005551212"}, {"phone_number": "2125551212"}, {"phone_number": "212555121"}],
                ["contacts.0.phone_number", "contacts.2.phone_number"],
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
        expected_keys: Optional[list[str]],
        expected_error_count: int,
    ) -> None:
        contact_dicts = [{"phone_number": c["phone_number"]} for c in contacts]

        errors = validate_contacts(contact_dicts)
        self.assertEqual(len(errors), expected_error_count)
        if expected_error_count:
            assert expected_keys
            for expected_key in expected_keys:
                self.assertIn(expected_key, errors)
                self.assertEqual(errors[expected_key].code, ErrorCodeEnum.PHONE_NUMBER_INVALID.name)


class ClientDocumentNamespaceGroupTestCase(TestCase):
    def test_all_docs_are_grouped(self) -> None:
        grouped_docs = {doc for docs in CLIENT_DOCUMENT_NAMESPACE_GROUPS.values() for doc in docs}
        all_docs = set(ClientDocumentNamespaceEnum)

        self.assertEqual(
            grouped_docs,
            all_docs,
            f"Docs not included in a group: {all_docs - grouped_docs}. Update `CLIENT_DOCUMENT_NAMESPACE_GROUPS`",
        )
