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
        self.users = baker.make(User, _quantity=2)

        organization_group = baker.make(
            Group,
        )
        assign_perm(NotePermissions.VIEW, organization_group)
        assign_perm(NotePermissions.ADD, organization_group)

        perm_group = permission_group_recipe.make()
        self.users[0].groups.add(perm_group.group)
        self.users[0].groups.add(organization_group)
        perm_group.organization.add_user(self.users[0])

        self.graphql_client.force_login(self.users[0])
        self.note = self._create_note(
            {"title": f"User: {self.users[0].id}", "body": f"{self.users[0].id}'s note"}
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_note(self, variables: dict) -> dict:
        mutation = """
            mutation CreateNote($title: String!, $body: String!) {
                createNote(data: { title: $title, body: $body }) {
                    ... on NoteType {
                        id
                        title
                        body
                    }
                }
            }
        """
        return self.execute_graphql(mutation, variables)

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx != -1:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
