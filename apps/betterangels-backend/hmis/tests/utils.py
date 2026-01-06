from typing import Any, Dict

from accounts.models import Group
from common.tests.utils import GraphQLBaseTestCase
from hmis.models import User
from model_bakery import baker


class HmisClientProfileBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        hmis_group = Group.objects.get(name="Hmis User")
        self.hmis_user = baker.make(User)
        self.hmis_user.groups.add(hmis_group)

        self.hmis_client_profile_fields = """
            id
            hmisId
            personalId
            uniqueIdentifier
            addedDate
            lastUpdated

            alias
            birthDate
            dobQuality
            firstName
            lastName
            nameQuality
            ssn1
            ssn2
            ssn3
            ssnQuality

            age
            gender
            genderIdentityText
            nameMiddle
            nameSuffix
            raceEthnicity
            additionalRaceEthnicityDetail
            veteran

            adaAccommodation
            address
            californiaId
            email
            eyeColor
            hairColor
            heightInInches
            importantNotes
            livingSituation
            mailingAddress
            maritalStatus
            phoneNumbers { id number isPrimary }
            physicalDescription
            placeOfBirth
            preferredCommunication
            preferredLanguage
            profilePhoto { name }
            pronouns
            pronounsOther
            residenceAddress
            residenceGeolocation
            spokenLanguages

            createdBy { id }
        """

    def _create_hmis_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_client_profile_fixture("create", variables)

    def _update_hmis_client_profile_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_client_profile_fixture("update", variables)

    def _create_or_update_hmis_client_profile_fixture(
        self, operation: str, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation ($data: {operation.capitalize()}HmisClientProfileInput!) {{ # noqa: B950
                {operation}HmisClientProfile(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on HmisClientProfileType {{
                        {self.hmis_client_profile_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})


class HmisNoteBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        hmis_group = Group.objects.get(name="Hmis User")
        self.hmis_user = baker.make(User)
        self.hmis_user.groups.add(hmis_group)

        self.hmis_note_fields = """
            id
            hmisId
            hmisClientProfile {
                id
                hmisId
                firstName
                lastName
            }

            addedDate
            lastUpdated

            title
            note
            date
            refClientProgram

            location {
                id
                address {
                    street
                    city
                    state
                    zipCode
                }
                point
                pointOfInterest
            }

            providedServices {
                id
                service { id label }
            }
            requestedServices {
                id
                service { id label }
            }
            clientProgram {
                id
                program { id name }
            }

            createdBy { id }
        """

    def _create_hmis_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_note_fixture("create", variables)

    def _update_hmis_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_hmis_note_fixture("update", variables)

    def _create_or_update_hmis_note_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in {"create", "update"}, "Invalid operation specified."
        mutation: str = f"""
            mutation ($data: {operation.capitalize()}HmisNoteInput!) {{ # noqa: B950
                {operation}HmisNote(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on HmisNoteType {{
                        {self.hmis_note_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _create_hmis_note_service_request_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation CreateHmisNoteServiceRequest($data: CreateHmisNoteServiceRequestInput!) {
                createHmisNoteServiceRequest(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ServiceRequestType {
                        id
                        service { id label }
                        status
                        dueBy
                        completedOn
                        clientProfile { id }
                        createdBy { id }
                        createdAt
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _remove_hmis_note_service_request_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation RemoveHmisNoteServiceRequest($data: RemoveHmisNoteServiceRequestInput!) {
                removeHmisNoteServiceRequest(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on HmisNoteType {
                        id
                        requestedServices { id }
                        providedServices { id }
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _update_hmis_note_location_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation UpdateHmisNoteLocation($data: UpdateHmisNoteLocationInput!) {
                updateHmisNoteLocation(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on HmisNoteType {
                        id
                        location {
                            id
                            address {
                                street
                                city
                                state
                                zipCode
                            }
                            point
                            pointOfInterest
                        }
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})
