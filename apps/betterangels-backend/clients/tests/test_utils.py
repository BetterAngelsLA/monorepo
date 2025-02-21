from typing import Optional

import phonenumber_field
from clients.schema import validate_california_id
from clients.tests.utils import ClientProfileGraphQLBaseTestCase
from common.enums import ErrorMessageEnum
from unittest_parametrize import parametrize


class UtilsTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    @parametrize(
        "email, expected_email, expected_error_code",
        [
            ("", None, None),
            (None, None, None),
            ("todd@pblivin.com", None, ErrorMessageEnum.EMAIL_IN_USE.name),
            ("todd@pblivin.net", "todd@pblivin.net", None),
        ],
    )
    def test_validate_user_email(
        self, email: Optional[str], expected_email: None, expected_error_code: Optional[ErrorMessageEnum]
    ) -> None:
        variables = {
            "user": {
                "firstName": "firsty",
                "email": email,
            },
        }
        response = self._create_client_profile_fixture(variables)

        if expected_error_code:
            validation_errors = response["errors"][0]
            error_messages = validation_errors["extensions"]["errors"]
            self.assertEqual(len(error_messages), 1)
            self.assertEqual(error_messages[0]["errorCode"], expected_error_code)
        else:
            client_profile = response["data"]["createClientProfile"]
            self.assertEqual(client_profile["user"]["email"], expected_email)

    def test_validate_user_name_not_set(self) -> None:
        variables = {
            "user": {
                "email": "email@email.com",
            },
        }

        # creating a client profile without a name should fail
        created_response = self._create_client_profile_fixture(variables)
        validation_errors = created_response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]
        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

        # updating a client profile without touching the name should succeed
        variables["id"] = self.client_profile_1["id"]
        variables["user"]["id"] = self.client_profile_1["user"]["id"]
        updated_response = self._update_client_profile_fixture(variables)
        self.assertIsNone(updated_response.get("errors"))

        variables.pop("user")
        updated_response = self._update_client_profile_fixture(variables)
        self.assertIsNone(updated_response.get("errors"))

    def test_validate_user_name_cleared(self) -> None:
        variables = {
            "id": self.client_profile_1["id"],
            "nickname": None,
            "user": {
                "id": self.client_profile_1["user"]["id"],
                "firstName": "",
                "lastName": "",
                "middleName": "",
            },
        }
        response = self._update_client_profile_fixture(variables)
        validation_errors = response["errors"][0]
        error_messages = validation_errors["extensions"]["errors"]

        self.assertEqual(len(error_messages), 1)
        self.assertEqual(error_messages[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

    @parametrize(
        "california_id, expected_california_id, expected_error_code",
        [
            ("L1234567", "L1234567", ErrorMessageEnum.CA_ID_IN_USE.name),
            ("l1234567", "L1234567", ErrorMessageEnum.CA_ID_IN_USE.name),
            ("L123456", "L123456", ErrorMessageEnum.INVALID_CA_ID.name),
            ("l1357246", "L1357246", None),
            ("", None, None),
            (None, None, None),
        ],
    )
    def test_validate_california_id(
        self,
        california_id: Optional[str],
        expected_california_id: Optional[str],
        expected_error_code: Optional[ErrorMessageEnum],
    ) -> None:
        returned_ca_id, returned_error = validate_california_id(california_id)

        self.assertEqual(returned_ca_id, expected_california_id)
        if expected_error_code:
            self.assertEqual(returned_error[0]["errorCode"], expected_error_code)

    @parametrize(
        "phone_number, expected_phone_number, expected_error_code",
        [
            ("2125551212", "2125551212", None),
            ("212555121", None, ErrorMessageEnum.INVALID_PHONE_NUMBER.name),
            ("2005551212", None, ErrorMessageEnum.INVALID_PHONE_NUMBER.name),
            # ("", None, None),
            # (None, None, None),
        ],
    )
    def test_validate_phone_numbers(
        self, phone_number: str, expected_phone_number: Optional[str], expected_error_code: Optional[ErrorMessageEnum]
    ) -> None:
        pass
        # with self.assertRaises(phonenumber_field.validators.ValidationError):
        #     phonenumber_field.validators.validate_international_phonenumber(phone_number)

    def test_validate_hmis_profiles(self) -> None:
        pass

    def test_validate_contacts(self) -> None:
        pass
