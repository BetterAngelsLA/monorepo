from typing import Any, Dict

from accounts.enums import (
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    MaritalStatusEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    YesNoPreferNotToSayEnum,
)
from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from dateutil.relativedelta import relativedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from model_bakery import baker
from organizations.models import OrganizationUser

from .baker_recipes import organization_recipe, permission_group_recipe


class CurrentUserGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.setup_users()

        self.user_fields = """
            id
            firstName
            lastName
            middleName
            email
            hasAcceptedTos
            hasAcceptedPrivacyPolicy
            isOutreachAuthorized
            organizations: organizationsOrganization {
                id
                name
            }
        """

    def setup_users(self) -> None:
        self.user = baker.make(
            User,
            first_name="Dale",
            last_name="Cooper",
            middle_name="Bartholomew",
            email="coop@example.co",
            has_accepted_tos=False,
            has_accepted_privacy_policy=False,
        )
        self.user_organization = organization_recipe.make(name="Twin Peaks Sheriff's Department")
        permission_group_recipe.make(organization=self.user_organization)
        baker.make(OrganizationUser, user=self.user, organization=self.user_organization)

    def _update_current_user_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_current_user_fixture("update", variables)

    def _create_or_update_current_user_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}CurrentUser($data: {operation.capitalize()}UserInput!) {{ # noqa: B950
                {operation}CurrentUser(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on UserType {{
                        {self.user_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})


class ClientProfileGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.EXPECTED_CLIENT_AGE = 20
        self.date_of_birth = timezone.now().date() - relativedelta(years=self.EXPECTED_CLIENT_AGE)
        self.client_profile_fields = """
            id
            address
            age
            placeOfBirth
            dateOfBirth
            displayCaseManager
            displayPronouns
            heightInInches
            eyeColor
            gender
            hairColor
            hmisId
            maritalStatus
            nickname
            race
            phoneNumber
            physicalDescription
            preferredLanguage
            pronouns
            pronounsOther
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

        # Force login the case manager to create client fixtures
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._setup_clients()
        self._setup_client_documents()
        # Logout after setting up client fixtures
        self.graphql_client.logout()

    def _setup_clients(self) -> None:
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
            "relationshipToClient": RelationshipTypeEnum.CURRENT_CASE_MANAGER.name,
            "relationshipToClientOther": None,
        }
        self.client_profile_2_contact_1 = {
            "name": "Harry",
            "email": "hrry@example.co",
            "phoneNumber": "2125551212",
            "mailingAddress": "1235 Main St",
            "relationshipToClient": RelationshipTypeEnum.CURRENT_CASE_MANAGER.name,
            "relationshipToClientOther": None,
        }
        self.client_1_contacts = [
            self.client_profile_1_contact_1,
            self.client_profile_1_contact_2,
        ]
        self.client_profile_1_hmis_profile_1 = {
            "hmisId": "HMISidLAHSA1",
            "agency": HmisAgencyEnum.LAHSA.name,
        }
        self.client_profile_1_hmis_profile_2 = {
            "hmisId": "HMISidPASADENA1",
            "agency": HmisAgencyEnum.PASADENA.name,
        }
        self.client_1_hmis_profiles = [
            self.client_profile_1_hmis_profile_1,
            self.client_profile_1_hmis_profile_2,
        ]
        self.client_profile_1_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.FEMALE.name,
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        self.client_profile_1_household_member_2 = {
            "name": "Tulip",
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
                "placeOfBirth": "Los Angeles, CA",
                "dateOfBirth": self.date_of_birth,
                "eyeColor": EyeColorEnum.BROWN.name,
                "gender": GenderEnum.MALE.name,
                "hairColor": HairColorEnum.BROWN.name,
                "heightInInches": 71.75,
                "hmisId": "HMISidLAHSA1",
                "maritalStatus": MaritalStatusEnum.SINGLE.name,
                "nickname": "Toad",
                "phoneNumber": "2125551212",
                "physicalDescription": "A human",
                "preferredLanguage": LanguageEnum.ENGLISH.name,
                "pronouns": PronounEnum.HE_HIM_HIS.name,
                "race": RaceEnum.WHITE_CAUCASIAN.name,
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
                "placeOfBirth": None,
                "contacts": [self.client_profile_2_contact_1],
                "dateOfBirth": None,
                "eyeColor": None,
                "gender": None,
                "hairColor": None,
                "heightInInches": None,
                "hmisId": "HMISidPASADENA2",
                "maritalStatus": None,
                "nickname": None,
                "phoneNumber": None,
                "physicalDescription": None,
                "preferredLanguage": None,
                "pronouns": None,
                "race": None,
                "spokenLanguages": [],
                "veteranStatus": None,
            }
        )["data"]["createClientProfile"]

    def _setup_client_documents(self) -> None:
        self.client_profile_1_document_1 = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.DRIVERS_LICENSE_FRONT.name,
            b"Client 1 license front",
            "client_profile_1_document_1.txt",
        )["data"]["createClientDocument"]
        self.client_profile_1_document_2 = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.DRIVERS_LICENSE_BACK.name,
            b"Client 1 license back",
            "client_profile_1_document_2.txt",
        )["data"]["createClientDocument"]
        self.client_profile_1_document_3 = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.HMIS_FORM.name,
            b"Client 1 hmis form",
            "client_profile_1_document_3.txt",
        )["data"]["createClientDocument"]
        self.client_profile_1_document_4 = self._create_client_document_fixture(
            self.client_profile_1["id"],
            ClientDocumentNamespaceEnum.OTHER_CLIENT_DOCUMENT.name,
            b"Client 1 other doc",
            "client_profile_1_document_4.txt",
        )["data"]["createClientDocument"]

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

    def _create_client_document_fixture(
        self,
        client_profile_id: str,
        namespace: str,
        file_content: bytes,
        file_name: str = "test_file.txt",
    ) -> Dict[str, Any]:
        file = SimpleUploadedFile(name=file_name, content=file_content)
        response = self.execute_graphql(
            """
            mutation CreateClientDocument($clientProfileId: ID!, $namespace: ClientDocumentNamespaceEnum!, $file: Upload!) {  # noqa: B950
                createClientDocument(data: { clientProfile: $clientProfileId, namespace: $namespace, file: $file }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ClientDocumentType {
                        id
                        attachmentType
                        file {
                            name
                        }
                        originalFilename
                        namespace
                    }
                }
            }
            """,
            variables={
                "clientProfileId": client_profile_id,
                "namespace": namespace,
            },
            files={"file": file},
        )
        return response

    def _delete_client_document_fixture(self, document_id: int) -> Dict[str, Any]:
        response = self.execute_graphql(
            """
            mutation DeleteClientDocument($documentId: ID!) {
                deleteClientDocument(data: { id: $documentId }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ClientDocumentType {
                        id
                    }
                }
            }
            """,
            variables={"documentId": document_id},
        )
        return response
