from typing import Optional

import phonenumber_field
import strawberry
from accounts.models import User
from clients.models import ClientProfile
from clients.schema import (
    validate_california_id,
    validate_user_email,
    validate_user_name,
)
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
            ("TODD@pblivin.com", "todd@pblivin.com", ErrorMessageEnum.EMAIL_IN_USE.name),
            ("TODD@pblivin.net", "todd@pblivin.net", None),
        ],
    )
    def test_validate_user_email(
        self, email: Optional[str], expected_email: None, expected_error_code: Optional[ErrorMessageEnum]
    ) -> None:
        returned_email, returned_error = validate_user_email(email)

        self.assertEqual(returned_email, expected_email)
        if expected_error_code:
            self.assertEqual(returned_error[0]["errorCode"], expected_error_code)

    def test_validate_user_name_create_not_set(self) -> None:
        """Verify that creating a client profile with all name fields unset returns an error.

        This has to be run via graphql query because there's no way to set fields to strawberry.UNSET.
        """
        variables = {"user": {"email": "email@email.email"}}

        response = self._create_client_profile_fixture(variables)

        errors = response["errors"][0]["extensions"]["errors"]
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

    def test_validate_user_name_update_not_set(self) -> None:
        """Verify that updating a client profile with all name fields unset succeeds."""
        user_data = {
            "firstName": strawberry.UNSET,
            "lastName": strawberry.UNSET,
            "middleName": strawberry.UNSET,
        }
        nickname = strawberry.UNSET
        user = User.objects.get(pk=self.client_profile_1["user"]["id"])

        errors = validate_user_name(user_data, nickname, user)
        self.assertEqual(len(errors), 0)

    def test_validate_user_name_create_null(self) -> None:
        """Verify that creating a client profile with all name fields blank or null returns an error."""
        user_data = {
            "firstName": "",
            "lastName": "",
            "middleName": "",
        }
        nickname = None

        errors = validate_user_name(user_data, nickname, None)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

    def test_validate_user_name_update_null(self) -> None:
        """Verify that updating a client profile with all name fields blank or null returns an error."""
        user_data = {
            "firstName": "",
            "lastName": "",
            "middleName": "",
        }
        nickname = None
        user = User.objects.get(pk=self.client_profile_1["user"]["id"])

        errors = validate_user_name(user_data, nickname, user)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["errorCode"], ErrorMessageEnum.NO_NAME_PROVIDED.name)

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
