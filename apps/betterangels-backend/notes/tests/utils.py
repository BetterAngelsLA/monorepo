from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class NoteGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.users = baker.make(User, _quantity=2)
        self.case_manager = self.users[0]
        self.note_client = self.users[1]
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
            mutation CreateNote(
                $title: String!, $publicDetails: String!,
                $client: UserInput,
            ) {
                createNote(data: {
                    title: $title, publicDetails: $publicDetails,
                    client: $client,
                }) {
                    id
                    title
                    publicDetails
                    moods {
                        title
                    }
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                }
            }
        """

        return self.execute_graphql(mutation, default_variables)

    def _update_note_fixture(self, variables: dict) -> dict:
        mutation = """
            mutation UpdateNote(
                $id: ID!, $title: String!, $publicDetails: String!,
                $moods: [CreateMoodInput!], $isSubmitted: Boolean!
            ) {
                updateNote(data: {
                    id: $id, title: $title, publicDetails: $publicDetails,
                    moods: $moods, isSubmitted: $isSubmitted
                }) {
                    id
                    title
                    publicDetails
                    moods {
                        title
                    }
                    client {
                        id
                    }
                    createdBy {
                        id
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
