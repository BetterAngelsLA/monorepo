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

    def _create_detailed_note(self) -> Note:
        """
        NOTE: this is a temporary helper to figure out models, refactor using GraphQL mutation
        """
        case_manager = self.users[0]
        client = baker.make(User, first_name="Mike")
        mock_point = Point(1.232433, 2.456546)
        location = baker.make(Location, point=mock_point, zip_code=90000)

        note = baker.make(
            Note,
            title="Session W/ Client",
            public_details="Some public details",
            location=location,
        )

        task1 = self._create_task(
            dict(
                title="Wellness check week 1",
                status=TaskStatusEnum.COMPLETED,
                location=location,
                client=client,
                created_by=case_manager,
            )
        )
        task2 = self._create_task(
            dict(
                title="DMV",
                location=location,
                client=client,
                created_by=case_manager,
            )
        )
        task3 = self._create_task(
            dict(
                title="Wellness check week 2",
                location=location,
                client=client,
                created_by=case_manager,
            )
        )

        note.parent_tasks.add(task1, task2)
        note.child_tasks.add(task3)

        mood1 = baker.make(Mood, title=MoodEnum.ANXIOUS.value)
        mood2 = baker.make(Mood, title=MoodEnum.EUTHYMIC.value)
        note.moods.add(mood1, mood2)

        for perm in [
            NotePermissions.VIEW,
            NotePermissions.CHANGE,
            NotePermissions.DELETE,
        ]:
            assign_perm(perm, case_manager, note)

        return note

    def _handle_user_login(self, user_idx: int) -> None:
        if user_idx != -1:
            self.graphql_client.force_login(self.users[user_idx])
        else:
            self.graphql_client.logout()
