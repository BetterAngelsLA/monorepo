from typing import Any, Optional

import time_machine
from accounts.models import User
from accounts.tests.baker_recipes import permission_group_recipe
from deepdiff import DeepDiff
from django.test import ignore_warnings, override_settings
from django.utils import timezone
from model_bakery import baker
from notes.enums import (
    DueByGroupEnum,
    NoteNamespaceEnum,
    SelahTeamEnum,
    ServiceEnum,
    ServiceRequestStatusEnum,
)
from notes.models import Note
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11T10:11:12+00:00", tick=False)
class NoteQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_note_query(self) -> None:
        note_id = self.note["id"]
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
                "title": "Updated Note",
            }
        )
        # Add moods
        self._create_note_mood_fixture(
            {"descriptor": "ANXIOUS", "noteId": note_id},
        )
        self._create_note_mood_fixture(
            {"descriptor": "EUTHYMIC", "noteId": note_id},
        )
        # Add purposes and next steps
        note = Note.objects.get(pk=note_id)
        note.purposes.set([self.purpose_1["id"], self.purpose_2["id"]])
        note.next_steps.set([self.next_step_1["id"], self.next_step_2["id"]])
        note.provided_services.set(self.provided_services)
        note.requested_services.set(self.requested_services)

        query = f"""
            query ViewNote($id: ID!) {{
                note(pk: $id) {{
                    {self.note_fields}
                }}
            }}
        """

        variables = {"id": note_id}
        expected_query_count = 8

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        note = response["data"]["note"]
        expected_note = {
            "id": note_id,
            "client": {"id": str(self.client_user_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T11:12:13+00:00",
            "isSubmitted": False,
            "privateDetails": "Updated private details",
            "publicDetails": "Updated public details",
            "purpose": "Updated Note",
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "title": "Updated Note",
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
            "moods": [{"descriptor": "ANXIOUS"}, {"descriptor": "EUTHYMIC"}],
            "purposes": [
                {"id": self.purpose_1["id"], "title": self.purpose_1["title"]},
                {"id": self.purpose_2["id"], "title": self.purpose_2["title"]},
            ],
            "nextSteps": [
                {"id": self.next_step_1["id"], "title": self.next_step_1["title"], "location": None},
                {"id": self.next_step_2["id"], "title": self.next_step_2["title"], "location": None},
            ],
            "providedServices": [
                {
                    "id": str(self.provided_services[0].id),
                    "service": ServiceEnum(self.provided_services[0].service).name,
                    "serviceOther": self.provided_services[0].service_other,
                    "customService": self.provided_services[0].custom_service,
                    "dueBy": self.provided_services[0].due_by,
                    "status": ServiceRequestStatusEnum(self.provided_services[0].status).name,
                },
                {
                    "id": str(self.provided_services[1].id),
                    "service": ServiceEnum(self.provided_services[1].service).name,
                    "serviceOther": self.provided_services[1].service_other,
                    "customService": self.provided_services[1].custom_service,
                    "dueBy": self.provided_services[1].due_by,
                    "status": ServiceRequestStatusEnum(self.provided_services[1].status).name,
                },
            ],
            "requestedServices": [
                {
                    "id": str(self.requested_services[0].id),
                    "service": ServiceEnum(self.requested_services[0].service).name,
                    "serviceOther": self.requested_services[0].service_other,
                    "customService": self.requested_services[0].custom_service,
                    "dueBy": self.requested_services[0].due_by,
                    "status": ServiceRequestStatusEnum(self.requested_services[0].status).name,
                },
                {
                    "id": str(self.requested_services[1].id),
                    "service": ServiceEnum(self.requested_services[1].service).name,
                    "serviceOther": self.requested_services[1].service_other,
                    "customService": self.requested_services[1].custom_service,
                    "dueBy": self.requested_services[1].due_by,
                    "status": ServiceRequestStatusEnum(self.requested_services[1].status).name,
                },
            ],
        }
        note_differences = DeepDiff(expected_note, note, ignore_order=True)
        self.assertFalse(note_differences)

    def test_notes_query(self) -> None:
        """
        NOTE: This query is deprecated in favor of notesPaginated
        """

        query = f"""
            query ViewNotes {{
                notes {{
                    {self.note_fields}
                }}
            }}
        """
        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        notes = response["data"]["notes"]
        self.assertEqual(len(notes), 1)
        note_differences = DeepDiff(self.note, notes[0], ignore_order=True)
        self.assertFalse(note_differences)

    def test_notes_paginated_query(self) -> None:
        query = f"""
            query ViewNotes($offset: Int, $limit: Int) {{
                notes: notesPaginated(pagination: {{offset: $offset, limit: $limit}}) {{
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
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"offset": 0, "limit": 10})

        self.assertEqual(response["data"]["notes"]["totalCount"], 1)
        self.assertEqual(response["data"]["notes"]["pageInfo"], {"limit": 10, "offset": 0})

        notes = response["data"]["notes"]["results"]
        # TODO: Add more validations once sort is implemented
        note_differences = DeepDiff(self.note, notes[0], ignore_order=True)
        self.assertFalse(note_differences)

    def test_interaction_authors(self) -> None:
        query = """
            query ViewInteractionAuthors {
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

        test_new_interaction_author = baker.make(
            User,
            first_name="Wanda",
            last_name="Maximoff",
            middle_name="J.",
        )

        perm_group = permission_group_recipe.make()
        perm_group.organization.add_user(test_new_interaction_author)

        response = self.execute_graphql(query)

        self.assertFalse(response["data"] is None, f"Data is None: {response}")

        results = response["data"]["interactionAuthors"]["results"]
        returned_author: dict = next((u for u in results if u["id"] == str(test_new_interaction_author.pk)))
        self.assertEqual(returned_author["firstName"], "Wanda")
        self.assertEqual(returned_author["lastName"], "Maximoff")
        self.assertEqual(returned_author["middleName"], "J.")

    @parametrize(
        ("case_manager_label, client_label, org_label, is_submitted, expected_results_count, returned_note_labels"),
        [
            # Filter by:
            # created by, client_label, and/or is_submitted
            ("org_1_case_manager_1", None, None, None, 1, ["note"]),  # CM 1 created one note
            ("org_2_case_manager_1", None, None, True, 1, ["note_3"]),  # Org 2 CM 1 submitted 1 note
            ("org_1_case_manager_2", None, None, False, 1, ["note_2"]),  # CM 2 has one unsubmitted note
            ("org_1_case_manager_1", "client_user_2", None, None, 0, []),  # CM 1 has no notes for client 2
            # CM 1 has one unsubmitted note for client 1
            ("org_1_case_manager_1", "client_user_1", None, False, 1, ["note"]),
            (None, None, "org_2", True, 1, ["note_3"]),  # There is one submitted note from org 2
        ],
    )
    def test_notes_query_filter(
        self,
        case_manager_label: Optional[str],
        client_label: Optional[str],
        org_label: Optional[str],
        is_submitted: Optional[bool],
        expected_results_count: int,
        returned_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_user_1
        self.note_2 = self._create_note_fixture({"purpose": "Client 1's Note", "client": self.client_user_1.pk})[
            "data"
        ]["createNote"]
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_2_case_manager_1)
        self.note_3 = self._create_note_fixture({"purpose": "Client 2's Note", "client": self.client_user_2.pk})[
            "data"
        ]["createNote"]
        self._update_note_fixture(
            {
                "id": self.note_3["id"],
                "isSubmitted": True,
            }
        )

        query = """
            query Notes($filters: NoteFilter) {
                notes: notesPaginated(filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        filters: dict[str, Any] = {}

        if case_manager_label:
            filters["createdBy"] = self.user_map[case_manager_label].pk

        if client_label:
            filters["client"] = getattr(self, client_label).pk

        if org_label:
            filters["organization"] = getattr(self, org_label).pk

        if isinstance(is_submitted, bool):
            filters["isSubmitted"] = is_submitted

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)
        notes = response["data"]["notes"]["results"]

        for idx, note_label in enumerate(returned_note_labels):
            self.assertEqual(notes[idx]["id"], getattr(self, note_label)["id"])

    @parametrize(
        ("teams, expected_results_count, returned_note_labels, expected_query_count"),
        [
            ([SelahTeamEnum.WDI_ON_SITE.name, SelahTeamEnum.SLCC_ON_SITE.name], 2, ["note_2", "note_3"], 4),
            ([SelahTeamEnum.SLCC_ON_SITE.name], 1, ["note_3"], 4),
            ([SelahTeamEnum.WDI_ON_SITE.name, "invalid team"], 0, [], 1),
        ],
    )
    def test_notes_query_filter_by_teams(
        self,
        teams: list[SelahTeamEnum],
        expected_results_count: int,
        returned_note_labels: list[str],
        expected_query_count: int,
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_user_1
        self.note_2 = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "client": self.client_user_1.pk,
            }
        )[
            "data"
        ]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "client": self.client_user_2.pk,
            }
        )[
            "data"
        ]["createNote"]
        self._update_note_fixture(
            {
                "id": self.note_2["id"],
                "team": SelahTeamEnum.WDI_ON_SITE.name,
            }
        )
        self._update_note_fixture(
            {
                "id": self.note_3["id"],
                "team": SelahTeamEnum.SLCC_ON_SITE.name,
            }
        )

        filters = {"teams": teams}

        query = """
            query Notes($filters: NoteFilter) {
                notes: notesPaginated(filters: $filters) {
                    totalCount
                    results{
                        id
                    }
                }
            }
        """

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        if "invalid team" in teams:
            self.assertIsNone(response["data"])
            self.assertEqual(len(response["errors"]), 1)
            self.assertIn("does not exist in 'SelahTeamEnum'", response["errors"][0]["message"])

        else:
            self.assertEqual(response["data"]["notes"]["totalCount"], expected_results_count)
            notes = response["data"]["notes"]["results"]

            for idx, note_label in enumerate(returned_note_labels):
                self.assertEqual(notes[idx]["id"], getattr(self, note_label)["id"])

    @parametrize(
        ("search_terms, expected_results_count, returned_note_labels"),
        [
            ("deets", 2, ["note_2", "note_3"]),  # Two notes have "deets" in public details
            ("deets coop", 1, ["note_2"]),  # One note has "deets" in public details and "coop" in client name
            ("more", 1, ["note_3"]),  # One note has "more" in public details
        ],
    )
    def test_notes_query_search(
        self,
        search_terms: Optional[str],
        expected_results_count: int,
        returned_note_labels: list[str],
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_2)
        # self.note is created in the setup block by self.org_1_case_manager_1 for self.client_user_1
        self.note_2 = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "publicDetails": "deets",
                "client": self.client_user_1.pk,
            }
        )["data"]["createNote"]
        self.note_3 = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "publicDetails": "more deets",
                "client": self.client_user_2.pk,
            }
        )["data"]["createNote"]

        query = """
            query Notes($filters: NoteFilter) {
                notes: notesPaginated(filters: $filters) {
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
        notes = response["data"]["notes"]["results"]

        for idx, note_label in enumerate(returned_note_labels):
            self.assertEqual(notes[idx]["id"], getattr(self, note_label)["id"])

    def test_notes_query_order(self) -> None:
        """
        Assert that notes are returned in order of interacted_at timestamp, regardless of client
        """
        self.graphql_client.force_login(self.org_1_case_manager_2)

        older_note = self._create_note_fixture(
            {
                "purpose": "Client 1's Note",
                "client": self.client_user_1.pk,
            }
        )[
            "data"
        ]["createNote"]
        self._update_note_fixture({"id": older_note["id"], "interactedAt": "2024-03-10T10:11:12+00:00"})

        oldest_note = self._create_note_fixture(
            {
                "purpose": "Client 2's Note",
                "client": self.client_user_2.pk,
            }
        )[
            "data"
        ]["createNote"]
        self._update_note_fixture({"id": oldest_note["id"], "interactedAt": "2024-01-10T10:11:12+00:00"})

        query = """
            query Notes($order: NoteOrder) {
                notes: notesPaginated(order: $order) {
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


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentQueryTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self.attachment_1 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 1",
            "attachment_1.txt",
        )
        self.attachment_2 = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            b"Attachment 2",
            "attachment_2.txt",
        )

    def test_view_note_attachment_permission(self) -> None:
        query = """
            query ViewNoteAttachment($id: ID!) {
                noteAttachment(pk: $id) {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        variables = {"id": self.attachment_1["data"]["createNoteAttachment"]["id"]}
        response = self.execute_graphql(query, variables)

        self.assertEqual(
            response["data"]["noteAttachment"],
            self.attachment_1["data"]["createNoteAttachment"],
        )

    def test_view_note_attachments_permission(self) -> None:
        query = """
            query ViewNoteAttachments {
                noteAttachments {
                    id
                    file {
                        name
                    }
                    attachmentType
                    originalFilename
                    namespace
                }
            }
        """
        response = self.execute_graphql(query)

        self.assertEqual(
            response["data"]["noteAttachments"],
            [
                self.attachment_1["data"]["createNoteAttachment"],
                self.attachment_2["data"]["createNoteAttachment"],
            ],
        )


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
                "client": self.client_user_1.pk,
            }
        )

        query = """
            query ViewServiceRequest($id: ID!) {
                serviceRequest(pk: $id) {
                    id
                    service
                    serviceOther
                    customService
                    status
                    dueBy
                    completedOn
                    client {
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
            "customService": None,
            "status": "COMPLETED",
            "dueBy": None,
            "completedOn": "2024-03-11T10:11:12+00:00",
            "client": {"id": str(self.client_user_1.pk)},
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
                    customService
                    status
                    dueBy
                    completedOn
                    client {
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
class TaskQueryTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_task_query(self) -> None:
        task_id = self.task["id"]
        # Update fields available on the task input
        self._update_task_fixture(
            {
                "id": task_id,
                "title": "Updated task title",
                "location": self.location.pk,
                "status": "COMPLETED",
                "dueBy": timezone.now(),
                "client": self.client_user_1.pk,
            }
        )

        query = """
            query ViewTask($id: ID!) {
                task(pk: $id) {
                    id
                    title
                    location {
                        id
                        address {
                            street
                            city
                            state
                            zipCode
                        }
                        point
                        pointOfInterest
                    }
                    status
                    dueBy
                    dueByGroup
                    client {
                        id
                    }
                    createdBy {
                        id
                    }
                    createdAt
                }
            }
        """
        variables = {"id": task_id}

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        task = response["data"]["task"]
        expected_task = {
            "id": task_id,
            "title": "Updated task title",
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
            "status": "COMPLETED",
            "dueBy": "2024-03-11T10:11:12+00:00",
            "dueByGroup": DueByGroupEnum.TODAY.name,
            "client": {
                "id": str(self.client_user_1.pk),
            },
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }

        self.assertEqual(task, expected_task)

    def test_tasks_query(self) -> None:
        query = """
            {
                tasks {
                    id
                    title
                    location {
                        id
                        address {
                            street
                            city
                            state
                            zipCode
                        }
                        point
                        pointOfInterest
                    }
                    status
                    dueBy
                    dueByGroup
                    client {
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

        tasks = response["data"]["tasks"]
        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0], self.task)
