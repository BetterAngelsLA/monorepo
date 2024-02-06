from typing import Optional

from accounts.models import User
from django.contrib.gis.geos import Point
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from notes.enums import MoodEnum, TaskStatusEnum
from notes.models import Location, Mood, Note, Task
from notes.permissions import NotePermissions
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class NoteGraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.users = baker.make(User, _quantity=3)
        self.note_client = self.users[2]
        self.graphql_client.force_login(self.users[0])
        self.note = self._create_note(
            {
                "title": f"User: {self.users[0].id}",
                "publicDetails": f"{self.users[0].id}'s note",
            }
        )["data"]["createNote"]
        self.graphql_client.logout()

    def _create_task(self, variables: dict) -> Task:
        default_variables = dict(
            title="Wellness check",
            status=TaskStatusEnum.IN_PROGRESS,
            created_by=self.users[0],
            client=self.note_client,
        )
        if variables:
            default_variables.update(variables)

        return baker.make(Task, **default_variables)

    def _create_note(self, variables: dict) -> dict:
        default_variables = dict(
            title="Test Note",
            publicDetails="This is a test note",
            client={"id": self.note_client.id},
            moods=[],
            parentTasks=[],
            childTasks=[],
        )

        if variables:
            default_variables.update(variables)

        mutation = """
            mutation CreateNote(
                $title: String!, $publicDetails: String!, $moods: [CreateMoodInput!],
                $parentTasks: [LinkTaskInput!], $childTasks: [LinkTaskInput!],
                $client: UserInput,
            ) {
                createNote(data: {
                    title: $title, publicDetails: $publicDetails, moods: $moods,
                    parentTasks: $parentTasks, childTasks: $childTasks,
                    client: $client,
                }) {
                    id
                    title
                    publicDetails
                    moods {
                        title
                    }
                    parentTasks {
                        id
                        title
                        status
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

    def _update_note(self, variables: dict) -> dict:
        mutation = """
            mutation UpdateNote(
                $id: ID!, $title: String!, $publicDetails: String!, $moods: [CreateMoodInput!],
                $parentTasks: [LinkTaskInput!], $childTasks: [LinkTaskInput!],
            ) {
                updateNote(data: {
                    id: $id, title: $title, publicDetails: $publicDetails, moods: $moods,
                    parentTasks: $parentTasks, childTasks: $childTasks
                }) {
                    id
                    title
                    publicDetails
                    moods {
                        title
                    }
                    parentTasks {
                        id
                        title
                        status
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
