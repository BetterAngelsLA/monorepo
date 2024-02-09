from accounts.models import PermissionGroup, User
from django.contrib.auth.models import Group
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from model_bakery.random_gen import gen_string
from notes.permissions import NotePermissions
from organizations.models import Organization
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

        org_name = gen_string(max_length=50)
        perm_group: PermissionGroup = baker.make(
            PermissionGroup,
            group=baker.make(Group),
            organization=baker.make(
                Organization,
                name=org_name,
                slug=org_name,
            ),
        )

        self.users[0].groups.add(perm_group.group)
        self.users[0].groups.add(organization_group)

        perm_group.organization.add_user(self.users[0])
        # Create Permission Group for Caseworkers
        # Add Group To User
        self.graphql_client.force_login(self.users[0])
        self.note = self._create_note(
            {"title": f"User: {self.users[0].id}", "body": f"{self.users[0].id}'s note"}
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_note(self, variables: dict) -> dict:
        mutation = """
            mutation CreateNote($title: String!, $body: String!) {
                createNote(data: { title: $title, body: $body }) {
                    id
                    title
                    body
                }
            }
        """
        return self.execute_graphql(mutation, variables)

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx != -1:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
