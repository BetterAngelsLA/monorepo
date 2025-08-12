from typing import Any, Optional
from unittest import skip

import time_machine
from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from common.enums import SelahTeamEnum
from common.tests.utils import GraphQLBaseTestCase
from deepdiff import DeepDiff
from django.test import ignore_warnings
from model_bakery import baker
from notes.enums import ServiceEnum, ServiceRequestStatusEnum
from notes.models import Note
from notes.tests.utils import NoteGraphQLBaseTestCase, ServiceRequestGraphQLBaseTestCase
from tasks.tests.utils import TaskGraphQLUtilsMixin
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
class NoteQueryTestCase(NoteGraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
        task = self.create_task_fixture({"summary": "task summary", "note": note_id})["data"]["createTask"]
        # Update fields available on the note input
        self._update_note_fixture(
            {
                "id": note_id,
                "interactedAt": "2024-03-12T11:12:13+00:00",
                "isSubmitted": False,
                "location": self.location.pk,
                "privateDetails": "Updated private details",
                "publicDetails": "Updated public details",
                "purpose": "Updated Note",
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )
        # Add purposes and next steps
        note = Note.objects.get(pk=note_id)
        note.provided_services.set(self.provided_services)
        note.requested_services.set(self.requested_services)

        query = f"""
            query ($id: ID!) {{
                note(pk: $id) {{
                    {self.note_fields}
                }}
            }}
        """

        variables = {"id": note_id}
        expected_query_count = 6

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "clientProfile": {"id": str(self.client_profile_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T11:12:13+00:00",
            "isSubmitted": False,
            "privateDetails": "Updated private details",
            "publicDetails": "Updated public details",
            "purpose": "Updated Note",
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "location": {
                "id": str(self.location.pk),
                "address": {
                    "street": self.address.street,
                    "city": self.address.city,
                    "state": self.address.state,
                    "zipCode": self.address.zip_code,
                },
                "point": self.point,
                "pointOfInterest": self.point_of_interest,
            },
            "providedServices": [
                {
                    "id": str(self.provided_services[0].id),
                    "service": ServiceEnum(self.provided_services[0].service).name,
                    "serviceOther": self.provided_services[0].service_other,
                    "dueBy": self.provided_services[0].due_by,
                    "status": ServiceRequestStatusEnum(self.provided_services[0].status).name,
                },
                {
                    "id": str(self.provided_services[1].id),
                    "service": ServiceEnum(self.provided_services[1].service).name,
                    "serviceOther": self.provided_services[1].service_other,
                    "dueBy": self.provided_services[1].due_by,
                    "status": ServiceRequestStatusEnum(self.provided_services[1].status).name,
                },
            ],
            "requestedServices": [
                {
                    "id": str(self.requested_services[0].id),
                    "service": ServiceEnum(self.requested_services[0].service).name,
                    "serviceOther": self.requested_services[0].service_other,
                    "dueBy": self.requested_services[0].due_by,
                    "status": ServiceRequestStatusEnum(self.requested_services[0].status).name,
                },
                {
                    "id": str(self.requested_services[1].id),
                    "service": ServiceEnum(self.requested_services[1].service).name,
                    "serviceOther": self.requested_services[1].service_other,
                    "dueBy": self.requested_services[1].due_by,
                    "status": ServiceRequestStatusEnum(self.requested_services[1].status).name,
                },
            ],
            "tasks": [{"id": str(task["id"]), "summary": "task summary"}],
        }
        note_differences = DeepDiff(expected_note, note, ignore_order=True)
        self.assertFalse(note_differences)

    def test_notes_query(self) -> None:
        query = f"""
            query ($offset: Int, $limit: Int) {{
                notes (pagination: {{offset: $offset, limit: $limit}}) {{
                    totalCount
                    pageInfo {{
                        limit
                        offset
                    }}
                    results {{
                        {self.note_fields}
                    }}
                }}
            }}
        """
        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"offset": 0, "limit": 10})

        self.assertEqual(response["data"]["notes"]["totalCount"], 1)
        self.assertEqual(response["data"]["notes"]["pageInfo"], {"limit": 10, "offset": 0})

        notes = response["data"]["notes"]["results"]
        note_differences = DeepDiff(self.note, notes[0], ignore_order=True)
        self.assertFalse(note_differences)

    @parametrize(
        ("authors, expected_results_count, expected_note_labels"),
        [
            ([], 3, ["note", "note_2", "note_3"]),
            (["org_1_case_manager_1"], 1, ["note"]),
            (["org_1_case_manager_2"], 2, ["note_2", "note_3"]),
            (["org_2_case_manager_1"], 0, []),
            (["org_1_case_manager_2", "org_2_case_manager_1"], 2, ["note_2", "note_3"]),
        ],
    )
    def test_notes_query_authors_filter(
        self,
        authors: list[SelahTeamEnum],
        expected_results_count: int,
        expected_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_profile_1
        self.note_2 = self._create_note_fixture(
            {"purpose": "Client 1's Note", "clientProfile": self.client_profile_1.pk}
        )["data"]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "clientProfile": self.client_profile_2.pk,
            }
        )["data"]["createNote"]

        filters = {"authors": [self.user_map[author].pk for author in authors]}

        query = """
            query ($filters: NoteFilter) {
                notes (filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        with self.assertNumQueriesWithoutCache(4):
            response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)

        expected_ids = [getattr(self, label)["id"] for label in expected_note_labels]
        actual_ids = [n["id"] for n in response["data"]["notes"]["results"]]
        self.assertCountEqual(expected_ids, actual_ids)

    @parametrize(
        ("organizations, expected_results_count, expected_note_labels"),
        [
            ([], 3, ["note", "note_2", "note_3"]),
            (["org_1"], 1, ["note"]),
            (["org_2"], 2, ["note_2", "note_3"]),
            (["org_1", "org_2"], 3, ["note", "note_2", "note_3"]),
        ],
    )
    def test_notes_query_organizations_filter(
        self,
        organizations: list[SelahTeamEnum],
        expected_results_count: int,
        expected_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_2_case_manager_1)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_profile_1
        self.note_2 = self._create_note_fixture(
            {"purpose": "Client 1's Note", "clientProfile": self.client_profile_1.pk}
        )["data"]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "clientProfile": self.client_profile_2.pk,
            }
        )["data"]["createNote"]

        filters = {"organizations": [getattr(self, f"{org}").pk for org in organizations]}

        query = """
            query ($filters: NoteFilter) {
                notes (filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        with self.assertNumQueriesWithoutCache(4):
            response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)

        expected_ids = [getattr(self, label)["id"] for label in expected_note_labels]
        actual_ids = [n["id"] for n in response["data"]["notes"]["results"]]
        self.assertCountEqual(expected_ids, actual_ids)

    @parametrize(
        ("teams, expected_results_count, expected_note_labels"),
        [
            ([], 3, ["note", "note_2", "note_3"]),
            ([SelahTeamEnum.WDI_ON_SITE.name, SelahTeamEnum.SLCC_ON_SITE.name], 2, ["note_2", "note_3"]),
            ([SelahTeamEnum.SLCC_ON_SITE.name], 1, ["note_3"]),
        ],
    )
    def test_notes_query_teams_filter(
        self,
        teams: list[SelahTeamEnum],
        expected_results_count: int,
        expected_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_profile_1
        self.note_2 = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "clientProfile": self.client_profile_1.pk,
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )["data"]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "clientProfile": self.client_profile_2.pk,
                "team": SelahTeamEnum.SLCC_ON_SITE.name,
            }
        )["data"]["createNote"]

        filters = {"teams": teams}

        query = """
            query ($filters: NoteFilter) {
                notes (filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        with self.assertNumQueriesWithoutCache(4):
            response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)

        expected_ids = [getattr(self, label)["id"] for label in expected_note_labels]
        actual_ids = [n["id"] for n in response["data"]["notes"]["results"]]
        self.assertCountEqual(expected_ids, actual_ids)

    @parametrize(
        ("search_terms, expected_results_count, expected_note_labels"),
        [
            ("deets", 2, ["note_2", "note_3"]),  # Two notes have "deets" in public details
            ("deets coop", 1, ["note_2"]),  # One note has "deets" in public details and "coop" in client name
            ("more", 1, ["note_3"]),  # One note has "more" in public details
        ],
    )
    def test_notes_query_search_filter(
        self,
        search_terms: Optional[str],
        expected_results_count: int,
        expected_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_profile_1
        self.note_2 = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "publicDetails": "deets",
                "clientProfile": self.client_profile_1.pk,
            }
        )["data"]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "publicDetails": "more deets",
                "clientProfile": self.client_profile_2.pk,
            }
        )["data"]["createNote"]

        query = """
            query ($filters: NoteFilter) {
                notes (filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        filters: dict[str, Any] = {"search": search_terms}

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)

        expected_ids = [getattr(self, label)["id"] for label in expected_note_labels]
        actual_ids = [n["id"] for n in response["data"]["notes"]["results"]]
        self.assertCountEqual(expected_ids, actual_ids)

    def test_notes_query_order(self) -> None:
        """
        Assert that notes are returned in order of interacted_at timestamp, regardless of client
        """
        self.graphql_client.force_login(self.org_1_case_manager_2)

        older_note = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "clientProfile": self.client_profile_1.pk,
            }
        )["data"]["createNote"]
        self._update_note_fixture({"id": older_note["id"], "interactedAt": "2024-03-10T10:11:12+00:00"})

        oldest_note = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "clientProfile": self.client_profile_2.pk,
            }
        )["data"]["createNote"]
        self._update_note_fixture({"id": oldest_note["id"], "interactedAt": "2024-01-10T10:11:12+00:00"})

        query = """
            query Notes($order: NoteOrder) {
                notes(order: $order) {
                    results{
                        id
                    }
                }
            }
        """

        # Test descending order
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"interactedAt": "DESC"}})

        self.assertEqual(
            [n["id"] for n in response["data"]["notes"]["results"]],
            [self.note["id"], older_note["id"], oldest_note["id"]],
        )

        # Test ascending order
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"interactedAt": "ASC"}})

        self.assertEqual(
            [n["id"] for n in response["data"]["notes"]["results"]],
            [oldest_note["id"], older_note["id"], self.note["id"]],
        )


@skip("Service Requests are not currently implemented")
@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
class ServiceRequestQueryTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_service_request_query(self) -> None:
        service_request_id = self.service_request["id"]
        self._update_service_request_fixture(
            {
                "id": service_request_id,
                "status": "COMPLETED",
            }
        )

        query = """
            query ($id: ID!) {
                serviceRequest (pk: $id) {
                    id
                    service
                    serviceOther
                    status
                    dueBy
                    completedOn
                    clientProfile {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        variables = {"id": service_request_id}

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        service_request = response["data"]["serviceRequest"]
        expected_service_request = {
            "id": service_request_id,
            "service": self.service_request["service"],
            "serviceOther": None,
            "status": "COMPLETED",
            "dueBy": None,
            "completedOn": "2024-03-11T10:11:12+00:00",
            "clientProfile": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }

        self.assertEqual(service_request, expected_service_request)

    def test_service_requests_query(self) -> None:
        query = """
            {
                serviceRequests {
                    id
                    service
                    serviceOther
                    status
                    dueBy
                    completedOn
                    clientProfile {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        service_requests = response["data"]["serviceRequests"]
        self.assertEqual(len(service_requests), 1)
        self.assertEqual(service_requests[0], self.service_request)


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
class InteractionAuthorQueryTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.graphql_client.force_login(self.org_1_case_manager_1)

        self.authors_map = {
            "author_1": baker.make(User, first_name="Alexa", last_name="Danvers", middle_name="J."),
            "author_2": baker.make(User, first_name="Wanda", last_name="Maximoff", middle_name="A."),
            "author_3": baker.make(User, first_name="Alexandria", last_name="Daniels", middle_name="M."),
        }
        self.author_1 = self.authors_map["author_1"]
        self.author_2 = self.authors_map["author_2"]
        self.author_3 = self.authors_map["author_3"]
        self.non_author = baker.make(User, first_name="Alex", last_name="Johnson")

        org = organization_recipe.make(name="author org")
        org.add_user(self.author_1)
        org.add_user(self.author_2)
        org.add_user(self.author_3)

    def test_interaction_authors(self) -> None:
        query = """
            query {
                interactionAuthors {
                    totalCount
                    results {
                        id
                        firstName
                        lastName
                        middleName
                    }
                }
            }
        """

        response = self.execute_graphql(query)
        results = response["data"]["interactionAuthors"]["results"]
        author_ids = [u["id"] for u in results]

        self.assertIn(str(self.author_1.pk), author_ids)
        self.assertNotIn(str(self.non_author.pk), author_ids)

        returned_author: dict = next((u for u in results if u["id"] == str(self.author_1.pk)))
        self.assertEqual(returned_author["firstName"], "Alexa")
        self.assertEqual(returned_author["lastName"], "Danvers")
        self.assertEqual(returned_author["middleName"], "J.")

    @parametrize(
        ("name_search, expected_results_count, expected_authors"),
        [
            ("Maximoff", 1, ["author_2"]),
            ("Pietro Maximoff", 0, None),
            ("Alex", 2, ["author_1", "author_3"]),
        ],
    )
    def test_interaction_authors_filter(
        self,
        name_search: Optional[str],
        expected_results_count: int,
        expected_authors: Optional[list[str]],
    ) -> None:

        query = """
            query ($filters: InteractionAuthorFilter) {
                interactionAuthors (filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

        filters: dict[str, Any] = {"search": name_search}

        response = self.execute_graphql(query, variables={"filters": filters})
        self.assertEqual(response["data"]["interactionAuthors"]["totalCount"], expected_results_count)

        if expected_authors:
            authors = response["data"]["interactionAuthors"]["results"]
            author_ids = set([int(u["id"]) for u in authors])
            expected_authors_ids = set([self.authors_map[u].pk for u in expected_authors])
            self.assertEqual(author_ids, expected_authors_ids, f"Not equal, {author_ids, expected_authors_ids}")
