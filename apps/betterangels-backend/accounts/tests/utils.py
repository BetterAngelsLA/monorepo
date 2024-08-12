from typing import Any, Dict

from accounts.enums import (
    GenderEnum,
    HmisAgencyEnum,
    LanguageEnum,
    PronounEnum,
    RelationshipTypeEnum,
    YesNoPreferNotToSayEnum,
)
from accounts.models import HmisProfile
from common.tests.utils import GraphQLBaseTestCase
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from model_bakery import baker


class ClientProfileGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.EXPECTED_CLIENT_AGE = 20
        self.date_of_birth = timezone.now().date() - relativedelta(years=self.EXPECTED_CLIENT_AGE)
        self.client_profile_fields = """
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
            spokenLanguages
            veteranStatus
            contacts {
                id
                name
                email
                phoneNumber
                mailingAddress
                relationshipToClient
                relationshipToClientOther
            }
            hmisProfiles {
                id
                hmisId
                agency
            }
            user {
                id
                firstName
                lastName
                middleName
                email
            }
            householdMembers {
                id
                name
                dateOfBirth
                gender
                relationshipToClient
                relationshipToClientOther
            }
        """

        self._setup_clients()

    def _setup_clients(self) -> None:
        # Force login the case manager to create clients
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.client_profile_1_user = {
            "firstName": "Todd",
            "lastName": "Chavez",
            "middleName": "Gustav",
            "email": "todd@pblivin.com",
        }
        self.client_profile_2_user = {
            "firstName": "Mister",
            "lastName": "Peanutbutter",
            "middleName": "Tee",
            "email": "mister@pblivin.com",
        }
        self.client_profile_1_contact_1 = {
            "name": "Jerry",
            "email": "jerry@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "bestie",
        }
        self.client_profile_1_contact_2 = {
            "name": "Gary",
            "email": "gary@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        self.client_1_contacts = [
            self.client_profile_1_contact_1,
            self.client_profile_1_contact_2,
        ]
        self.client_profile_1_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        self.client_profile_1_household_member_2 = {
            "name": "Tulips",
            "dateOfBirth": "1901-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        self.client_1_household_members = [
            self.client_profile_1_household_member_1,
            self.client_profile_1_household_member_2,
        ]
        self.client_profile_1 = self._create_client_profile_fixture(
            {
                "user": self.client_profile_1_user,
                "address": "1475 Luck Hoof Ave, Los Angeles, CA 90046",
                "dateOfBirth": self.date_of_birth,
                "gender": GenderEnum.MALE.name,
                "hmisId": "HMISidLAHSA1",
                "nickname": "Toad",
                "phoneNumber": "2125551212",
                "preferredLanguage": LanguageEnum.ENGLISH.name,
                "pronouns": PronounEnum.HE_HIM_HIS.name,
                "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
                "veteranStatus": YesNoPreferNotToSayEnum.NO.name,
                "contacts": self.client_1_contacts,
                "householdMembers": self.client_1_household_members,
            }
        )["data"]["createClientProfile"]
        self.client_profile_2 = self._create_client_profile_fixture(
            {
                "user": self.client_profile_2_user,
                "address": None,
                "dateOfBirth": None,
                "gender": None,
                "hmisId": "HMISidPASADENA1",
                "nickname": None,
                "phoneNumber": None,
                "preferredLanguage": None,
                "pronouns": None,
                "spokenLanguages": [],
                "veteranStatus": None,
            }
        )["data"]["createClientProfile"]
        self.client_profile_1_hmis_profile_1 = baker.make(
            HmisProfile,
            client_profile_id=self.client_profile_1["id"],
            hmis_id="HMISidLAHSA1",
            agency=HmisAgencyEnum.LAHSA,
        )
        self.client_profile_1_hmis_profile_2 = baker.make(
            HmisProfile,
            client_profile_id=self.client_profile_1["id"],
            hmis_id="HMISidPASADENA1",
            agency=HmisAgencyEnum.PASADENA,
        )
        self.client_profile_2_hmis_profile = baker.make(
            HmisProfile,
            client_profile_id=self.client_profile_2["id"],
            hmis_id="HMISidPASADENA2",
            agency=HmisAgencyEnum.PASADENA,
        )

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
                        {self.client_profile_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
