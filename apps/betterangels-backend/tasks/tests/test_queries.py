from typing import Optional
from unittest.mock import ANY

from clients.models import ClientProfile
from common.enums import SelahTeamEnum
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from notes.models import Note
from tasks.enums import TaskStatusEnum
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin
from unittest_parametrize import ParametrizedTestCase, parametrize


class TaskQueryTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._handle_user_login("org_1_case_manager_1")

        self.client_profile = baker.make(ClientProfile)
        org = self.org_1_case_manager_1.organizations_organization.first()
        self.note = baker.make(Note, organization=org)

        self.task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task description",
                "note": str(self.note.pk),
                "summary": "task summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

    def test_task_query(self) -> None:
        task_id = self.task["id"]

        query = f"""
            query ($id: ID!) {{
                task(pk: $id) {{
                    {self._task_fields()}
                }}
            }}
        """
        variables = {"id": task_id}

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]
        expected_task = {
            "id": task_id,
            "clientProfile": {
                "id": str(self.client_profile.pk),
                "firstName": self.client_profile.first_name,
                "lastName": self.client_profile.last_name,
            },
            "createdAt": ANY,
            "createdBy": {
                "id": str(self.org_1_case_manager_1.pk),
                "firstName": self.org_1_case_manager_1.first_name,
                "lastName": self.org_1_case_manager_1.last_name,
            },
            "description": "task description",
            "note": {"pk": str(self.note.pk)},
            "organization": {
                "id": str(self.org_1.pk),
                "name": self.org_1.name,
            },
            "status": TaskStatusEnum.TO_DO.name,
            "summary": "task summary",
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "updatedAt": ANY,
        }

        self.assertEqual(task, expected_task)

    def test_tasks_query(self) -> None:
        self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query(self._task_fields()))

        expected_task = {
            "id": self.task["id"],
            "clientProfile": {
                "id": str(self.client_profile.pk),
                "firstName": self.client_profile.first_name,
                "lastName": self.client_profile.last_name,
            },
            "createdAt": ANY,
            "createdBy": {
                "id": str(self.org_1_case_manager_1.pk),
                "firstName": self.org_1_case_manager_1.first_name,
                "lastName": self.org_1_case_manager_1.last_name,
            },
            "description": "task description",
            "note": {"pk": str(self.note.pk)},
            "organization": {
                "id": str(self.org_1.pk),
                "name": self.org_1.name,
            },
            "status": TaskStatusEnum.TO_DO.name,
            "summary": "task summary",
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "updatedAt": ANY,
        }

        self.assertEqual(response["data"]["tasks"]["totalCount"], 2)
        self.assertEqual(response["data"]["tasks"]["results"][1], expected_task)

    def test_tasks_query_authors_filter(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)

        task_id = self._create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"authors": [str(self.org_1_case_manager_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_organizations_filter(self) -> None:
        self.graphql_client.force_login(self.org_2_case_manager_1)

        task_id = self._create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"organizations": [str(self.org_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_search_filter(self) -> None:
        task_id = self._create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"search": "2 sum"}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_status_filter(self) -> None:
        task_id = self._create_task_fixture(
            {
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
            }
        )[
            "data"
        ]["createTask"]["id"]

        filters = {"status": TaskStatusEnum.COMPLETED.name}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_teams_filter(self) -> None:
        task_id = self._create_task_fixture(
            {
                "summary": "task 2 summary",
                "team": SelahTeamEnum.SLCC_ON_SITE.name,
            }
        )[
            "data"
        ]["createTask"]["id"]

        filters = {"teams": [SelahTeamEnum.SLCC_ON_SITE.name]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    @parametrize(
        "ordering, expected_order",
        [
            ("ASC", ["task 1", "task 2", "task 3"]),
            ("DESC", ["task 3", "task 2", "task 1"]),
            (None, ["task 3", "task 2", "task 1"]),
        ],
    )
    def test_tasks_query_status_order(self, ordering: Optional[str], expected_order: list[str]) -> None:
        Task.objects.all().delete()

        self._create_task_fixture({"summary": "task 1"})["data"]["createTask"]
        self._create_task_fixture({"summary": "task 2", "status": TaskStatusEnum.IN_PROGRESS.name})["data"][
            "createTask"
        ]
        self._create_task_fixture({"summary": "task 3", "status": TaskStatusEnum.COMPLETED.name})["data"]["createTask"]

        variables = {"ordering": [{"status": ordering}]}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("summary"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 3)

        ordered_task_ids = [r["summary"] for r in response["data"]["tasks"]["results"]]
        self.assertEqual(expected_order, ordered_task_ids)
        self.assertEqual(expected_order, ordered_task_ids)
