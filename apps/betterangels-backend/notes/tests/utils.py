from typing import Any, Dict

from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from notes.models import OrganizationService, ServiceRequest
from test_utils.mixins import HasGraphQLProtocol


class NoteGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.note_fields = """
            id
            clientProfile {
                id
            }
            createdBy {
                id
            }
            interactedAt
            isSubmitted
            privateDetails
            publicDetails
            purpose
            tasks {
                id
                summary
            }
            team
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
                service {
                    id
                    label
                }
                dueBy
                status
            }
            requestedServices {
                id
                service {
                    id
                    label
                }
                dueBy
                status
            }
        """

        self.client_profile_1 = baker.make(ClientProfile, first_name="Dale", last_name="Cooper")
        self.client_profile_2 = baker.make(ClientProfile, first_name="Harry", last_name="Truman")
        self._setup_note()
        self._setup_location()

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.note = self._create_note_fixture(
            {
                "purpose": f"Session with {self.client_profile_1.full_name}",
                "publicDetails": f"{self.client_profile_1.full_name}'s public details",
                "clientProfile": self.client_profile_1.pk,
            },
        )["data"]["createNote"]
        # Logout after setting up the note
        self.graphql_client.logout()

    def _create_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_note_fixture("create", variables)

    def _update_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_note_fixture("update", variables)

    def _create_or_update_note_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."
        mutation: str = f"""
            mutation {operation.capitalize()}Note($data: {operation.capitalize()}NoteInput!) {{ # noqa: B950
                {operation}Note(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on NoteType {{
                        {self.note_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _revert_note_fixture(self, variables: Dict[str, Any], note_fields: str) -> Dict[str, Any]:
        mutation = f"""
            mutation RevertNote($data: RevertNoteInput!) {{
                revertNote(data: $data) {{
                    ... on NoteType {{
                        {note_fields}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _update_note_location_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation UpdateNoteLocation($data: UpdateNoteLocationInput!) {
                updateNoteLocation(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
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

    def _create_note_mood_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation CreateNoteMood($data: CreateNoteMoodInput!) {
                createNoteMood(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on MoodType {
                        id
                        descriptor
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _delete_mood_fixture(self, mood_id: int) -> Dict[str, Any]:
        mutation: str = """
            mutation DeleteMood($id: ID!) {
                deleteMood(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"id": mood_id})

    def _create_note_service_request_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation CreateNoteServiceRequest($data: CreateNoteServiceRequestInput!) {
                createNoteServiceRequest(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ServiceRequestType {
                        id
                        service {
                            id
                            label
                        }
                        status
                        dueBy
                        completedOn
                        clientProfile {
                            id
                        }
                        createdBy {
                            id
                        }
                        createdAt
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _remove_note_service_request_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation RemoveNoteServiceRequest($data: RemoveNoteServiceRequestInput!) {
                removeNoteServiceRequest(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                        requestedServices {
                            id
                        }
                        providedServices {
                            id
                        }
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _delete_service_request_fixture(self, service_request_id: int) -> Dict[str, Any]:
        mutation: str = """
            mutation DeleteServiceRequest($id: ID!) {
                deleteServiceRequest(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        return self.execute_graphql(mutation, {"id": service_request_id})


class ServiceRequestGraphQLUtilMixin(HasGraphQLProtocol):
    def _create_service_request_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_service_request_fixture("create", variables)

    def _update_service_request_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_service_request_fixture("update", variables)

    def _create_or_update_service_request_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."

        mutation: str = f"""
            mutation {operation.capitalize()}ServiceRequest($data: {operation.capitalize()}ServiceRequestInput!) {{ # noqa: B950
                {operation}ServiceRequest(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on ServiceRequestType {{
                        id
                        service
                        status
                        dueBy
                        completedOn
                        createdBy {{
                            id
                        }}
                        createdAt
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})


class ServiceRequestGraphQLBaseTestCase(GraphQLBaseTestCase, ServiceRequestGraphQLUtilMixin):
    def setUp(self) -> None:
        super().setUp()

        self.client_profile_1 = baker.make(ClientProfile)
        self.client_profile_2 = baker.make(ClientProfile)
        self._setup_service_request()

    def _setup_service_request(self) -> None:
        # Force login the case manager to create a service_request
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.service_request: Dict[str, Any] = self._create_service_request_fixture(
            {
                "service": "BLANKET",
                "status": "TO_DO",
            },
        )["data"]["createServiceRequest"]
        # Logout after setting up the service request
        self.graphql_client.logout()
