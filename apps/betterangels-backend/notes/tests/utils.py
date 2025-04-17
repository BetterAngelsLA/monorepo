from typing import Any, Dict

from clients.models import ClientProfile
from common.models import Address, Location
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.gis.geos import Point
from model_bakery import baker
from notes.models import ServiceRequest
from test_utils.mixins import HasGraphQLProtocol


class NoteGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.note_fields = """
            id
            client {
                id
            }
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
            moods {
                descriptor
            }
            purposes {
                id
                title
            }
            nextSteps {
                id
                title
                location {
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
            providedServices {
                id
                service
                serviceOther
                dueBy
                status
            }
            requestedServices {
                id
                service
                serviceOther
                dueBy
                status
            }
        """
        self.client_profile_1 = baker.make(ClientProfile, user=self.client_user_1)
        self.client_profile_2 = baker.make(ClientProfile, user=self.client_user_2)
        self._setup_note()
        self._setup_note_tasks()
        self._setup_location()
        self.provided_services = baker.make(ServiceRequest, _quantity=2)
        self.requested_services = baker.make(ServiceRequest, _quantity=2)

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.note = self._create_note_fixture(
            {
                "purpose": f"Session with {self.client_user_1.full_name}",
                "publicDetails": f"{self.client_user_1.full_name}'s public details",
                "client": self.client_user_1.pk,
                "clientProfile": self.client_profile_1.pk,
            },
        )["data"]["createNote"]
        # Logout after setting up the note
        self.graphql_client.logout()

    def _setup_note_tasks(self) -> None:
        # Force login the case manager to create tasks
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.purpose_1 = self._create_task_for_note_fixture(
            {
                "title": f"Purpose 1 for {self.note['id']}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        self.purpose_2 = self._create_task_for_note_fixture(
            {
                "title": f"Purpose 2 for {self.note['id']}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        self.next_step_1 = self._create_task_for_note_fixture(
            {
                "title": f"Purpose 1 for {self.note['id']}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        self.next_step_2 = self._create_task_for_note_fixture(
            {
                "title": f"Next Step 2 for {self.note['id']}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        # Logout after setting up the tasks
        self.graphql_client.logout()

    def _setup_location(self) -> None:
        self.address = baker.make(
            Address,
            street=self.street,
            city=self.city,
            state=self.state,
            zip_code=self.zip_code,
        )
        self.point = [-118.2437207, 34.0521723]
        self.point_of_interest = "An Interesting Point"
        self.location = baker.make(
            Location,
            address=self.address,
            point=Point(self.point),
            point_of_interest=self.point_of_interest,
        )

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

    def _create_task_for_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        mutation: str = """
            mutation CreateTask($data: CreateTaskInput!) {
                createTask(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on TaskType {
                        id
                        title
                    }
                }
            }
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

    def _add_note_task_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation AddNoteTask($data: AddNoteTaskInput!) {
                addNoteTask(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                        purposes {
                            id
                            title
                        }
                        nextSteps {
                            id
                            title
                        }
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _remove_note_task_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation RemoveNoteTask($data: RemoveNoteTaskInput!) {
                removeNoteTask(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                        purposes {
                            id
                            title
                        }
                        nextSteps {
                            id
                            title
                        }
                    }
                }
            }
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

    def _create_note_task_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation CreateNoteTask($data: CreateNoteTaskInput!) {
                createNoteTask(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on TaskType {
                        id
                        title
                        status
                        dueBy
                        dueByGroup
                        client {
                            id
                        }
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
                        service
                        serviceOther
                        status
                        dueBy
                        completedOn
                        client {
                            id
                        }
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
                        serviceOther
                        status
                        dueBy
                        completedOn
                        client {{
                            id
                        }}
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
        self.client_profile_1 = baker.make(ClientProfile, user=self.client_user_1)
        self.client_profile_2 = baker.make(ClientProfile, user=self.client_user_2)
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


class TaskGraphQLUtilsMixin(HasGraphQLProtocol):
    def _create_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("create", variables)

    def _update_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("update", variables)

    def _create_or_update_task_fixture(self, operation: str, variables: Dict[str, Any]) -> Dict[str, Any]:
        assert operation in ["create", "update"], "Invalid operation specified."

        mutation: str = f"""
            mutation {operation.capitalize()}Task($data: {operation.capitalize()}TaskInput!) {{ # noqa: B950
                {operation}Task(data: $data) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on TaskType {{
                        id
                        title
                        location {{
                            id
                            address {{
                                street
                                city
                                state
                                zipCode
                            }}
                            point
                            pointOfInterest
                        }}
                        status
                        dueBy
                        dueByGroup
                        client {{
                            id
                        }}
                        createdBy {{
                            id
                        }}
                        createdAt
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _delete_task_fixture(self, task_id: int) -> Dict[str, Any]:
        mutation: str = """
            mutation DeleteTask($id: ID!) {
                deleteTask(data: { id: $id }) {
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

        return self.execute_graphql(mutation, {"id": task_id})

    def _update_task_location_fixture(self, variables: Dict) -> Dict[str, Any]:
        mutation: str = """
            mutation UpdateTaskLocation($data: UpdateTaskLocationInput!) {
                updateTaskLocation(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on TaskType {
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


class TaskGraphQLBaseTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self._setup_task()
        self._setup_location()

        self.task_fields = """
            id
            title
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
            status
            dueBy
            dueByGroup
            client {
                id
            }
            createdBy {
                id
            }
            createdAt
        """
        self.client_profile_1 = baker.make(ClientProfile, user=self.client_user_1)
        self.client_profile_2 = baker.make(ClientProfile, user=self.client_user_2)

    def _setup_task(self) -> None:
        # Force login the case manager to create a task
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.task: Dict[str, Any] = self._create_task_fixture(
            {
                "title": f"New task for: {self.org_1_case_manager_1.pk}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        # Logout after setting up the task
        self.graphql_client.logout()

    def _setup_location(self) -> None:
        self.address = baker.make(
            Address,
            street=self.street,
            city=self.city,
            state=self.state,
            zip_code=self.zip_code,
        )
        self.point = [-118.2437207, 34.0521723]
        self.point_of_interest = "An Interesting Point"
        self.location = baker.make(
            Location,
            address=self.address,
            point=Point(self.point),
            point_of_interest=self.point_of_interest,
        )
