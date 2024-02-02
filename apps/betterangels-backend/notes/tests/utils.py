from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class NoteGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.users = baker.make(User, _quantity=2)
        self.graphql_client.force_login(self.users[0])
        self.note = self._create_note(
            {
                "title": f"User: {self.users[0].id}",
                "body2": f"{self.users[0].id}'s note",
            }
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_note(self, variables: dict) -> dict:
        mutation = """
            mutation CreateNote($title: String!, $body2: String!) {
                createNote(data: { title: $title, body2: $body2 }) {
                    id
                    title
                    body2
                }
            }
        """
        return self.execute_graphql(mutation, variables)

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx != -1:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
