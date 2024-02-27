import uuid
from typing import Any, Dict, Optional

from accounts.models import User
from accounts.tests.baker_recipes import permission_group_recipe
from django.contrib.auth.models import Group
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from notes.permissions import NotePermissions
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class TaskGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_task()

    def _setup_users(self) -> None:
        self.user_labels = [
            "case_manager_1",
            "case_manager_2",
            "note_client_1",
            "note_client_2",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}")
            for user_label in self.user_labels
        }

        self.case_manager_1 = self.user_map["case_manager_1"]
        self.case_manager_2 = self.user_map["case_manager_2"]
        self.note_client_1 = self.user_map["note_client_1"]
        self.note_client_2 = self.user_map["note_client_2"]

    def _setup_task(self) -> None:
        # Force login the case manager to create a task
        self.graphql_client.force_login(self.case_manager_1)
        self.task: Dict[str, Any] = self._create_task_fixture(
            {
                "title": f"{self.case_manager_1.id}'s test task",
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
                        dueDate
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


class NoteGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_groups_and_permissions()
        self._setup_note()

    def _setup_users(self) -> None:
        self.user_labels = [
            "case_manager_1",
            "case_manager_2",
            "note_client_1",
            "note_client_2",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}")
            for user_label in self.user_labels
        }

        self.case_manager_1 = self.user_map["case_manager_1"]
        self.case_manager_2 = self.user_map["case_manager_2"]
        self.note_client_1 = self.user_map["note_client_1"]
        self.note_client_2 = self.user_map["note_client_2"]

    def _setup_groups_and_permissions(self) -> None:
        # Create a group and assign note permissions
        caseworker_group: Group = baker.make(Group)
        assign_perm(NotePermissions.VIEW.value, caseworker_group)
        assign_perm(NotePermissions.ADD.value, caseworker_group)

        # Create a permission group and add the case manager to it
        perm_group = permission_group_recipe.make()
        perm_group.organization.add_user(self.case_manager_1)
        self.case_manager_1.groups.add(perm_group.group)

        # Add the caseworker group to the case manager as well
        self.case_manager_1.groups.add(caseworker_group)

        # Create Another Org
        perm_group_2 = permission_group_recipe.make()
        perm_group_2.organization.add_user(self.case_manager_2)
        self.case_manager_2.groups.add(perm_group_2.group)
        self.case_manager_2.groups.add(caseworker_group)

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.case_manager_1)
        self.note: Dict[str, Any] = self._create_note_fixture(
            {
                "title": f"User: {self.case_manager_1.id}",
                "publicDetails": f"{self.case_manager_1.id}'s note",
                "client": {"id": self.note_client_1.id},
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
                        timestamp
                        publicDetails
                        privateDetails
                        moods {{
                            descriptor
                        }}
                        providedServices {{
                            descriptor
                            customDescriptor
                        }}
                        requestedServices {{
                            descriptor
                            customDescriptor
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
