from typing import Any, Dict

from clients.enums import (
    AdaAccommodationEnum,
    ClientDocumentNamespaceEnum,
    EyeColorEnum,
    GenderEnum,
    HairColorEnum,
    HmisAgencyEnum,
    LanguageEnum,
    LivingSituationEnum,
    MaritalStatusEnum,
    PreferredCommunicationEnum,
    PronounEnum,
    RaceEnum,
    RelationshipTypeEnum,
    SocialMediaEnum,
    VeteranStatusEnum,
)
from common.tests.utils import GraphQLBaseTestCase
from dateutil.relativedelta import relativedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone


# TODO: This is a temporary solution while we refactor the client profile and tests.
# This class will be removed once ClientProfileGraphQLBaseTestCase is slimmed down.
class ClientsBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.client_profile_fields = """
            id
            adaAccommodation
            address
            age
            californiaId
            dateOfBirth
            email
            eyeColor
            firstName
            gender
            genderOther
            hairColor
            heightInInches
            importantNotes
            lastName
            livingSituation
            mailingAddress
            maritalStatus
            middleName
            nickname
            phoneNumber
            physicalDescription
            placeOfBirth
            preferredCommunication
            preferredLanguage
            pronouns
            pronounsOther
            race
            residenceAddress
            spokenLanguages
            veteranStatus
            displayCaseManager
            displayGender
            displayPronouns
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
            householdMembers {
                id
                name
                dateOfBirth
                displayGender
                gender
                genderOther
                relationshipToClient
                relationshipToClientOther
            }
            phoneNumbers {
                id
                number
                isPrimary
            }
            profilePhoto {
                name
            }
            socialMediaProfiles {
                id
                platform
                platformUserId
            }
        """

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


class ClientProfileGraphQLBaseTestCase(ClientsBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.EXPECTED_CLIENT_AGE = 20
        self.date_of_birth = timezone.now().date() - relativedelta(years=self.EXPECTED_CLIENT_AGE)
        # Order of fields: id -> direct fields and model properties -> display fields -> related fields

        # Force login the case manager to create client fixtures
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._setup_clients()
        self._setup_client_documents()
        # Logout after setting up client fixtures
        self.graphql_client.logout()

    def _setup_clients(self) -> None:
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
        self.client_profile_2_hmis_profile_1 = {
            "hmisId": "HMISidPASADENA2",
            "agency": HmisAgencyEnum.PASADENA.name,
        }
        self.client_1_hmis_profiles = [
            self.client_profile_1_hmis_profile_1,
            self.client_profile_1_hmis_profile_2,
        ]
        self.client_2_hmis_profiles = [
            self.client_profile_2_hmis_profile_1,
        ]
        self.client_profile_1_household_member_1 = {
            "name": "Daffodil",
            "dateOfBirth": "1900-01-01",
            "gender": GenderEnum.OTHER.name,
            "genderOther": "pangender",
            "relationshipToClient": RelationshipTypeEnum.OTHER.name,
            "relationshipToClientOther": "cartoon friend",
        }
        self.client_profile_1_household_member_2 = {
            "name": "Tulip",
            "dateOfBirth": "1901-01-01",
            "gender": GenderEnum.NON_BINARY.name,
            "genderOther": None,
            "relationshipToClient": RelationshipTypeEnum.FRIEND.name,
            "relationshipToClientOther": None,
        }
        self.client_1_household_members = [
            self.client_profile_1_household_member_1,
            self.client_profile_1_household_member_2,
        ]
        self.client_1_phone_number_1 = {
            "number": "2125551212",
            "isPrimary": True,
        }
        self.client_1_phone_number_2 = {
            "number": "7185551212",
        }
        self.client_2_phone_number_1 = {
            "number": "3475551212",
            "isPrimary": True,
        }
        self.client_profile_1_phone_numbers = [self.client_1_phone_number_1, self.client_1_phone_number_2]

        self.client_1_social_media_profile_1 = {
            "platform": SocialMediaEnum.INSTAGRAM.name,
            "platformUserId": "toadman",
        }
        self.client_1_social_media_profile_2 = {
            "platform": SocialMediaEnum.TWITTER.name,
            "platformUserId": "birdman",
        }
        self.client_1_social_media_profiles = [
            self.client_1_social_media_profile_1,
            self.client_1_social_media_profile_2,
        ]

        self.client_profile_1 = self._create_client_profile_fixture(
            {
                "adaAccommodation": [AdaAccommodationEnum.HEARING.name],
                "address": "1475 Luck Hoof Ave, Los Angeles, CA 90046",
                "californiaId": "L1234567",
                "contacts": self.client_1_contacts,
                "dateOfBirth": self.date_of_birth,
                "email": "todd@pblivin.com",
                "eyeColor": EyeColorEnum.BROWN.name,
                "firstName": "Todd",
                "gender": GenderEnum.MALE.name,
                "genderOther": None,
                "hairColor": HairColorEnum.BROWN.name,
                "heightInInches": 71.75,
                "hmisProfiles": self.client_1_hmis_profiles,
                "householdMembers": self.client_1_household_members,
                "importantNotes": "I am very important",
                "lastName": "Chavez",
                "livingSituation": LivingSituationEnum.VEHICLE.name,
                "mailingAddress": "1475 Luck Hoof M Ave, Los Angeles, CA 90046",
                "maritalStatus": MaritalStatusEnum.SINGLE.name,
                "middleName": "Gustav",
                "nickname": "Toad",
                "phoneNumber": "2125551212",
                "phoneNumbers": self.client_profile_1_phone_numbers,
                "physicalDescription": "A human",
                "placeOfBirth": "Los Angeles, CA",
                "preferredCommunication": [PreferredCommunicationEnum.CALL.name],
                "preferredLanguage": LanguageEnum.ENGLISH.name,
                "pronouns": PronounEnum.HE_HIM_HIS.name,
                "race": RaceEnum.WHITE_CAUCASIAN.name,
                "residenceAddress": "1475 Luck Hoof R Ave, Los Angeles, CA 90046",
                "socialMediaProfiles": self.client_1_social_media_profiles,
                "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
                "veteranStatus": VeteranStatusEnum.NO.name,
            }
        )["data"]["createClientProfile"]
        self.client_profile_1_photo_name = self._update_client_profile_photo_fixture(self.client_profile_1["id"])[
            "data"
        ]["updateClientProfilePhoto"]["profilePhoto"]["name"]
        self.client_profile_2 = self._create_client_profile_fixture(
            {
                "adaAccommodation": [],
                "address": None,
                "contacts": [],
                "dateOfBirth": None,
                "email": "mister@pblivin.com",
                "eyeColor": None,
                "firstName": "Mister",
                "gender": None,
                "genderOther": None,
                "hairColor": None,
                "heightInInches": None,
                "hmisProfiles": self.client_2_hmis_profiles,
                "householdMembers": [],
                "lastName": "Peanutbutter",
                "livingSituation": None,
                "mailingAddress": None,
                "maritalStatus": None,
                "middleName": "Tee",
                "nickname": None,
                "phoneNumber": None,
                "phoneNumbers": [self.client_2_phone_number_1],
                "physicalDescription": None,
                "placeOfBirth": None,
                "preferredCommunication": [],
                "preferredLanguage": None,
                "pronouns": None,
                "race": None,
                "residenceAddress": None,
                "socialMediaProfiles": [],
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
                        mimeType
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
            mutation DeleteClientDocument($id: ID!) {
                deleteClientDocument(data: { id: $id }) {
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
            variables={"id": document_id},
        )
        return response

    def _update_client_profile_photo_fixture(
        self,
        client_profile_id: str,
        photo_content: bytes = b"test photo content",
        photo_name: str = "test_photo.jpg",
    ) -> Dict[str, Any]:
        photo = SimpleUploadedFile(name=photo_name, content=photo_content)

        return self.execute_graphql(
            """
            mutation UpdateClientProfilePhoto($clientProfileId: ID!, $photo: Upload!) {  # noqa: B950
                updateClientProfilePhoto(data: { clientProfile: $clientProfileId, photo: $photo }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ClientProfileType {
                        id
                        profilePhoto {
                            name
                        }
                    }
                }
            }
            """,
            variables={
                "clientProfileId": client_profile_id,
            },
            files={"photo": photo},
        )


class ClientContactBaseTestCase(ClientsBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.client_contact_fields = """
            id
            email
            mailingAddress
            name
            phoneNumber
            relationshipToClient
            relationshipToClientOther
        """

        self.graphql_client.force_login(self.org_1_case_manager_1)

        # TODO: move client profile setup back to ClientProfileGraphQLBaseTestCase
        # when client profile redesign is completed and tests are refactored
        self.client_profile = self._create_client_profile_fixture({"firstName": "Test Client"})["data"][
            "createClientProfile"
        ]
        self.client_profile_id = self.client_profile["id"]

        self._setup_client_contacts()

    def _setup_client_contacts(self) -> None:
        self.client_contact_1 = self._create_client_contact_fixture(
            {
                "clientProfile": self.client_profile_id,
                "email": "client_contact_1@example.com",
                "mailingAddress": "111 Main Street",
                "name": "Jane Smith",
                "phoneNumber": "2125551212",
                "relationshipToClient": RelationshipTypeEnum.CURRENT_CASE_MANAGER.name,
                "relationshipToClientOther": None,
            }
        )["data"]["createClientContact"]
        self.client_contact_2 = self._create_client_contact_fixture(
            {
                "clientProfile": self.client_profile_id,
                "email": "client_contact_2@example.com",
                "mailingAddress": "222 Main Street",
                "name": "Joe Doe",
                "phoneNumber": "2125552222",
                "relationshipToClient": RelationshipTypeEnum.OTHER.name,
                "relationshipToClientOther": "bff",
            }
        )["data"]["createClientContact"]

    def _create_client_contact_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_contact_fixture("create", variables)

    def _update_client_contact_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_client_contact_fixture("update", variables)

    def _create_or_update_client_contact_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}ClientContact($data: ClientContactInput!) {{ # noqa: B950
                {operation}ClientContact(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on ClientContactType {{
                        {self.client_contact_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})


class HmisProfileBaseTestCase(ClientsBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.hmis_profile_fields = """
            id
            agency
            hmisId
        """

        self.graphql_client.force_login(self.org_1_case_manager_1)

        # TODO: move client profile setup back to ClientProfileGraphQLBaseTestCase
        # when client profile redesign is completed and tests are refactored
        self.client_profile = self._create_client_profile_fixture({"firstName": "Test Client"})["data"][
            "createClientProfile"
        ]
        self.client_profile_id = self.client_profile["id"]

        self._setup_hmis_profiles()

    def _setup_hmis_profiles(self) -> None:
        variables = {
            "agency": HmisAgencyEnum.LAHSA.name,
            "clientProfile": self.client_profile_id,
        }
        self.hmis_profile_1 = self._create_hmis_profile_fixture({**variables, "hmisId": "hmis id 1"})["data"][
            "createHmisProfile"
        ]
        self.hmis_profile_2 = self._create_hmis_profile_fixture({**variables, "hmisId": "hmis id 2"})["data"][
            "createHmisProfile"
        ]

    def _create_hmis_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_profile_fixture("create", variables)

    def _update_hmis_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_profile_fixture("update", variables)

    def _create_or_update_hmis_profile_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}HmisProfile($data: HmisProfileInput!) {{ # noqa: B950
                {operation}HmisProfile(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on HmisProfileType {{
                        {self.hmis_profile_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})
