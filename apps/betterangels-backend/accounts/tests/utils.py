from typing import Any, Dict

from accounts.enums import GenderEnum, LanguageEnum, YesNoPreferNotToSayEnum
from common.tests.utils import GraphQLBaseTestCase
from dateutil.relativedelta import relativedelta
from django.utils import timezone


class ClientProfileGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.EXPECTED_CLIENT_AGE = 20
        self.date_of_birth = timezone.now().date() - relativedelta(years=self.EXPECTED_CLIENT_AGE)
        self._setup_clients()

    def _setup_clients(self) -> None:
        # Force login the case manager to create clients
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.client_profile_1_user = {
            "firstName": "Todd",
            "lastName": "Chavez",
            "email": "todd@pblivin.com",
        }
        self.client_profile_2_user = {
            "firstName": "Mister",
            "lastName": "Peanutbutter",
            "email": "mister@pblivin.com",
        }

        self.client_profile_1 = self._create_client_profile_fixture(
            {
                "user": self.client_profile_1_user,
                "address": "1475 Luck Hoof Ave, Los Angeles, CA 90046",
                "dateOfBirth": self.date_of_birth,
                "gender": GenderEnum.MALE.name,
                "hmisId": "A1B2C3",
                "nickname": "Toad",
                "phoneNumber": "2125551212",
                "preferredLanguage": LanguageEnum.ENGLISH.name,
                "pronouns": "he/him",
                "socialSecurityNumber": "123456789",
                "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
                "veteranStatus": YesNoPreferNotToSayEnum.NO.name,
            }
        )["data"]["createClientProfile"]

        self.client_profile_2 = self._create_client_profile_fixture(
            {
                "user": self.client_profile_2_user,
                "address": None,
                "dateOfBirth": None,
                "gender": None,
                "hmisId": "A1B3C4",
                "nickname": None,
                "phoneNumber": None,
                "preferredLanguage": None,
                "pronouns": None,
                "socialSecurityNumber": None,
                "spokenLanguages": [],
                "veteranStatus": None,
            }
        )["data"]["createClientProfile"]
        # Logout after setting up the clients
        self.graphql_client.logout()

    def _create_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_profile_fixture("create", variables)

    def _update_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_profile_fixture("update", variables)

    def _create_or_update_client_profile_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}ClientProfile($data: {operation.capitalize()}ClientProfileInput!) {{ # noqa: B950
                {operation}ClientProfile(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on ClientProfileType {{
                        id
                        address
                        age
                        dateOfBirth
                        gender
                        hmisId
                        nickname
                        phoneNumber
                        preferredLanguage
                        pronouns
                        socialSecurityNumber
                        spokenLanguages
                        veteranStatus
                        user {{
                            id
                            firstName
                            lastName
                            email
                        }}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
