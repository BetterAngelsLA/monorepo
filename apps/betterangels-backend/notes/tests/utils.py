from typing import Optional

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
        self.usernames = [
            "case_manager_1",
            "case_manager_2",
            "note_client_1",
            "note_client_2",
        ]
        self.user_map: dict[str, User] = {
            username: baker.make(User, email=f"{username}@test.com", username=username)
            for username in self.usernames
        }
        self.case_manager = self.user_map["case_manager_1"]
        self.note_client = self.user_map["note_client_1"]

        organization_group = baker.make(Group)
        assign_perm(NotePermissions.VIEW, organization_group)
        assign_perm(NotePermissions.ADD, organization_group)

        perm_group = permission_group_recipe.make()
        self.case_manager.groups.add(perm_group.group)
        self.case_manager.groups.add(organization_group)
        perm_group.organization.add_user(self.case_manager)

        self.graphql_client.force_login(self.case_manager)
        self.note = self._create_note_fixture(
            {
                "title": f"User: {self.case_manager.id}",
                "publicDetails": f"{self.case_manager.id}'s note",
            }
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_note_fixture(self, variables: dict) -> dict:
        default_variables = dict(
            title="Test Note",
            publicDetails="This is a test note",
            client={"id": self.note_client.id},
        )

        if variables:
            default_variables.update(variables)

        mutation = """
            mutation CreateNote($data: CreateNoteInput!) {
                createNote(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                        client {
                            id
                        }
                        createdBy {
                            id
                        }
                    }
                }
            }
        """

        return self.execute_graphql(mutation, {"data": default_variables})

    def _update_note_fixture(self, variables: dict) -> dict:
        mutation = """
            mutation UpdateNote($data: UpdateNoteInput!) {
                updateNote(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                        client {
                            id
                        }
                        createdBy {
                            id
                        }
                    }
                }
            }
        """

        return self.execute_graphql(mutation, {"data": variables})

    def _handle_user_login(self, username: Optional[str]) -> None:
        if username:
            self.graphql_client.force_login(self.user_map[username])
        else:
            self.graphql_client.logout()
