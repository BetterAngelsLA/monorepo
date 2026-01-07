from typing import Optional

from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from hmis.models import HmisClientProfile
from model_bakery import baker
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin
from unittest_parametrize import parametrize


class TaskPermissionTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

        self.client_profile = baker.make(ClientProfile)
        self.hmis_client_profile = baker.make(HmisClientProfile)
        self.ba_task_id = self.create_task_fixture(
            {
                "summary": "ba task",
                "clientProfile": str(self.client_profile.pk),
            }
        )["data"]["createTask"]["id"]
        self.hmis_task_id = self.create_task_fixture(
            {
                "summary": "ba task",
                "hmisClientProfile": str(self.hmis_client_profile.pk),
            }
        )["data"]["createTask"]["id"]

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Caseworker should succeed
            ("non_case_manager_user", False),  # Non CW should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_task_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        task_count = Task.objects.count()
        variables = {"summary": "task summary"}
        response = self.create_task_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["createTask"]["id"])
            self.assertEqual(task_count + 1, Task.objects.count())
        else:
            self.assertEqual(task_count, Task.objects.count())
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
            else:
                self.assertEqual(
                    response["data"]["createTask"]["messages"][0],
                    {
                        "kind": "PERMISSION",
                        "field": "createTask",
                        "message": "You don't have permission to access this app.",
                    },
                )

    @parametrize(
        "user_label",
        [
            ("org_1_case_manager_1",),  # Owner
            ("org_1_case_manager_2",),  # Same org
        ],
    )
    def test_update_task_permission_success(self, user_label: str) -> None:
        self._handle_user_login(user_label)

        variables = {
            "id": self.task_id,
            "summary": "updated task summary",
        }
        response = self.update_task_fixture(variables)

        self.assertIsNotNone(response["data"]["updateTask"]["id"])

        updated = Task.objects.get(pk=self.task_id)
        self.assertEqual(updated.summary, "updated task summary")

    @parametrize(
        "user_label",
        [
            ("org_2_case_manager_1",),  # Other org
            (None,),  # Anonymous
        ],
    )
    def test_update_task_permission_denied(self, user_label: Optional[str]) -> None:
        self._handle_user_login(user_label)

        pre_update = Task.objects.get(pk=self.task_id)

        variables = {
            "id": pre_update.pk,
            "summary": "updated task summary",
        }
        response = self.update_task_fixture(variables)
        if user_label is None:
            self.assertGraphQLUnauthenticated(response)

        post_update = Task.objects.get(pk=pre_update.id)

        self.assertEqual(post_update.summary, pre_update.summary)

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", False),  # Other org CM should not succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_delete_task_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        task_count = Task.objects.count()
        response = self.delete_task_fixture(self.task_id)

        if user_label is None:
            self.assertGraphQLUnauthenticated(response)

        self.assertTrue(Task.objects.filter(id=self.task_id).exists() != should_succeed)
        if should_succeed:
            self.assertEqual(task_count - 1, Task.objects.count())
        else:
            self.assertEqual(task_count, Task.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Owner should succeed
            ("org_1_case_manager_2", True),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", True),  # Other case manager should succeed
            ("non_case_manager_user", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_task_permission(self, user_label: Optional[str], should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ($id: ID!) {
                task(pk: $id) {
                    id
                }
            }
        """
        variables = {"id": self.task_id}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)

    @parametrize(
        "user_label, expected_task_count",
        [
            ("org_1_case_manager_1", 1),  # Owner should succeed
            ("org_1_case_manager_2", 1),  # Other CM in owner's org should succeed
            ("org_2_case_manager_1", 1),  # Other case manager should succeed
            ("non_case_manager_user", 0),  # Non CM should not succeed
            # NOTE: Anon user raising an error may be caused by a strawberry bug.
            # This test may fail and need updating when the bug is fixed.
            (None, None),  # Anonymous user should return error
        ],
    )
    def test_view_tasks_permission(self, user_label: Optional[str], expected_task_count: Optional[int]) -> None:
        self._handle_user_login(user_label)

        response = self.execute_graphql(self.get_tasks_query("id"))

        if expected_task_count is not None:
            self.assertEqual(response["data"]["tasks"]["totalCount"], expected_task_count)
        else:
            self.assertTrue("errors" in response)
            if user_label is None:
                self.assertGraphQLUnauthenticated(response)
