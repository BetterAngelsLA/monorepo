from unittest.mock import ANY, patch

import time_machine
from common.models import Address, Attachment
from django.test import ignore_warnings, override_settings
from django.utils import timezone
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

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_create_note_mutation(self) -> None:
        expected_query_count = 37
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._create_note_fixture(
                {
                    "title": "New note title",
                    "publicDetails": "New public details",
                    "client": self.client_1.pk,
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "title": "New note title",
            "point": None,
            "address": None,
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

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "title": "Updated note title",
            "point": self.point,
            "address": self.address.pk,
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "timestamp": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 24
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": "Updated note title",
            "point": self.point,
            "address": {
                "street": "106 W 1st St",
                "city": "Los Angeles",
                "state": "CA",
                "zipCode": "90012",
            },
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

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_partial_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "isSubmitted": True,
            "timestamp": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 22
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "title": f"New note for: {self.org_1_case_manager_1.pk}",
            "point": None,
            "address": None,
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

    def test_update_note_location_mutation(self) -> None:
        note_id = self.note["id"]
        json_address_input, address_input = self._get_address_inputs()
        variables = {
            "id": note_id,
            "point": self.point,
            "address": json_address_input,
        }

        expected_query_count = 20
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_note_location_fixture(variables)

        assert isinstance(address_input["addressComponents"], list)
        expected_address = {
            "street": (
                f"{address_input['addressComponents'][0]['long_name']} "
                f"{address_input['addressComponents'][1]['long_name']}"
            ),
            "city": address_input["addressComponents"][3]["long_name"],
            "state": address_input["addressComponents"][5]["short_name"],
            "zipCode": address_input["addressComponents"][7]["long_name"],
        }

        updated_note = response["data"]["updateNoteLocation"]
        self.assertEqual(self.point, updated_note["point"])
        self.assertEqual(expected_address, updated_note["address"])

        note = Note.objects.get(id=note_id)
        self.assertIsNotNone(note.address)

        address = Address.objects.get(id=note.address.pk)  # type: ignore
        self.assertEqual(note, address.notes.first())

    @parametrize(
        "task_type, tasks_to_check, expected_query_count",
        [
            ("PURPOSE", "purposes", 34),
            ("NEXT_STEP", "next_steps", 34),
        ],
    )
    def test_create_note_task_mutation(self, task_type: str, tasks_to_check: str, expected_query_count: int) -> None:
        variables = {
            "title": "New Note Task",
            "noteId": self.note["id"],
            "status": "TO_DO",
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(0, getattr(note, tasks_to_check).count())

        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            ("REQUESTED", "requested_services", "TO_DO", 34),
            ("PROVIDED", "provided_services", "COMPLETED", 34),
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

        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            ("REQUESTED", 9),
            ("PROVIDED", 9),
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

        created_service_request = self._create_note_service_request_fixture(variables)["data"][
            "createNoteServiceRequest"
        ]

        variables = {
            "serviceRequestId": created_service_request["id"],
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        # Remove note service request
        expected_query_count = expected_query_count
        with self.assertNumQueriesWithoutCache(expected_query_count):
            updated_note = self._remove_note_service_request_fixture(variables)["data"]["removeNoteServiceRequest"]

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
            "taskId": self.purpose_1["id"],
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(0, getattr(note, tasks_to_check).count())

        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._add_note_task_fixture(variables)

        expected_note = {
            "id": self.note["id"],
            "purposes": (
                [
                    {"id": self.purpose_1["id"], "title": self.purpose_1["title"]},
                ]
                if tasks_to_check == "purposes"
                else []
            ),
            "nextSteps": (
                [
                    {"id": self.purpose_1["id"], "title": self.purpose_1["title"]},
                ]
                if tasks_to_check == "next_steps"
                else []
            ),
        }
        returned_note = response["data"]["addNoteTask"]
        self.assertEqual(expected_note, returned_note)
        self.assertEqual(1, getattr(note, tasks_to_check).count())
        self.assertEqual(int(self.purpose_1["id"]), getattr(note, tasks_to_check).get().id)

    @parametrize(
        "task_type, tasks_to_check",
        [
            ("PURPOSE", "purposes"),
            ("NEXT_STEP", "next_steps"),
        ],
    )
    def test_remove_note_task_mutation(self, task_type: str, tasks_to_check: str) -> None:
        variables = {
            "noteId": self.note["id"],
            "taskId": (self.purpose_1["id"] if tasks_to_check == "purposes" else self.next_step_1["id"]),
            "taskType": task_type,
        }

        note = Note.objects.get(id=self.note["id"])
        note.purposes.add(self.purpose_1["id"])
        note.next_steps.add(self.next_step_1["id"])
        self.assertEqual(1, note.purposes.count())
        self.assertEqual(1, note.next_steps.count())

        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._remove_note_task_fixture(variables)

        expected_note = {
            "id": self.note["id"],
            "purposes": (
                []
                if tasks_to_check == "purposes"
                else [
                    {"id": str(self.purpose_1["id"]), "title": self.purpose_1["title"]},
                ]
            ),
            "nextSteps": (
                []
                if tasks_to_check == "next_steps"
                else [
                    {
                        "id": self.next_step_1["id"],
                        "title": self.next_step_1["title"],
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

        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._delete_mood_fixture(mood_id=moods[0].pk)

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

        expected_query_count = 20
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)
        self.assertIsNotNone(response["data"]["deleteNote"])

        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])


class NoteRevertMutationTestCase(NoteGraphQLBaseTestCase):
    """
    TODO: Write tests for any other models that get associated to Note.
    """

    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_revert_note_mutation_restores_note_details(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note
        is reverted to their state at the specified moment.

        Test actions:
        1. Update note title, public details, point, and address
        2. Save now as saved_at
        3. Update note title, public details, point, and address
        4. Revert to saved_at from Step 2
        5. Assert note has details from Step 1
        """
        note_id = self.note["id"]

        # Update - should be persisted
        self._update_note_fixture(
            {
                "id": note_id,
                "title": "Updated Title",
                "publicDetails": "Updated Body",
                "point": self.point,
                "address": self.address.pk,
            }
        )

        # Select a moment to revert to
        saved_at = timezone.now()

        other_address = baker.make(Address, street="Discarded St")
        # Update - should be discarded
        self._update_note_fixture(
            {
                "id": note_id,
                "title": "Discarded Title",
                "publicDetails": "Discarded Body",
                "point": [-118.0, 34.0],
                "address": other_address.pk,
            }
        )

        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 26
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(reverted_note["title"], "Updated Title")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")
        self.assertEqual(reverted_note["point"], self.point)
        self.assertEqual(reverted_note["address"]["street"], "106 W 1st St")

    # def test_revert_note_mutation_removes_added_address(self) -> None:
    #     """
    #     Asserts that when revertNote mutation is called, the Note's
    #     Address is reverted to its state at the specified moment.

    #     Test actions:
    #     1. Add an address
    #     2. Save now as saved_at
    #     3. Update the address
    #     4. Revert to saved_at from Step 2
    #     5. Assert note has address from Step 1
    #     """
    #     note_id = self.note["id"]
    #     self.address_input["addressComponents"] = json.dumps(self.address_input["addressComponents"])

    #     # Update - should be persisted
    #     self._update_note_location_fixture(
    #         {
    #             "id": note_id,
    #             "point": self.point,
    #             "address": self.address_input,
    #         }
    #     )

    #     # Select a moment to revert to
    #     saved_at = timezone.now()

    #     new_address_input = deepcopy(self.address_input)
    #     new_address_input["addressComponents"] = json.loads(new_address_input["addressComponents"])
    #     new_address_input["addressComponents"][0]["long_name"] = "201"
    #     new_address_input["addressComponents"] = json.dumps(new_address_input["addressComponents"])
    #     new_address = ""
    #     # Update - should be discarded
    #     self._update_note_location_fixture(
    #         {
    #             "id": note_id,
    #             "point": self.point,
    #             "address": new_address,
    #         }
    #     )
    #     variables = {"id": note_id, "savedAt": saved_at}

    #     expected_query_count = 22
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

    #     self.assertEqual(len(reverted_note["moods"]), 1)

    def test_revert_note_mutation_removes_added_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        Moods are reverted to their state at the specified moment.

        Test actions:
        1. Add 1 mood
        2. Save now as saved_at
        3. Add another mood
        4. Revert to saved_at from Step 2
        5. Assert note has only mood from Step 1
        """
        note_id = self.note["id"]

        # Update - should be persisted
        self._create_note_mood_fixture({"descriptor": "ANXIOUS", "noteId": note_id})

        # Select a moment to revert to
        saved_at = timezone.now()

        # Update - should be discarded
        self._create_note_mood_fixture({"descriptor": "EUTHYMIC", "noteId": note_id})

        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 22
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["moods"]), 1)

    def test_revert_note_mutation_returns_removed_moods(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        Moods are reverted to their state at the specified moment.

        Test actions:
        1. Add 2 moods
        2. Save now as saved_at
        3. Delete 1 mood
        4. Revert to savedAt from Step 3
        5. Assert note has 2 moods from Step 1
        """
        note_id = self.note["id"]

        # Update - should be persisted
        persisted_mood_variables_1 = {"descriptor": "ANXIOUS", "noteId": note_id}
        self._create_note_mood_fixture(persisted_mood_variables_1)

        persisted_mood_variables_2 = {"descriptor": "EUTHYMIC", "noteId": note_id}
        mood_to_delete_id = self._create_note_mood_fixture(persisted_mood_variables_2)["data"]["createNoteMood"]["id"]

        # Select a moment to revert to
        saved_at = timezone.now()

        self._delete_mood_fixture(mood_id=mood_to_delete_id)

        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 29
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["moods"]), 2)

    def test_revert_note_mutation_removes_added_tasks(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        Tasks are reverted to their state at the specified moment.

        Test actions:
        1. Add 1 purpose and 1 next step
        2. Save now as saved_at
        3. Add another purpose and next step
        4. Revert to saved_at from Step 2
        5. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purpose_1["id"],
                "taskType": "PURPOSE",
            }
        )
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_step_1["id"],
                "taskType": "NEXT_STEP",
            }
        )

        # Select a moment to revert to
        saved_at = timezone.now()

        # Add associations that will be discarded
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purpose_2["id"],
                "taskType": "PURPOSE",
            }
        )
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_step_2["id"],
                "taskType": "NEXT_STEP",
            }
        )

        # Revert to saved_at state
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 25
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["purposes"]), 1)
        self.assertEqual(len(reverted_note["nextSteps"]), 1)
        # Assert that unassociated tasks were not deleted
        self.assertEqual(
            Task.objects.filter(id__in=[self.next_step_2["id"], self.purpose_2["id"]]).count(),
            2,
        )

    def test_revert_note_mutation_removes_added_service_requests(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        ServiceRequests are reverted to their state at the specified moment.

        Test actions:
        1. Add 1 requested service and 1 provided service
        2. Save now as saved_at
        3. Add another requested service and provided service
        4. Revert to saved_at from Step 2
        5. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
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
        discarded_requested_service_id = self._create_note_service_request_fixture(
            {
                "service": "CLOTHES",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        discarded_provided_service_id = self._create_note_service_request_fixture(
            {
                "service": "FOOD",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        # Revert to saved_at state
        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 39
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 1)
        self.assertEqual(len(reverted_note["requestedServices"]), 1)
        self.assertEqual(
            ServiceRequest.objects.filter(
                id__in=[discarded_requested_service_id, discarded_provided_service_id]
            ).count(),
            0,
        )

    def test_revert_note_mutation_returns_removed_tasks(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        Tasks are reverted to their state at the specified moment.

        Test actions:
        1. Add 2 purposes and 2 next steps
        2. Save now as saved_at
        3. Remove 1 purpose and 1 next step
        4. Revert to saved_at from Step 2
        5. Assert note has only the associations from Step 1
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purpose_1["id"],
                "taskType": "PURPOSE",
            }
        )

        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_step_1["id"],
                "taskType": "NEXT_STEP",
            }
        )

        # Add associations that will be removed and then reverted
        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purpose_2["id"],
                "taskType": "PURPOSE",
            }
        )

        self._add_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_step_2["id"],
                "taskType": "NEXT_STEP",
            }
        )

        # Select a moment to revert to
        saved_at = timezone.now()

        # Remove task - should be discarded
        self._remove_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.purpose_2["id"],
                "taskType": "PURPOSE",
            }
        )

        self._remove_note_task_fixture(
            {
                "noteId": note_id,
                "taskId": self.next_step_2["id"],
                "taskType": "NEXT_STEP",
            }
        )

        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 25
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["purposes"]), 2)
        self.assertEqual(len(reverted_note["nextSteps"]), 2)

    def test_revert_note_mutation_returns_removed_service_requests(self) -> None:
        """
        Asserts that when revertNote mutation is called, the Note and its
        ServiceRequests are reverted to their state at the specified moment.

        Test actions:
        1. Add 2 requested service and 2 provided service
        2. Save now as saved_at
        3. Remove 1 requested service and 1 provided service
        4. Revert to saved_at from Step 2
        5. Assert note has only the associations from Step 1
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
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

        # Add associations that will be removed and then reverted
        reverted_requested_service = self._create_note_service_request_fixture(
            {
                "service": "CLOTHES",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]

        reverted_provided_service = self._create_note_service_request_fixture(
            {
                "service": "FOOD",
                "customService": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]

        # Select a moment to revert to
        saved_at = timezone.now()

        # Remove service requests - should be discarded
        self._remove_note_service_request_fixture(
            {
                "serviceRequestId": reverted_provided_service["id"],
                "noteId": self.note["id"],
                "serviceRequestType": "PROVIDED",
            }
        )

        self._remove_note_service_request_fixture(
            {
                "serviceRequestId": reverted_requested_service["id"],
                "noteId": self.note["id"],
                "serviceRequestType": "REQUESTED",
            }
        )

        variables = {"id": note_id, "savedAt": saved_at}

        expected_query_count = 25
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 2)
        self.assertEqual(len(reverted_note["requestedServices"]), 2)

    def test_revert_note_mutation_fails_in_atomic_transaction(self) -> None:
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

        variables = {"id": note_id, "savedAt": saved_at}

        with patch("notes.models.Mood.revert_action", side_effect=Exception("oops")):
            not_reverted_note = self._revert_note_fixture(variables)["data"]["revertNote"]

        self.assertEqual(len(not_reverted_note["moods"]), 1)
        self.assertEqual(not_reverted_note["title"], "Discarded Title")


@override_settings(DEFAULT_FILE_STORAGE="django.core.files.storage.InMemoryStorage")
class NoteAttachmentMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_note_attachment(self) -> None:
        file_content = b"Test attachment content"
        file_name = "test_attachment.txt"

        expected_query_count = 23
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
        self.assertIsNotNone(create_response["data"]["createNoteAttachment"]["file"]["name"])
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

        expected_query_count = 14
        with self.assertNumQueriesWithoutCache(expected_query_count):
            self._delete_note_attachment_fixture(attachment_id)

        self.assertFalse(
            Attachment.objects.filter(id=attachment_id).exists(),
            "The attachment should have been deleted from the database.",
        )


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-03-11 10:11:12", tick=False)
class ServiceRequestMutationTestCase(ServiceRequestGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_service_request_mutation(self) -> None:
        expected_query_count = 29
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

    @time_machine.travel("2024-03-11 12:34:56", tick=False)
    def test_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "dueBy": "2024-03-11T11:12:13+00:00",
            "status": "COMPLETED",
            "client": self.client_1.pk,
        }

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

    @time_machine.travel("2024-03-11 12:34:56", tick=False)
    def test_partial_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "client": self.client_1.pk,
        }

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
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

    def test_delete_service_request_mutation(self) -> None:
        mutation = """
            mutation DeleteServiceRequest($id: ID!) {
                deleteServiceRequest(data: { id: $id }) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on ServiceRequestType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.service_request["id"]}

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteServiceRequest"])

        with self.assertRaises(ServiceRequest.DoesNotExist):
            ServiceRequest.objects.get(id=self.service_request["id"])


@ignore_warnings(category=UserWarning)
@time_machine.travel("2024-02-26T10:11:12+00:00", tick=False)
class TaskMutationTestCase(TaskGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    def test_create_task_mutation(self) -> None:
        expected_query_count = 29
        with self.assertNumQueriesWithoutCache(expected_query_count):
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
            "point": None,
            "address": None,
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
            "point": self.point,
            "address": self.address.pk,
            "status": "COMPLETED",
            "client": self.client_1.pk,
        }

        expected_query_count = 18
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "point": self.point,
            "address": {
                "street": "106 W 1st St",
                "city": "Los Angeles",
                "state": "CA",
                "zipCode": "90012",
            },
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

        expected_query_count = 14
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_task_fixture(variables)
        updated_task = response["data"]["updateTask"]
        expected_task = {
            "id": self.task["id"],
            "title": "Updated task title",
            "point": None,
            "address": None,
            "status": "TO_DO",
            "dueBy": None,
            "client": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-02-26T10:11:12+00:00",
        }
        self.assertEqual(expected_task, updated_task)

    def test_update_task_location_mutation(self) -> None:
        task_id = self.task["id"]
        json_address_input, address_input = self._get_address_inputs()
        variables = {
            "id": task_id,
            "point": self.point,
            "address": json_address_input,
        }

        expected_query_count = 18
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_task_location_fixture(variables)

        assert isinstance(address_input["addressComponents"], list)
        expected_address = {
            "street": (
                f"{address_input['addressComponents'][0]['long_name']} "
                f"{address_input['addressComponents'][1]['long_name']}"
            ),
            "city": address_input["addressComponents"][3]["long_name"],
            "state": address_input["addressComponents"][5]["short_name"],
            "zipCode": address_input["addressComponents"][7]["long_name"],
        }

        updated_task = response["data"]["updateTaskLocation"]
        self.assertEqual(self.point, updated_task["point"])
        self.assertEqual(expected_address, updated_task["address"])

        task = Task.objects.get(id=task_id)
        self.assertIsNotNone(task.address)

        address = Address.objects.get(id=task.address.pk)  # type: ignore
        self.assertEqual(task, address.tasks.first())

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

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteTask"])
        with self.assertRaises(Task.DoesNotExist):
            Task.objects.get(id=self.task["id"])
