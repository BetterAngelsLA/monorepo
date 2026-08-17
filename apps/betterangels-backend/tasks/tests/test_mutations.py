from unittest.mock import ANY

import time_machine
from accounts.role_manager import OrgRoleManager
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
from hmis.models import HmisNote
from model_bakery import baker
from notes.groups import CASEWORKER
from notes.models import Note
from tasks.enums import TaskStatusEnum
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin
from teams.models import Team


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

        expected_query_count = 23
        with self.assertNumQueriesWithoutCache(expected_query_count):
            wdi_team = Team.objects.get(name="WDI On-site", organization=self.org_1)
            variables = {
                "clientProfile": str(client_profile.pk),
                "description": "task description",
                "note": str(self.note.pk),
                "summary": "task summary",
                "teamId": str(wdi_team.pk),
            }

            self.graphql_client.force_login(self.org_1_case_manager_1)
            response = self.create_task_fixture(variables)

        created_task = response["data"]["createTask"]
        expected_task = {
            "description": variables["description"],
            "summary": variables["summary"],
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
            "teamId": str(Team.objects.get(name="WDI On-site", organization=self.org_1).pk),
        }

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.update_task_fixture(variables)

        updated_task = response["data"]["updateTask"]
        expected_task = {
            "description": variables["description"],
            "status": variables["status"],
            "summary": variables["summary"],
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
        wdi_team = Team.objects.get(name="WDI On-site", organization=self.org_1)
        task_id = self.create_task_fixture({"summary": "task summary", "teamId": str(wdi_team.pk)})["data"][
            "createTask"
        ]["id"]

        response = self.update_task_fixture({"id": task_id, "summary": "updated summary"})

        self.assertIsNotNone(response["data"]["updateTask"])
        self.assertEqual(Task.objects.get(pk=task_id).team_id, wdi_team.pk)

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


@ignore_warnings(category=UserWarning)
class TaskOrgScopingMutationTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    """Tasks must be created, updated, and deleted in the active (header) organization."""

    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.org_1_team = Team.objects.get(name="WDI On-site", organization=self.org_1)
        self.task_id = self.create_task_fixture(
            {
                "summary": "Org 1 task to amend",
                "teamId": str(self.org_1_team.pk),
            }
        )["data"]["createTask"]["id"]

    def test_create_task_uses_active_org_not_first_match(self) -> None:
        # The user is a caseworker in both org_1 and org_2.  First-match org
        # resolution would pick org_1; the active header org must win.
        self.org_2.add_user(self.org_1_case_manager_1)
        OrgRoleManager(self.org_2).add_roles(self.org_1_case_manager_1, CASEWORKER)
        self._set_active_org(self.org_2)

        response = self.create_task_fixture({"summary": "Org 2 task"})

        task_id = response["data"]["createTask"]["id"]
        self.assertEqual(Task.objects.get(pk=task_id).organization_id, self.org_2.pk)

    def test_create_task_rejects_cross_org_team(self) -> None:
        org_2_team = Team.objects.get(name="WDI On-site", organization=self.org_2)

        response = self.create_task_fixture(
            {
                "summary": "Org 1 task",
                "teamId": str(org_2_team.pk),
            }
        )

        messages = response["data"]["createTask"]["messages"]
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(
            messages[0]["message"],
            f"Team with id {org_2_team.pk} does not exist in organization {self.org_1.pk}.",
        )
        self.assertEqual(Task.objects.filter(summary="Org 1 task").count(), 0)

    def test_update_task_rejects_cross_org_team(self) -> None:
        org_2_team = Team.objects.get(name="WDI On-site", organization=self.org_2)

        response = self.update_task_fixture(
            {
                "id": self.task_id,
                "teamId": str(org_2_team.pk),
            }
        )

        messages = response["data"]["updateTask"]["messages"]
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(
            messages[0]["message"],
            f"Team with id {org_2_team.pk} does not exist in organization {self.org_1.pk}.",
        )
        self.assertEqual(Task.objects.get(pk=self.task_id).team_id, self.org_1_team.pk)

    def test_update_task_preserves_team_when_team_id_omitted(self) -> None:
        response = self.update_task_fixture({"id": self.task_id, "summary": "Amended summary"})

        self.assertIsNotNone(response["data"]["updateTask"]["id"])

        task = Task.objects.get(pk=self.task_id)
        self.assertEqual(task.summary, "Amended summary")
        self.assertEqual(task.team_id, self.org_1_team.pk)

    def test_update_task_clears_the_team_when_team_id_is_null(self) -> None:
        """Explicit null clears; distinct from omitting the field."""
        response = self.update_task_fixture({"id": self.task_id, "teamId": None})

        self.assertIsNotNone(response["data"]["updateTask"]["id"])
        self.assertIsNone(Task.objects.get(pk=self.task_id).team_id)

    def test_update_task_can_set_a_team_again_after_clearing(self) -> None:
        self.update_task_fixture({"id": self.task_id, "teamId": None})

        self.update_task_fixture({"id": self.task_id, "teamId": str(self.org_1_team.pk)})

        self.assertEqual(Task.objects.get(pk=self.task_id).team_id, self.org_1_team.pk)

    def test_update_task_denied_when_active_org_differs(self) -> None:
        # org_1_case_manager_1 is not a member of org_2.
        self._set_active_org(self.org_2)

        response = self.update_task_fixture({"id": self.task_id, "summary": "Should not update"})

        self.assertGraphQLOperationInfo(
            response,
            "updateTask",
            "You do not have permission to update this task.",
            kind="PERMISSION",
        )
        self.assertNotEqual(Task.objects.get(pk=self.task_id).summary, "Should not update")

    def test_delete_task_denied_when_active_org_differs(self) -> None:
        # org_1_case_manager_1 is not a member of org_2.
        self._set_active_org(self.org_2)

        response = self.delete_task_fixture(self.task_id)

        self.assertGraphQLOperationInfo(
            response,
            "deleteTask",
            "You do not have permission to delete this task.",
            kind="PERMISSION",
        )
        self.assertTrue(Task.objects.filter(pk=self.task_id).exists())
