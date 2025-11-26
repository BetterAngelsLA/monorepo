from unittest.mock import ANY

from clients.models import ClientProfile
from common.enums import SelahTeamEnum
from common.tests.utils import GraphQLBaseTestCase
from hmis.models import HmisNote
from model_bakery import baker
from notes.models import Note
from tasks.enums import TaskScopeEnum, TaskStatusEnum
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin


class TaskQueryTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self._handle_user_login("org_1_case_manager_1")

        self.client_profile = baker.make(ClientProfile)
        org = self.org_1_case_manager_1.organizations_organization.first()
        self.note = baker.make(Note, organization=org)

        self.task = self.create_task_fixture(
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
                    {self.get_task_fields()}
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
        self.create_task_fixture(
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
            response = self.execute_graphql(self.get_tasks_query())

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

        task_id = self.create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"authors": [str(self.org_1_case_manager_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_client_profiles_filter(self) -> None:
        client_profile_2 = baker.make(ClientProfile)

        task_2 = self.create_task_fixture({"summary": "task 2 summary", "clientProfile": str(client_profile_2.pk)})[
            "data"
        ]["createTask"]
        self.create_task_fixture({"summary": "task 3 summary"})["data"]["createTask"]["id"]

        filters = {"clientProfiles": [str(self.client_profile.pk), str(client_profile_2.pk)]}
        variables = {"filters": filters}

        task_count = Task.objects.count()
        self.assertEqual(task_count, 3)

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        expected_task_ids = [self.task["id"], task_2["id"]]
        actual_task_ids = [t["id"] for t in response["data"]["tasks"]["results"]]
        self.assertCountEqual(expected_task_ids, actual_task_ids)

    def test_tasks_query_organizations_filter(self) -> None:
        self.graphql_client.force_login(self.org_2_case_manager_1)

        task_id = self.create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"organizations": [str(self.org_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_search_filter(self) -> None:
        task_id = self.create_task_fixture({"summary": "task 2 summary"})["data"]["createTask"]["id"]
        filters = {"search": "2 sum"}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_status_filter(self) -> None:
        task_id = self.create_task_fixture(
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
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_teams_filter(self) -> None:
        task_id = self.create_task_fixture(
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
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    # --------------------------------------------------------------------------
    # Scope / HMIS Filters
    # --------------------------------------------------------------------------

    def test_tasks_query_scope_filter_default(self) -> None:
        """
        Verify Default Behavior:
        If scopes is NOT provided, it should default to [STANDARD_NOTE, GENERAL].
        It should HIDE HMIS tasks.
        """
        # 1. Create an HMIS Task (Should be hidden)
        hmis_note = baker.make(HmisNote)
        hmis_task = self.create_task_fixture({"summary": "HMIS Task", "hmisNote": str(hmis_note.pk)})["data"][
            "createTask"
        ]

        # 2. Create a General Task (Should be visible)
        general_task = self.create_task_fixture({"summary": "General Task"})["data"]["createTask"]

        # 3. Query without filters
        response = self.execute_graphql(self.get_tasks_query("id summary"))
        results = response["data"]["tasks"]["results"]
        ids = [t["id"] for t in results]

        # Assertions
        self.assertIn(self.task["id"], ids, "Standard Note Task should be visible by default")
        self.assertIn(general_task["id"], ids, "General Task should be visible by default")
        self.assertNotIn(hmis_task["id"], ids, "HMIS Task should be HIDDEN by default")

    def test_tasks_query_scope_filter_hmis_note(self) -> None:
        """
        Verify filtering by HMIS_NOTE returns only HMIS tasks.
        """
        hmis_note = baker.make(HmisNote)
        hmis_task = self.create_task_fixture({"summary": "HMIS Task", "hmisNote": str(hmis_note.pk)})["data"][
            "createTask"
        ]

        # Create a general task just to ensure it's filtered out
        general_task = self.create_task_fixture({"summary": "General Task"})["data"]["createTask"]

        filters = {"scopes": [TaskScopeEnum.HMIS_NOTE.name]}
        variables = {"filters": filters}

        response = self.execute_graphql(self.get_tasks_query("id summary"), variables)
        results = response["data"]["tasks"]["results"]
        ids = [t["id"] for t in results]

        self.assertIn(hmis_task["id"], ids)
        self.assertNotIn(self.task["id"], ids)
        self.assertNotIn(general_task["id"], ids)

    def test_tasks_query_scope_filter_general(self) -> None:
        """
        Verify filtering by GENERAL returns only unlinked tasks.
        """
        general_task = self.create_task_fixture({"summary": "General Task"})["data"]["createTask"]

        # Create HMIS task to ensure filtered out
        hmis_note = baker.make(HmisNote)
        hmis_task = self.create_task_fixture({"summary": "HMIS Task", "hmisNote": str(hmis_note.pk)})["data"][
            "createTask"
        ]

        filters = {"scopes": [TaskScopeEnum.GENERAL.name]}
        variables = {"filters": filters}

        response = self.execute_graphql(self.get_tasks_query("id summary"), variables)
        results = response["data"]["tasks"]["results"]
        ids = [t["id"] for t in results]

        self.assertIn(general_task["id"], ids)
        self.assertNotIn(self.task["id"], ids)
        self.assertNotIn(hmis_task["id"], ids)

    def test_tasks_query_scope_filter_all(self) -> None:
        """
        Verify filtering by ALL returns everything.
        """
        general_task = self.create_task_fixture({"summary": "General Task"})["data"]["createTask"]
        hmis_note = baker.make(HmisNote)
        hmis_task = self.create_task_fixture({"summary": "HMIS Task", "hmisNote": str(hmis_note.pk)})["data"][
            "createTask"
        ]

        filters = {"scopes": [TaskScopeEnum.ALL.name]}
        variables = {"filters": filters}

        response = self.execute_graphql(self.get_tasks_query("id summary"), variables)
        results = response["data"]["tasks"]["results"]
        ids = [t["id"] for t in results]

        self.assertIn(self.task["id"], ids)
        self.assertIn(general_task["id"], ids)
        self.assertIn(hmis_task["id"], ids)
