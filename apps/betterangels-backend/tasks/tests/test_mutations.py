from unittest.mock import ANY

import time_machine
from clients.models import ClientProfile
from common.enums import SelahTeamEnum
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
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

    @time_machine.travel("07-31-2025 10:11:12", tick=False)
    def test_create_task_mutation(self) -> None:
        client_profile = baker.make(ClientProfile)
        assert self.org

        expected_query_count = 31
        with self.assertNumQueriesWithoutCache(expected_query_count):
            variables = {
                "clientProfile": str(client_profile.pk),
                "description": "task description",
                "note": str(self.note.pk),
                "summary": "task summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }

            self.graphql_client.force_login(self.org_1_case_manager_1)
            response = self.create_task_fixture(variables)

        created_task = response["data"]["createTask"]
        expected_task = {
            **variables,
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
            "team": SelahTeamEnum.WDI_ON_SITE.name,
        }

        expected_query_count = 14
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.update_task_fixture(variables)

        updated_task = response["data"]["updateTask"]
        expected_task = {
            **variables,
            "id": ANY,
            "clientProfile": None,
            "createdAt": "2025-07-31T10:11:12+00:00",
            "createdBy": {
                "id": str(self.org_1_case_manager_1.pk),
                "firstName": self.org_1_case_manager_1.first_name,
                "lastName": self.org_1_case_manager_1.last_name,
            },
            "note": None,
            "organization": {
                "id": str(self.org.pk),
                "name": self.org.name,
            },
            "updatedAt": "2025-07-31T10:11:12+00:00",
        }
        self.assertEqual(updated_task, expected_task)

    def test_delete_task_mutation(self) -> None:
        task_id = self.create_task_fixture({"summary": "task summary"})["data"]["createTask"]["id"]

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.delete_task_fixture(task_id)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=task_id)
            Task.objects.get(id=task_id)
