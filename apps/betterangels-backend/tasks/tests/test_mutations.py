from unittest.mock import ANY

import time_machine
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
from hmis.models import HmisNote
from model_bakery import baker
from notes.models import Note
from tasks.enums import TaskStatusEnum
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin


@ignore_warnings(category=UserWarning)
class TaskMutationTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.org = self.org_1_case_manager_1.organizations_organization.first()
        self.note = baker.make(Note, organization=self.org)
        self.hmis_note = baker.make(HmisNote)

    @time_machine.travel("07-31-2025 10:11:12", tick=False)
    def test_create_task_mutation(self) -> None:
        client_profile = baker.make(ClientProfile)
        assert self.org

        expected_query_count = 22
        with self.assertNumQueriesWithoutCache(expected_query_count):
            variables = {
                "clientProfile": str(client_profile.pk),
                "description": "task description",
                "note": str(self.note.pk),
                "summary": "task summary",
                "teamId": str(self.org_1_team_1.pk),
            }

            self.graphql_client.force_login(self.org_1_case_manager_1)
            response = self.create_task_fixture(variables)

        created_task = response["data"]["createTask"]
        expected_task = {
            # teamId is input-only — the response exposes the team object.
            **{k: v for k, v in variables.items() if k != "teamId"},
            "team": {"id": str(self.org_1_team_1.pk), "name": self.org_1_team_1.name},
            "id": ANY,
            "clientProfile": {
                "id": str(client_profile.pk),
                "firstName": client_profile.first_name,
                "lastName": client_profile.last_name,
            },
            "createdAt": "2025-07-31T10:11:12+00:00",
            "createdBy": {
                "id": str(self.org_1_case_manager_1.pk),
                "firstName": self.org_1_case_manager_1.first_name,
                "lastName": self.org_1_case_manager_1.last_name,
            },
            "hmisNote": None,
            "note": {"pk": str(self.note.pk)},
            "organization": {
                "id": str(self.org.pk),
                "name": self.org.name,
            },
            "status": TaskStatusEnum.TO_DO.name,
            "updatedAt": "2025-07-31T10:11:12+00:00",
        }
        self.assertEqual(created_task, expected_task)
        self.assertTrue(Task.objects.filter(id=created_task["id"]).exists())

    @time_machine.travel("07-31-2025 10:11:12", tick=False)
    def test_update_task_mutation(self) -> None:
        task_id = self.create_task_fixture({"summary": "task summary"})["data"]["createTask"]["id"]
        assert self.org

        variables = {
            "id": task_id,
            "description": "updated task description",
            "status": TaskStatusEnum.IN_PROGRESS.name,
            "summary": "updated task summary",
            "teamId": str(self.org_1_team_1.pk),
        }

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.update_task_fixture(variables)

        updated_task = response["data"]["updateTask"]
        expected_task = {
            # teamId is input-only — the response exposes the team object.
            **{k: v for k, v in variables.items() if k != "teamId"},
            "team": {"id": str(self.org_1_team_1.pk), "name": self.org_1_team_1.name},
            "id": ANY,
            "clientProfile": None,
            "createdAt": "2025-07-31T10:11:12+00:00",
            "createdBy": {
                "id": str(self.org_1_case_manager_1.pk),
                "firstName": self.org_1_case_manager_1.first_name,
                "lastName": self.org_1_case_manager_1.last_name,
            },
            "hmisNote": None,
            "note": None,
            "organization": {
                "id": str(self.org.pk),
                "name": self.org.name,
            },
            "updatedAt": "2025-07-31T10:11:12+00:00",
        }
        self.assertEqual(updated_task, expected_task)

    def test_update_task_omitted_team_id_preserves_team(self) -> None:
        """Regression: an update that never mentions teamId used to clear it."""
        task_id = self.create_task_fixture({"summary": "task summary", "teamId": str(self.org_1_team_1.pk)})["data"][
            "createTask"
        ]["id"]

        response = self.update_task_fixture({"id": task_id, "summary": "updated summary"})

        self.assertIsNotNone(response["data"]["updateTask"])
        self.assertEqual(Task.objects.get(pk=task_id).team_id, self.org_1_team_1.pk)

    def test_update_task_explicit_null_team_id_clears_team(self) -> None:
        """The team picker offers "none", so the mutation has to accept an explicit null.

        A bare ``Maybe[ID]`` rejects one during argument conversion, which failed
        the whole mutation rather than clearing the team.
        """
        task_id = self.create_task_fixture({"summary": "task summary", "teamId": str(self.org_1_team_1.pk)})["data"][
            "createTask"
        ]["id"]

        response = self.update_task_fixture({"id": task_id, "teamId": None})

        self.assertIsNone(response.get("errors"))
        self.assertIsNone(response["data"]["updateTask"]["team"])
        self.assertIsNone(Task.objects.get(pk=task_id).team_id)

    def test_delete_task_mutation(self) -> None:
        task_id = self.create_task_fixture({"summary": "task summary"})["data"]["createTask"]["id"]

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.delete_task_fixture(task_id)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=task_id)
            Task.objects.get(id=task_id)

    @time_machine.travel("07-31-2025 10:11:12", tick=False)
    def test_create_task_mutation_with_hmis_note(self) -> None:
        """
        Verify we can create a task linked specifically to an HMIS Note.
        """
        self._setup_hmis_session()

        variables = {
            "description": "hmis task description",
            "hmisNote": str(self.hmis_note.pk),
            "summary": "hmis task summary",
        }

        response = self.create_task_fixture(variables)
        created_task = response["data"]["createTask"]

        self.assertEqual(created_task["summary"], "hmis task summary")
        self.assertEqual(created_task["description"], "hmis task description")
        self.assertEqual(created_task["status"], TaskStatusEnum.TO_DO.name)
        self.assertEqual(created_task["hmisNote"]["pk"], str(self.hmis_note.pk))

    def test_create_task_fails_when_linking_both_note_types(self) -> None:
        """
        Verify the API raises a ValidationError if we try to link
        both a Regular Note AND an HMIS Note.
        """
        variables = {
            "summary": "Illegal Task",
            "note": str(self.note.pk),
            "hmisNote": str(self.hmis_note.pk),
        }

        response = self.create_task_fixture(variables)

        payload = response["data"]["createTask"]
        self.assertIsNotNone(payload["messages"])
        self.assertTrue(len(payload["messages"]) > 0)
        error_message = payload["messages"][0]["message"]
        self.assertIn("task_single_parent_check", error_message)
        self.assertIn("violates", error_message)
