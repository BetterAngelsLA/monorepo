import uuid
from typing import Any, Dict, Optional

from accounts.models import PermissionGroupTemplate, User
from accounts.tests.baker_recipes import permission_group_recipe
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class GraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_groups_and_permissions()

    def _setup_users(self) -> None:
        self.user_labels = [
            "org_1_case_manager_1",
            "org_1_case_manager_2",
            "org_2_case_manager_1",
            "client_1",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}")
            for user_label in self.user_labels
        }

        self.org_1_case_manager_1 = self.user_map["org_1_case_manager_1"]
        self.org_1_case_manager_2 = self.user_map["org_1_case_manager_2"]
        self.org_2_case_manager_1 = self.user_map["org_2_case_manager_1"]
        self.client_1 = self.user_map["client_1"]

    def _setup_groups_and_permissions(self) -> None:
        caseworker_permission_group_template = PermissionGroupTemplate.objects.get(
            name="Caseworker"
        )
        perm_group = permission_group_recipe.make(
            template=caseworker_permission_group_template
        )
        perm_group.organization.add_user(self.org_1_case_manager_1)
        perm_group.organization.add_user(self.org_1_case_manager_2)

        # Create Another Org
        perm_group_2 = permission_group_recipe.make()
        perm_group_2.organization.add_user(self.org_2_case_manager_1)


class NoteGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_note()

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.note: Dict[str, Any] = self._create_note_fixture(
            {
                "title": f"User: {self.org_1_case_manager_1.id}",
                "publicDetails": f"{self.org_1_case_manager_1.id}'s note",
                "client": {"id": self.client_1.id},
            },
        )["data"]["createNote"]
        # Logout after setting up the note
        self.graphql_client.logout()

    def _create_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_note_fixture("create", variables)

    def _update_note_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_note_fixture("update", variables)

    def _create_or_update_note_fixture(
        self, operation: str, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
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
                        id
                        title
                        publicDetails
                        privateDetails
                        moods {{
                            descriptor
                        }}
                        client {{
                            id
                        }}
                        createdBy {{
                            id
                        }}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _handle_user_login(self, user_label: Optional[str]) -> None:
        if user_label:
            self.graphql_client.force_login(self.user_map[user_label])
        else:
            self.graphql_client.logout()

    def _create_note_attachment_fixture(
        self,
        note_id: str,
        namespace: str,
        file_content: bytes,
        file_name: str = "test_file.txt",
    ) -> Dict[str, Any]:
        file = SimpleUploadedFile(name=file_name, content=file_content)
        response = self.execute_graphql(
            """
            mutation CreateNoteAttachment($noteId: ID!, $namespace: NoteNamespaceEnum!, $file: Upload!) {  # noqa: B950
                createNoteAttachment(data: { note: $noteId, namespace: $namespace, file: $file }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteAttachmentType {
                        id
                        fileType
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
                "noteId": note_id,
                "namespace": namespace,
            },
            files={"file": file},
        )
        return response

    def _delete_note_attachment_fixture(self, attachment_id: str) -> Dict[str, Any]:
        response = self.execute_graphql(
            """
            mutation DeleteNoteAttachment($attachmentId: ID!) {
                deleteNoteAttachment(data: { id: $attachmentId }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteAttachmentType {
                        id
                    }
                }
            }
            """,
            variables={"attachmentId": attachment_id},
        )
        return response


class TaskGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_task()

    def _setup_task(self) -> None:
        # Force login the case manager to create a task
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.task: Dict[str, Any] = self._create_task_fixture(
            {
                "title": f"User: {self.org_1_case_manager_1.id}",
                "status": "TO_DO",
            },
        )["data"]["createTask"]
        # Logout after setting up the task
        self.graphql_client.logout()

    def _create_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("create", variables)

    def _update_task_fixture(self, variables: Dict[str, Any]) -> Dict[str, Any]:
        return self._create_or_update_task_fixture("update", variables)

    def _create_or_update_task_fixture(
        self, operation: str, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
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
                        dueBy
                        status
                        client {{
                            id
                        }}
                        createdAt
                        createdBy {{
                            id
                        }}
                    }}
                }}
            }}
        """
        return self.execute_graphql(mutation, {"data": variables})

    def _handle_user_login(self, user_label: Optional[str]) -> None:
        if user_label:
            self.graphql_client.force_login(self.user_map[user_label])
        else:
            self.graphql_client.logout()
