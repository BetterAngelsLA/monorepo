from typing import Any, Dict, Tuple

from accounts.models import User
from accounts.tests.baker_recipes import permission_group_recipe
from django.contrib.auth.models import Group
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from notes.permissions import NotePermissions
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class NoteGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_groups_and_permissions()
        self._setup_note()

    def _setup_users(self) -> None:
        self.users = baker.make(User, _quantity=3)
        self.case_manager, self.note_client, self.case_manager_in_another_org = (
            self.users
        )

    def _setup_groups_and_permissions(self) -> None:
        # Create a group and assign note permissions
        organization_group: Group = baker.make(Group)
        assign_perm(NotePermissions.VIEW.value, organization_group)
        assign_perm(NotePermissions.ADD.value, organization_group)

        # Create a permission group and add the case manager to it
        perm_group = permission_group_recipe.make()
        perm_group.organization.add_user(self.case_manager)
        self.case_manager.groups.add(perm_group.group)

        # Add the organization group to the case manager as well
        self.case_manager.groups.add(organization_group)

        # Create Another Org
        organization_group_2: Group = baker.make(Group)
        assign_perm(NotePermissions.VIEW.value, organization_group_2)
        assign_perm(NotePermissions.ADD.value, organization_group_2)
        perm_group_2 = permission_group_recipe.make()
        perm_group_2.organization.add_user(self.case_manager_in_another_org)
        self.case_manager_in_another_org.groups.add(perm_group_2.group)

    def _setup_note(self) -> None:
        # Force login the case manager to create a note
        self.graphql_client.force_login(self.case_manager)
        self.note: Dict[str, Any] = self._create_note_fixture(
            {
                "title": f"User: {self.case_manager.id}",
                "publicDetails": f"{self.case_manager.id}'s note",
                "client": {"id": self.note_client.id},
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
            mutation {operation.capitalize()}Note($data: {operation.capitalize()}NoteInput!) {{
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

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx >= 0:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
