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
                "publicDetais": f"{self.users[0].id}'s note",
            }
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_note(self, variables: dict) -> dict:
        mutation = """
            mutation CreateNote($title: String!, $publicDetais: String!) {
                createNote(data: { title: $title, publicDetais: $publicDetais }) {
                    id
                    title
                    publicDetais
                }
            }
        """
        return self.execute_graphql(mutation, variables)

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx != -1:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
