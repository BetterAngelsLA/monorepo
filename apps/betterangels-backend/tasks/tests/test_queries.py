from unittest.mock import ANY

from clients.models import ClientProfile
from common.enums import SelahTeamEnum
from model_bakery import baker
from tasks.enums import TaskStatusEnum
from tasks.tests.utils import TaskGraphQLBaseTestCase


class TaskQueryTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task description",
                "status": TaskStatusEnum.TO_DO.name,
                "summary": "task summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

    def test_task_query(self) -> None:
        task_id = self.task["id"]

        query = f"""
            query ($id: ID!) {{
                task(pk: $id) {{
                    {self.task_fields}
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
            response = self.execute_graphql(self._tasks_query(self.task_fields))

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
        task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

        filters = {"authors": [str(self.org_1_case_manager_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task["id"])

    def test_tasks_query_organizations_filter(self) -> None:
        self.graphql_client.force_login(self.org_2_case_manager_1)
        task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

        filters = {"organizations": [str(self.org_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task["id"])

    def test_tasks_query_search_filter(self) -> None:
        task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

        filters = {"search": "2 des"}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task["id"])

    def test_tasks_query_status_filter(self) -> None:
        task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createTask"]

        filters = {"status": TaskStatusEnum.COMPLETED.name}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task["id"])

    def test_tasks_query_teams_filter(self) -> None:
        task = self._create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "description": "task 2 description",
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
                "team": SelahTeamEnum.SLCC_ON_SITE.name,
            }
        )["data"]["createTask"]

        filters = {"teams": [SelahTeamEnum.SLCC_ON_SITE.name]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self._tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task["id"])
