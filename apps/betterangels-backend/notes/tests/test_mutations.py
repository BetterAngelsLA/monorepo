import time
from unittest.mock import ANY, patch

from common.models import Attachment
from django.test import ignore_warnings, override_settings
from django.utils import timezone
from freezegun import freeze_time
from model_bakery import baker
from notes.enums import NoteNamespaceEnum
from notes.models import Mood, Note, ServiceRequest, Task
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    TaskGraphQLBaseTestCase,
)
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    @freeze_time("03-12-2024 10:11:12")
    def test_create_note_mutation(self) -> None:
        expected_query_count = 36
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": "New Note",
                    "publicDetails": "New public details",
                    "client": self.client_1.pk,
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New Note",
            "moods": [],
            "purposes": [],
            "nextSteps": [],
            "providedServices": [],
            "requestedServices": [],
            "publicDetails": "New public details",
            "privateDetails": "",
            "isSubmitted": False,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "timestamp": "2024-03-12T10:11:12+00:00",
        }
        self.assertEqual(expected_note, created_note)

    @freeze_time("03-12-2024 10:11:12")
    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated Title",
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "timestamp": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 21
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated Title",
            "moods": [],
            "purposes": [],
            "nextSteps": [],
            "providedServices": [],
            "requestedServices": [],
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "timestamp": "2024-03-12T10:11:12+00:00",
        }
        self.assertEqual(expected_note, updated_note)

    @freeze_time("03-12-2024 10:11:12")
    def test_partial_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "isSubmitted": True,
            "timestamp": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 21
        with self.assertNumQueries(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": f"New note for: {self.org_1_case_manager_1.pk}",
            "moods": [],
            "purposes": [],
            "nextSteps": [],
            "providedServices": [],
            "requestedServices": [],
            "publicDetails": f"{self.org_1_case_manager_1.pk}'s public details",
            "privateDetails": "",
            "isSubmitted": True,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "timestamp": "2024-03-12T10:11:12+00:00",
        }
        self.assertEqual(expected_note, updated_note)

    def test_revert_note_mutation_removes_added_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.
        Test actions:
        1. Update note title and public details
        2. Add 1 mood
        3. Save now as saved_at
        4. Update note title and public details
        5. Add another mood
        6. Revert to saved_at from Step 3
        7. Assert note has only 1 mood and title/details from Step 1
        """
        note_id = self.note["id"]

        # Update - should be persisted
        persisted_update_variables = {
            "id": note_id,
            "title": "Updated Title",
            "publicDetails": "Updated Body",
            "isSubmitted": False,
        }
        self._update_note_fixture(persisted_update_variables)

        persisted_mood_variables = {"descriptor": "ANXIOUS", "noteId": note_id}
        self._create_note_mood_fixture(persisted_mood_variables)

        # Select a moment to revert to
        saved_at = timezone.now()

        # Update - should be discarded
        discarded_update_variables = {
            "id": note_id,
            "title": "Discarded Title",
            "publicDetails": "Discarded Body",
            "isSubmitted": False,
        }
        self._update_note_fixture(discarded_update_variables)

        discarded_mood_variables = {"descriptor": "EUTHYMIC", "noteId": note_id}
        self._create_note_mood_fixture(discarded_mood_variables)

        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 23
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["moods"]), 1)
        self.assertEqual(reverted_note["title"], "Updated Title")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")

    def test_revert_note_mutation_returns_removed_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.
        Test actions:
        1. Add 2 moods
        2. Save now as saved_at
        3. Delete 1 mood
        4. Revert to savedAt from Step 3
        5. Assert note has 2 moods again
        """
        note_id = self.note["id"]

        # Update - should be persisted
        persisted_mood_variables_1 = {"descriptor": "ANXIOUS", "noteId": note_id}
        self._create_note_mood_fixture(persisted_mood_variables_1)

        persisted_mood_variables_2 = {"descriptor": "EUTHYMIC", "noteId": note_id}
        mood_to_delete_id = self._create_note_mood_fixture(persisted_mood_variables_2)[
            "data"
        ]["createNoteMood"]["id"]

        # Select a moment to revert to
        saved_at = timezone.now()

        delete_mood_mutation = """
            mutation DeleteMood($id: ID!) {
                deleteMood(data: { id: $id }) {
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        self.execute_graphql(delete_mood_mutation, {"id": mood_to_delete_id})

        revert_note_mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 21
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(revert_note_mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["moods"]), 2)

    def test_revert_note_mutation_removes_added_tasks_and_service_requests(
        self,
    ) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.

        Test actions:
        1. Add 1 purpose and 1 next step
        2. Add 1 requested service and 1 provided service
        3. Save now as saved_at
        4. Add another purpose and next_step
        5. Create 1 purpose
        6. Add another requested service and provided service
        7. Revert to saved_at from Step 3
        8. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purposes[0].pk,
                "taskType": "PURPOSE",
            }
        )
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_steps[0].pk,
                "taskType": "NEXT_STEP",
            }
        )
        self._create_note_service_request_fixture(
            {
                "service": "BLANKET",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "service": "WATER",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )

        # Select a moment to revert to
        saved_at = timezone.now()

        # Add associations that will be discarded
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purposes[1].pk,
                "taskType": "PURPOSE",
            }
        )
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_steps[1].pk,
                "taskType": "NEXT_STEP",
            }
        )
        self._create_note_task_fixture(
            {
                "title": "New Note Task",
                "noteId": self.note["id"],
                "status": "TO_DO",
                "taskType": "PURPOSE",
            }
        )
        self._create_note_service_request_fixture(
            {
                "service": "CLOTHES",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "service": "FOOD",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )

        # Revert to saved_at state
        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        purposes {
                            id
                        }
                        nextSteps {
                            id
                        }
                        providedServices {
                            id
                        }
                        requestedServices {
                            id
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        # expected_query_count = 26
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["purposes"]), 1)
        self.assertEqual(len(reverted_note["nextSteps"]), 1)
        self.assertEqual(len(reverted_note["providedServices"]), 1)
        self.assertEqual(len(reverted_note["requestedServices"]), 1)

    def test_revert_note_mutation_returns_removed_tasks_and_service_requests(
        self,
    ) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        related models are reverted to their state at the specified moment.

        Test actions:
        1. Add 2 purpose and 2 next step
        2. Add 2 requested service and 2 provided service
        3. Save now as saved_at
        4. Remove 1 purpose and 1 next_step
        5. Remove 1 requested service and 1 provided service
        6. Revert to saved_at from Step 3
        7. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
        # self._add_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.purposes[0].pk,
        #         "taskType": "PURPOSE",
        #     }
        # )

        # self._add_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.next_steps[0].pk,
        #         "taskType": "NEXT_STEP",
        #     }
        # )
        self._create_note_service_request_fixture(
            {
                "service": "BLANKET",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        # self._create_note_service_request_fixture(
        #     {
        #         "service": "WATER",
        #         "customService": None,
        #         "noteId": note_id,
        #         "serviceRequestType": "PROVIDED",
        #     }
        # )

        # Add associations that will be removed and then reverted
        # self._add_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.purposes[1].pk,
        #         "taskType": "PURPOSE",
        #     }
        # )

        # self._add_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.next_steps[1].pk,
        #         "taskType": "NEXT_STEP",
        #     }
        # )

        # reverted_requested_service = self._create_note_service_request_fixture(
        #     {
        #         "service": "CLOTHES",
        #         "customService": None,
        #         "noteId": note_id,
        #         "serviceRequestType": "REQUESTED",
        #     }
        # )["data"]["createNoteServiceRequest"]

        reverted_provided_service = self._create_note_service_request_fixture(
            {
                "service": "FOOD",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]

        # Select a moment to revert to
        time.sleep(1)
        saved_at = timezone.now()
        print("SAVED_AT" * 10)
        print("=" * 100)
        print(saved_at)

        # Remove task - should be discarded
        # self._remove_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.purposes[1].pk,
        #         "taskType": "PURPOSE",
        #     }
        # )

        # self._remove_note_task_fixture(
        #     {
        #         "noteId": note_id,
        #         "taskId": self.next_steps[1].pk,
        #         "taskType": "NEXT_STEP",
        #     }
        # )

        # Remove service requests - should be discarded
        delete_service_request_mutation = """
            mutation removeNoteServiceRequest($id: ID!) {
                removeNoteServiceRequest(data: { id: $id }) {
                    ... on ServiceRequestType {
                        id
                    }
                }
            }
        """
        print("deleting")
        print("=" * 100)
        print(timezone.now())
        self.execute_graphql(
            delete_service_request_mutation, {"id": reverted_provided_service["id"]}
        )

        # self.execute_graphql(
        #     delete_service_request_mutation, {"id": reverted_requested_service["id"]}
        # )

        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        purposes {
                            id
                        }
                        nextSteps {
                            id
                        }
                        providedServices {
                            id
                        }
                        requestedServices {
                            id
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        # expected_query_count = 41
        # with self.assertNumQueries(expected_query_count):
        if True:
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["purposes"]), 2)
        self.assertEqual(len(reverted_note["nextSteps"]), 2)
        self.assertEqual(len(reverted_note["providedServices"]), 2)
        self.assertEqual(len(reverted_note["requestedServices"]), 2)

    def test_revert_note_mutation_fails_in_atomic_transaction(
        self,
    ) -> None:
        """
        Asserts that when revertNote mutation fails, the Note and is not
        partially updated.
        """
        note_id = self.note["id"]
        self._update_note_fixture({"id": note_id, "title": "Updated Title"})

        # Select a moment to revert to
        saved_at = timezone.now()

        # Update - should be persisted because revert fails
        self._update_note_fixture({"id": note_id, "title": "Discarded Title"})
        self._create_note_mood_fixture({"descriptor": "ANXIOUS", "noteId": note_id})

        mutation = """
            mutation RevertNote($data: RevertNoteInput!) {
                revertNote(data: $data) {
                    ... on NoteType {
                        id
                        title
                        publicDetails
                        moods {
                            descriptor
                        }
                    }
                }
            }
        """
        variables = {"id": note_id, "savedAt": saved_at}

        with patch("notes.models.Mood.revert_action", side_effect=Exception("oops")):
            response = self.execute_graphql(mutation, {"data": variables})

        reverted_note = response["data"]["revertNote"]
        self.assertEqual(len(reverted_note["moods"]), 1)
        self.assertEqual(reverted_note["title"], "Discarded Title")

    @parametrize(
        "task_type, tasks_to_check, expected_query_count",
        [
            ("PURPOSE", "purposes", 33),
            ("NEXT_STEP", "next_steps", 32),
        ],
    )
    def test_create_note_task_mutation(
        self, task_type: str, tasks_to_check: str, expected_query_count: int
    ) -> None:
        variables = {
            "title": "New Note Task",
            "noteId": self.note["id"],
            "status": "TO_DO",
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(0, getattr(note, tasks_to_check).count())

        with self.assertNumQueries(expected_query_count):
            response = self._create_note_task_fixture(variables)

        expected_task = {
            "id": ANY,
            "title": "New Note Task",
            "status": "TO_DO",
            "dueBy": None,
            "client": self.note["client"],
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": ANY,
        }
        task = response["data"]["createNoteTask"]

        self.assertEqual(expected_task, task)
        self.assertEqual(1, getattr(note, tasks_to_check).count())
        self.assertEqual(task["id"], str(getattr(note, tasks_to_check).get().id))

    @parametrize(
        "service_request_type, service_requests_to_check, expected_status, expected_query_count",  # noqa E501
        [
            ("REQUESTED", "requested_services", "TO_DO", 33),
            ("PROVIDED", "provided_services", "COMPLETED", 32),
        ],
    )
    def test_create_note_service_request_mutation(
        self,
        service_request_type: str,
        service_requests_to_check: str,
        expected_status: str,
        expected_query_count: int,
    ) -> None:
        variables = {
            "service": "BLANKET",
            "customService": None,
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(0, getattr(note, service_requests_to_check).count())

        with self.assertNumQueries(expected_query_count):
            response = self._create_note_service_request_fixture(variables)

        expected_service_request = {
            "id": ANY,
            "service": "BLANKET",
            "status": expected_status,
            "customService": None,
            "dueBy": None,
            "completedOn": ANY,
            "client": self.note["client"],
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": ANY,
        }
        service_request = response["data"]["createNoteServiceRequest"]

        self.assertEqual(expected_service_request, service_request)
        self.assertEqual(1, getattr(note, service_requests_to_check).count())
        self.assertEqual(
            service_request["id"],
            str(getattr(note, service_requests_to_check).get().id),
        )

    @parametrize(
        "service_request_type,  expected_query_count",  # noqa E501
        [
            ("REQUESTED", 12),
            ("PROVIDED", 12),
        ],
    )
    def test_remove_note_service_request_mutation(
        self,
        service_request_type: str,
        expected_query_count: int,
    ) -> None:
        # First create note service request
        variables = {
            "service": "BLANKET",
            "customService": None,
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        created_service_request = self._create_note_service_request_fixture(variables)[
            "data"
        ]["createNoteServiceRequest"]

        variables = {
            "serviceRequestId": created_service_request["id"],
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        # Remove note service request
        expected_query_count = expected_query_count
        with self.assertNumQueries(expected_query_count):
            # if True:
            updated_note = self._remove_note_service_request_fixture(variables)["data"][
                "removeNoteServiceRequest"
            ]

        self.assertEqual(len(updated_note["requestedServices"]), 0)
        self.assertEqual(len(updated_note["providedServices"]), 0)

    @parametrize(
        "task_type, tasks_to_check",
        [
            ("PURPOSE", "purposes"),
            ("NEXT_STEP", "next_steps"),
        ],
    )
    def test_add_note_task_mutation(self, task_type: str, tasks_to_check: str) -> None:
        variables = {
            "noteId": self.note["id"],
            "taskId": self.purposes[0].pk,
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(0, getattr(note, tasks_to_check).count())

        expected_query_count = 12
        with self.assertNumQueries(expected_query_count):
            response = self._add_note_task_fixture(variables)

        expected_note = {
            "id": self.note["id"],
            "purposes": (
                [
                    {"id": str(self.purposes[0].id), "title": self.purposes[0].title},
                ]
                if tasks_to_check == "purposes"
                else []
            ),
            "nextSteps": (
                [
                    {"id": str(self.purposes[0].id), "title": self.purposes[0].title},
                ]
                if tasks_to_check == "next_steps"
                else []
            ),
        }
        returned_note = response["data"]["addNoteTask"]
        self.assertEqual(expected_note, returned_note)
        self.assertEqual(1, getattr(note, tasks_to_check).count())
        self.assertEqual(self.purposes[0].pk, getattr(note, tasks_to_check).get().id)

    @parametrize(
        "task_type, tasks_to_check",
        [
            ("PURPOSE", "purposes"),
            ("NEXT_STEP", "next_steps"),
        ],
    )
    def test_remove_note_task_mutation(
        self, task_type: str, tasks_to_check: str
    ) -> None:
        variables = {
            "noteId": self.note["id"],
            "taskId": getattr(self, tasks_to_check)[0].pk,
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        note.purposes.add(self.purposes[0])
        note.next_steps.add(self.next_steps[0])
        self.assertEqual(1, note.purposes.count())
        self.assertEqual(1, note.next_steps.count())

        expected_query_count = 12
        with self.assertNumQueries(expected_query_count):
            response = self._remove_note_task_fixture(variables)

        expected_note = {
            "id": self.note["id"],
            "purposes": (
                []
                if tasks_to_check == "purposes"
                else [
                    {"id": str(self.purposes[0].id), "title": self.purposes[0].title},
                ]
            ),
            "nextSteps": (
                []
                if tasks_to_check == "next_steps"
                else [
                    {
                        "id": str(self.next_steps[0].id),
                        "title": self.next_steps[0].title,
                    },
                ]
            ),
        }
        returned_note = response["data"]["removeNoteTask"]
        self.assertEqual(expected_note, returned_note)
        self.assertEqual(0, getattr(note, tasks_to_check).count())

    def test_create_note_mood_mutation(self) -> None:
        baker.make(Mood, note_id=self.note["id"])
        variables = {
            "descriptor": "ANXIOUS",
            "noteId": self.note["id"],
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(1, note.moods.count())

        expected_query_count = 10
        with self.assertNumQueries(expected_query_count):
            response = self._create_note_mood_fixture(variables)

        expected_mood = {
            "id": ANY,
            "descriptor": "ANXIOUS",
        }
        mood = response["data"]["createNoteMood"]
        self.assertEqual(expected_mood, mood)
        self.assertEqual(2, note.moods.count())
        self.assertIn(mood["id"], str(note.moods.only("id")))

    def test_delete_mood_mutation(self) -> None:
        note = Note.objects.get(id=self.note["id"])
        moods = baker.make(Mood, note_id=note.id, _quantity=2)
        self.assertEqual(2, note.moods.count())

        mutation = """
            mutation DeleteMood($id: ID!) {
                deleteMood(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        variables = {"id": moods[0].pk}

        expected_query_count = 5
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteMood"])
        self.assertEqual(1, note.moods.count())
        with self.assertRaises(Mood.DoesNotExist):
            Mood.objects.get(id=moods[0].pk)

    def test_delete_note_mutation(self) -> None:
        mutation = """
            mutation DeleteNote($id: ID!) {
                deleteNote(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on NoteType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.note["id"]}

        expected_query_count = 19
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)
        self.assertIsNotNone(response["data"]["deleteNote"])

        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_note_attachment(self) -> None:
        file_content = b"Test attachment content"
        file_name = "test_attachment.txt"

        expected_query_count = 22
        with self.assertNumQueries(expected_query_count):
            create_response = self._create_note_attachment_fixture(
                self.note["id"],
                NoteNamespaceEnum.MOOD_ASSESSMENT.name,
                file_content,
                file_name,
            )

        attachment_id = create_response["data"]["createNoteAttachment"]["id"]
        self.assertEqual(
            create_response["data"]["createNoteAttachment"]["originalFilename"],
            file_name,
        )
        self.assertIsNotNone(
            create_response["data"]["createNoteAttachment"]["file"]["name"]
        )
        self.assertTrue(
            Attachment.objects.filter(id=attachment_id).exists(),
            "The attachment should have been created and exist in the database.",
        )

    def test_delete_note_attachment(self) -> None:
        file_content = b"Content for deletion test"
        file_name = "delete_test_attachment.txt"
        create_response = self._create_note_attachment_fixture(
            self.note["id"],
            NoteNamespaceEnum.MOOD_ASSESSMENT.name,
            file_content,
            file_name,
        )

        attachment_id = create_response["data"]["createNoteAttachment"]["id"]
        self.assertTrue(Attachment.objects.filter(id=attachment_id).exists())

        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            self._delete_note_attachment_fixture(attachment_id)

        self.assertFalse(
            Attachment.objects.filter(id=attachment_id).exists(),
            "The attachment should have been deleted from the database.",
        )


@freeze_time("2024-02-26")
@freeze_time("2024-03-11 10:11:12")
@ignore_warnings(category=UserWarning)
class ServiceRequestMutationTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_service_request_mutation(self) -> None:
        expected_query_count = 28
        with self.assertNumQueries(expected_query_count):
            response = self._create_service_request_fixture(
                {
                    "service": "BLANKET",
                    "status": "TO_DO",
                }
            )
        created_service_request = response["data"]["createServiceRequest"]
        expected_service_request = {
            "id": ANY,
            "service": "BLANKET",
            "customService": None,
            "dueBy": None,
            "completedOn": None,
            "status": "TO_DO",
            "client": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(expected_service_request, created_service_request)

    @freeze_time("2024-03-11 12:34:56")
    def test_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "dueBy": "2024-03-11T11:12:13+00:00",
            "status": "COMPLETED",
            "client": self.client_1.pk,
        }

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self._update_service_request_fixture(variables)

        updated_service_request = response["data"]["updateServiceRequest"]
        expected_service_request = {
            "id": self.service_request["id"],
            "service": "BLANKET",
            "customService": None,
            "status": "COMPLETED",
            "dueBy": "2024-03-11T11:12:13+00:00",
            "completedOn": "2024-03-11T12:34:56+00:00",
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(expected_service_request, updated_service_request)

    @freeze_time("2024-03-11 12:34:56")
    def test_partial_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "client": self.client_1.pk,
        }

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self._update_service_request_fixture(variables)

        updated_service_request = response["data"]["updateServiceRequest"]
        expected_service_request = {
            "id": self.service_request["id"],
            "service": "BLANKET",
            "customService": None,
            "status": "TO_DO",
            "dueBy": None,
            "completedOn": None,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(expected_service_request, updated_service_request)


@freeze_time("2024-02-26 10:11:12")
@ignore_warnings(category=UserWarning)
class TaskMutationTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_task_mutation(self) -> None:
        expected_query_count = 28
        with self.assertNumQueries(expected_query_count):
            response = self._create_task_fixture(
                {
                    "title": "New Task",
                    "status": "TO_DO",
                }
            )
        created_task = response["data"]["createTask"]
        expected_task = {
            "id": ANY,
            "title": "New Task",
            "status": "TO_DO",
            "dueBy": None,
            "client": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-02-26T10:11:12+00:00",
        }
        self.assertEqual(expected_task, created_task)

    def test_update_task_mutation(self) -> None:
        variables = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "COMPLETED",
            "client": self.client_1.pk,
        }

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "COMPLETED",
            "dueBy": None,
            "client": {"id": str(self.client_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-02-26T10:11:12+00:00",
        }
        self.assertEqual(expected_task, updated_task)

    def test_partial_update_task_mutation(self) -> None:
        variables = {
            "id": self.task["id"],
            "title": "Updated task title",
        }

        expected_query_count = 13
        with self.assertNumQueries(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "status": "TO_DO",
            "dueBy": None,
            "client": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-02-26T10:11:12+00:00",
        }
        self.assertEqual(expected_task, updated_task)

    def test_delete_task_mutation(self) -> None:
        mutation = """
            mutation DeleteTask($id: ID!) {
                deleteTask(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on TaskType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.task["id"]}

        expected_query_count = 15
        with self.assertNumQueries(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=self.task["id"])
