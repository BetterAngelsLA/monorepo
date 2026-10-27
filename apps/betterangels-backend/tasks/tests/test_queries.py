from typing import Optional
from unittest.mock import ANY

from model_bakery import baker

from accounts.models import User
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from notes.models import Note
from tasks.enums import TaskStatusEnum
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
                "teamId": str(self.org_1_team_1.pk),
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
            "assignee": None,
            "team": {"id": str(self.org_1_team_1.pk), "name": self.org_1_team_1.name},
            "description": "task description",
            "hmisNote": None,
            "note": {"pk": str(self.note.pk)},
            "organization": {
                "id": str(self.org_1.pk),
                "name": self.org_1.name,
            },
            "status": TaskStatusEnum.TO_DO.name,
            "summary": "task summary",
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
                "teamId": str(self.org_1_team_1.pk),
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
            "assignee": None,
            "team": {"id": str(self.org_1_team_1.pk), "name": self.org_1_team_1.name},
            "description": "task description",
            "hmisNote": None,
            "note": {"pk": str(self.note.pk)},
            "organization": {
                "id": str(self.org_1.pk),
                "name": self.org_1.name,
            },
            "status": TaskStatusEnum.TO_DO.name,
            "summary": "task summary",
            "updatedAt": ANY,
        }

        self.assertEqual(response["data"]["tasks"]["totalCount"], 2)
        self.assertEqual(response["data"]["tasks"]["results"][1], expected_task)

    def test_tasks_query_authors_filter(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)

        task_id = self.create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "summary": "task 2 summary",
            }
        )["data"]["createTask"]["id"]
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

        task_id = self.create_task_fixture(
            {
                "summary": "task 2 summary",
                "clientProfile": str(self.client_profile.pk),
            }
        )["data"]["createTask"]["id"]
        filters = {"organizations": [str(self.org_2.pk)]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_search_filter(self) -> None:
        task_id = self.create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "summary": "task 2 summary",
            }
        )["data"]["createTask"]["id"]
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
                "clientProfile": str(self.client_profile.pk),
                "status": TaskStatusEnum.COMPLETED.name,
                "summary": "task 2 summary",
            }
        )["data"]["createTask"]["id"]

        filters = {"status": TaskStatusEnum.COMPLETED.name}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_task_query_legacy_team_selection_still_resolves(self) -> None:
        """The exact selection shipped in native app builds must keep validating.

        See the note counterpart: ``currentTeam`` and ``slug`` are removed together
        in #2342, because every shipped block selects both.
        """
        task_id = self.create_task_fixture({"summary": "task summary", "teamId": str(self.org_1_team_1.pk)})["data"][
            "createTask"
        ]["id"]

        query = """
            query ($id: ID!) {
                task(pk: $id) {
                    team { id name }
                    currentTeam { id slug name }
                }
            }
        """
        response = self.execute_graphql(query, {"id": task_id})

        task = response["data"]["task"]
        self.assertEqual(task["team"], {"id": str(self.org_1_team_1.pk), "name": self.org_1_team_1.name})
        self.assertEqual(
            task["currentTeam"],
            {"id": str(self.org_1_team_1.pk), "slug": None, "name": self.org_1_team_1.name},
        )

    def test_tasks_query_teams_filter_ignores_an_unmatchable_id(self) -> None:
        task_id = self.create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "summary": "task 2 summary",
                "teamId": str(self.org_1_team_2.pk),
            }
        )["data"]["createTask"]["id"]

        response = self.execute_graphql(
            self.get_tasks_query("id"),
            {"filters": {"teamIds": [str(self.org_1_team_2.pk), "abc"]}},
        )

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)

    def test_tasks_query_teams_filter_of_only_unmatchable_ids_matches_nothing(self) -> None:
        self.create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "summary": "task 2 summary",
                "teamId": str(self.org_1_team_2.pk),
            }
        )

        response = self.execute_graphql(self.get_tasks_query("id"), {"filters": {"teamIds": ["abc"]}})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["tasks"]["totalCount"], 0)

    def test_tasks_query_teams_filter(self) -> None:
        task_id = self.create_task_fixture(
            {
                "clientProfile": str(self.client_profile.pk),
                "summary": "task 2 summary",
                "teamId": str(self.org_1_team_2.pk),
            }
        )["data"]["createTask"]["id"]

        filters = {"teamIds": [self.org_1_team_2.pk]}
        variables = {"filters": filters}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.get_tasks_query("id"), variables)

        self.assertEqual(response["data"]["tasks"]["totalCount"], 1)
        self.assertEqual(response["data"]["tasks"]["results"][0]["id"], task_id)


class TaskListAssigneeQueryCountTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    """The list must join the assignee, not fetch it per row."""

    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

        for _ in range(8):
            baker.make(
                Task,
                organization=self.org_1,
                assignee=self.org_1_case_manager_2,
                created_by=self.org_1_case_manager_1,
                team=self.org_1_team_1,
                client_profile=baker.make(ClientProfile),
            )

    def test_tasks_list_does_not_add_a_query_per_assignee(self) -> None:
        # A per-row assignee lookup would be 4 + 8 here. The flat count is the
        # assertion: if `assignee` ever stops being joined, this grows by rows.
        with self.assertNumQueriesWithoutCache(4):
            response = self.execute_graphql(self.get_tasks_query())

        self.assertEqual(response["data"]["tasks"]["totalCount"], 8)

class TaskAssigneeQueryTestCase(GraphQLBaseTestCase):
    """``taskAssignees`` backs the assignee picker on the task form."""

    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def task_assignees_query(self, filters: Optional[dict] = None) -> dict:
        query = """
            query ($filters: TaskAssigneeFilter) {
                taskAssignees (filters: $filters) {
                    totalCount
                    results { id firstName lastName }
                }
            }
        """

        return self.execute_graphql(query, {"filters": filters})

    def test_task_assignees_lists_org_members(self) -> None:
        results = self.task_assignees_query()["data"]["taskAssignees"]["results"]
        member_ids = [u["id"] for u in results]

        self.assertIn(str(self.org_1_case_manager_1.pk), member_ids)
        self.assertIn(str(self.org_1_case_manager_2.pk), member_ids)

        returned = next(u for u in results if u["id"] == str(self.org_1_case_manager_2.pk))
        self.assertEqual(returned["firstName"], self.org_1_case_manager_2.first_name)
        self.assertEqual(returned["lastName"], self.org_1_case_manager_2.last_name)

    def test_task_assignees_excludes_users_outside_every_org(self) -> None:
        outsider = baker.make(User, first_name="Outside", last_name="User")

        results = self.task_assignees_query()["data"]["taskAssignees"]["results"]

        self.assertNotIn(str(outsider.pk), [u["id"] for u in results])

    def test_task_assignees_excludes_members_of_another_org(self) -> None:
        # org_2 is not one of the caller's orgs, so neither is its case manager
        # — offering them would hand the picker an assignee ``Task.clean()``
        # then rejects.
        results = self.task_assignees_query()["data"]["taskAssignees"]["results"]

        self.assertNotIn(str(self.org_2_case_manager_1.pk), [u["id"] for u in results])

    def test_task_assignees_search_filters_by_name(self) -> None:
        self.org_1_case_manager_2.first_name = "Reginald"
        self.org_1_case_manager_2.last_name = "Tarkington"
        self.org_1_case_manager_2.save()

        results = self.task_assignees_query({"search": "Tarkington"})["data"]["taskAssignees"]["results"]

        self.assertEqual([u["id"] for u in results], [str(self.org_1_case_manager_2.pk)])
