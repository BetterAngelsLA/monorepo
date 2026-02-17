from unittest import skip
from unittest.mock import ANY, patch

import time_machine
from common.enums import SelahTeamEnum
from common.models import Location
from django.test import ignore_warnings
from django.utils import timezone
from notes.models import Note, OrganizationService, ServiceRequest
from notes.tests.utils import (
    NoteGraphQLBaseTestCase,
    ServiceRequestGraphQLBaseTestCase,
    ServiceRequestGraphQLUtilMixin,
)
from tasks.tests.utils import TaskGraphQLUtilsMixin
from unittest_parametrize import parametrize


@ignore_warnings(category=UserWarning)
class NoteMutationTestCase(NoteGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_create_note_mutation(self) -> None:
        expected_query_count = 30
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._create_note_fixture(
                {
                    "purpose": "New note purpose",
                    "publicDetails": "New public details",
                    "clientProfile": self.client_profile_1.pk,
                }
            )

        created_note = response["data"]["createNote"]
        expected_note = {
            "id": ANY,
            "clientProfile": {"id": str(self.client_profile_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T10:11:12+00:00",
            "isSubmitted": False,
            "location": None,
            "privateDetails": "",
            "providedServices": [],
            "publicDetails": "New public details",
            "purpose": "New note purpose",
            "requestedServices": [],
            "tasks": [],
            "team": None,
        }
        self.assertEqual(created_note, expected_note)

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_update_note_mutation(self) -> None:
        json_address_input, _ = self._get_address_inputs()
        location_input = {
            "address": json_address_input,
            "point": self.point,
            "pointOfInterest": self.point_of_interest,
        }
        variables = {
            "id": self.note["id"],
            "purpose": "Updated note purpose",
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "location": location_input,
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "interactedAt": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 13
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "purpose": "Updated note purpose",
            "tasks": [],
            "team": SelahTeamEnum.WDI_ON_SITE.name,
            "location": {
                "id": ANY,
                "address": {
                    "street": self.address.street,
                    "city": self.address.city,
                    "state": self.address.state,
                    "zipCode": self.address.zip_code,
                },
                "point": self.point,
                "pointOfInterest": self.point_of_interest,
            },
            "providedServices": [],
            "requestedServices": [],
            "publicDetails": "Updated public details",
            "privateDetails": "Updated private details",
            "isSubmitted": False,
            "clientProfile": {"id": str(self.client_profile_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T10:11:12+00:00",
        }
        self.assertEqual(updated_note, expected_note)

    @time_machine.travel("03-12-2024 10:11:12", tick=False)
    def test_partial_update_note_mutation(self) -> None:
        variables = {
            "id": self.note["id"],
            "isSubmitted": True,
            "interactedAt": "2024-03-12T10:11:12+00:00",
        }

        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_note_fixture(variables)

        updated_note = response["data"]["updateNote"]
        expected_note = {
            "id": self.note["id"],
            "clientProfile": {"id": str(self.client_profile_1.pk)},
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "interactedAt": "2024-03-12T10:11:12+00:00",
            "isSubmitted": True,
            "location": None,
            "privateDetails": "",
            "providedServices": [],
            "publicDetails": f"{self.client_profile_1.full_name}'s public details",
            "purpose": f"Session with {self.client_profile_1.full_name}",
            "requestedServices": [],
            "tasks": [],
            "team": None,
        }
        self.assertEqual(updated_note, expected_note)

    def test_update_note_location_mutation(self) -> None:
        note_id = self.note["id"]
        json_address_input, address_input = self._get_address_inputs()

        location = {
            "address": json_address_input,
            "point": self.point,
            "pointOfInterest": self.point_of_interest,
        }
        variables = {
            "id": note_id,
            "location": location,
        }

        expected_query_count = 7
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

        updated_note_location = response["data"]["updateNoteLocation"]["location"]
        self.assertEqual(updated_note_location["point"], self.point)
        self.assertEqual(updated_note_location["address"], expected_address)

        note = Note.objects.get(id=note_id)
        self.assertIsNotNone(note.location)

        location = Location.objects.get(id=note.location.pk)  # type: ignore
        self.assertEqual(note, location.notes.first())

    def test_create_note_service_request_mutation(self) -> None:
        bag_svc = OrganizationService.objects.get(label="Bag(s)")

        variables = {
            "serviceId": str(bag_svc.pk),
            "noteId": self.note["id"],
            "serviceRequestType": "PROVIDED",
        }

        initial_org_service_count = OrganizationService.objects.count()

        response = self._create_note_service_request_fixture(variables)
        self.assertEqual(initial_org_service_count, OrganizationService.objects.count())

        response_service_request = response["data"]["createNoteServiceRequest"]
        service_request = ServiceRequest.objects.get(id=response_service_request["id"])
        note = Note.objects.get(id=self.note["id"])

        assert service_request.service
        self.assertIn(service_request, note.provided_services.all())

        self.assertEqual(response_service_request["service"]["id"], str(bag_svc.pk))
        self.assertEqual(response_service_request["service"]["label"], bag_svc.label)

        self.assertEqual(service_request.service.pk, bag_svc.pk)
        self.assertEqual(service_request.service.label, bag_svc.label)
        self.assertEqual(service_request.service.category, bag_svc.category)

    def test_create_note_service_request_mutation_other(self) -> None:
        variables = {
            "serviceOther": "custom org svc",
            "noteId": self.note["id"],
            "serviceRequestType": "PROVIDED",
        }

        initial_org_service_count = OrganizationService.objects.count()

        response = self._create_note_service_request_fixture(variables)
        self.assertEqual(initial_org_service_count + 1, OrganizationService.objects.count())

        response_service_request = response["data"]["createNoteServiceRequest"]
        service_request = ServiceRequest.objects.get(id=response_service_request["id"])
        note = Note.objects.get(id=self.note["id"])
        org_service_id = OrganizationService.objects.get(label="custom org svc", organization=self.org_1).pk

        assert service_request.service
        self.assertIn(service_request, note.provided_services.all())

        self.assertEqual(response_service_request["service"]["id"], str(org_service_id))
        self.assertEqual(response_service_request["service"]["label"], "custom org svc")

        self.assertEqual(service_request.service.pk, org_service_id)
        self.assertEqual(service_request.service.label, "custom org svc")
        self.assertIsNone(service_request.service.category)

    @parametrize(
        "provided_type, expected_type",
        [("REQUESTED", "requested_services"), ("PROVIDED", "provided_services")],
    )
    def test_create_note_service_request_mutation_type_status(
        self,
        provided_type: str,
        expected_type: str,
    ) -> None:
        service = OrganizationService.objects.get(label="Bag(s)")
        variables = {
            "serviceId": str(service.pk),
            "noteId": self.note["id"],
            "serviceRequestType": provided_type,
        }

        note = Note.objects.get(id=self.note["id"])
        self.assertEqual(getattr(note, expected_type).count(), 0)

        response = self._create_note_service_request_fixture(variables)

        service_request = ServiceRequest.objects.get(id=response["data"]["createNoteServiceRequest"]["id"])
        note = Note.objects.get(id=self.note["id"])
        self.assertIn(service_request, getattr(note, expected_type).all())

    @parametrize(
        "service_request_type,  expected_query_count",
        [
            ("REQUESTED", 8),
            ("PROVIDED", 8),
        ],
    )
    def test_remove_note_service_request_mutation(
        self,
        service_request_type: str,
        expected_query_count: int,
    ) -> None:
        # First create note service request
        bag_svc = OrganizationService.objects.get(label="Bag(s)")
        variables = {
            "serviceId": str(bag_svc.pk),
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        response_service_request = self._create_note_service_request_fixture(variables)["data"][
            "createNoteServiceRequest"
        ]

        variables = {
            "serviceRequestId": response_service_request["id"],
            "noteId": self.note["id"],
            "serviceRequestType": service_request_type,
        }

        # Remove note service request
        expected_query_count = expected_query_count
        with self.assertNumQueriesWithoutCache(expected_query_count):
            updated_note = self._remove_note_service_request_fixture(variables)["data"]["removeNoteServiceRequest"]

        self.assertEqual(len(updated_note["requestedServices"]), 0)
        self.assertEqual(len(updated_note["providedServices"]), 0)

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

        expected_query_count = 22
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)
        self.assertIsNotNone(response["data"]["deleteNote"])

        with self.assertRaises(Note.DoesNotExist):
            Note.objects.get(id=self.note["id"])


class NoteRevertMutationTestCase(NoteGraphQLBaseTestCase, TaskGraphQLUtilsMixin, ServiceRequestGraphQLUtilMixin):
    """
    Asserts that when revertNote mutation is called, the Note instance and all of
    it's related model instances are reverted to their states at the specified moment.
    """

    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")
        self.task_note_fields = """
            purposes {
                id
                title
            }
            nextSteps {
                id
                title
            }
        """
        self.service_note_fields = """
            providedServices {
                id
            }
            requestedServices {
                id
            }
        """

    def test_revert_note_mutation_restores_note_details_to_creation(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Save now as revert_before_timestamp
        2. Update note title, public details, point, and address
        3. Revert to revert_before_timestamp from Step 1
        4. Assert note has details from Step 0
        5. Save now as revert_before_timestamp
        6. Revert to revert_before_timestamp from Step 5
        7. Assert note has details from Step 0
        """
        note_id = self.note["id"]

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        other_json_address_input, _ = self._get_address_inputs(street_number_override="999")
        other_location_input = {
            "address": other_json_address_input,
            "point": [-118.0, 34.0],
            "pointOfInterest": "Discarded POI",
        }
        # Update - should be discarded
        self._update_note_fixture(
            {
                "id": note_id,
                "purpose": "Discarded Purpose",
                "publicDetails": "Discarded Body",
                "location": other_location_input,
            }
        )

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        note_fields = """
            purpose
            publicDetails
            location {
                id
            }
        """

        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["purpose"], "Session with Dale Cooper")
        self.assertEqual(reverted_note["publicDetails"], "Dale Cooper's public details")
        self.assertIsNone(reverted_note["location"])

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["purpose"], "Session with Dale Cooper")
        self.assertEqual(reverted_note["publicDetails"], "Dale Cooper's public details")
        self.assertIsNone(reverted_note["location"])

    def test_revert_note_mutation_restores_note_details(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Update note purpose, public details, point, and address
        2. Save now as revert_before_timestamp
        3. Update note purpose, public details, point, and address
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has details from Step 1
        6. Save now as revert_before_timestamp
        7. Revert to revert_before_timestamp from Step 6
        8. Assert note has details from Step 1
        """
        note_id = self.note["id"]

        json_address_input, _ = self._get_address_inputs()
        location_input = {
            "address": json_address_input,
            "point": self.point,
            "pointOfInterest": self.point_of_interest,
        }
        # Update - should be persisted
        self._update_note_fixture(
            {
                "id": note_id,
                "purpose": "Updated purpose",
                "publicDetails": "Updated Body",
                "location": location_input,
            }
        )

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        other_json_address_input, _ = self._get_address_inputs(street_number_override="999")
        other_location_input = {
            "address": other_json_address_input,
            "point": [-118.0, 34.0],
            "pointOfInterest": "Discarded POI",
        }
        # Update - should be discarded
        self._update_note_fixture(
            {
                "id": note_id,
                "purpose": "Discarded purpose",
                "publicDetails": "Discarded Body",
                "location": other_location_input,
            }
        )

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        note_fields = """
            purpose
            publicDetails
            location {
                address {
                    street
                }
            }
        """
        expected_query_count = 17
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["purpose"], "Updated purpose")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")
        self.assertEqual(reverted_note["location"]["address"]["street"], "106 West 1st Street")

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["purpose"], "Updated purpose")
        self.assertEqual(reverted_note["publicDetails"], "Updated Body")
        self.assertEqual(reverted_note["location"]["address"]["street"], "106 West 1st Street")

    def test_revert_note_mutation_reverts_updated_location(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Add a location
        2. Save now as revert_before_timestamp
        3. Update the location
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has location from Step 1
        """
        note_id = self.note["id"]
        json_address_input, _ = self._get_address_inputs()

        location = {
            "address": json_address_input,
            "point": self.point,
            "pointOfInterest": self.point_of_interest,
        }
        variables = {
            "id": note_id,
            "location": location,
        }

        # Update - should be persisted
        self._update_note_location_fixture(variables)

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        discarded_json_address_input, discarded_address_input = self._get_address_inputs(street_number_override="104")
        discarded_point = [-118.0, 34.0]
        discarded_point_of_interest = "Another interesting point"

        location = {
            "address": discarded_json_address_input,
            "point": discarded_point,
            "pointOfInterest": discarded_point_of_interest,
        }
        variables = {
            "id": note_id,
            "location": location,
        }
        note_fields = """
            location {
                address {
                    street
                }
                point
                pointOfInterest
            }
        """

        # Update - should be discarded
        note_location_to_discard = self._update_note_location_fixture(variables)["data"]["updateNoteLocation"]
        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

        # Confirm the note location was updated
        self.assertEqual("104 West 1st Street", note_location_to_discard["location"]["address"]["street"])
        self.assertEqual(discarded_point, note_location_to_discard["location"]["point"])
        self.assertEqual(discarded_point_of_interest, note_location_to_discard["location"]["pointOfInterest"])

        expected_query_count = 17
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["location"]["address"]["street"], self.street)
        self.assertEqual(reverted_note["location"]["point"], self.point)
        self.assertEqual(reverted_note["location"]["pointOfInterest"], self.point_of_interest)

    # @skip("not implemented")
    # def test_revert_note_mutation_removes_added_new_tasks(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Create 1 new purpose and 1 new next step
    #     2. Save now as revert_before_timestamp
    #     3. Create another purpose and 1 new next step
    #     4. Revert to revert_before_timestamp from Step 2
    #     5. Assert note has only the associations from Step 2
    #     """
    #     note_id = self.note["id"]
    #     note = Note.objects.get(id=note_id)
    #     total_task_count = Task.objects.count()

    #     # Add associations that will be persisted
    #     self._create_note_task_fixture(
    #         {
    #             "title": "New Note Purpose",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "PURPOSE",
    #         }
    #     )

    #     self._create_note_task_fixture(
    #         {
    #             "title": "New Note Next Step",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     # Add associations that will be discarded
    #     self._create_note_task_fixture(
    #         {
    #             "title": "Discarded Purpose",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "PURPOSE",
    #         }
    #     )

    #     self._create_note_task_fixture(
    #         {
    #             "title": "Discarded Next Step",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    #     # Revert to revert_before_timestamp state
    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

    #     expected_query_count = 42
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, self.task_note_fields)["data"]["revertNote"]

    #     self.assertEqual(len(reverted_note["purposes"]), 1)
    #     self.assertEqual(len(reverted_note["nextSteps"]), 1)

    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     # Assert that discarded tasks were deleted
    #     self.assertEqual(Task.objects.count(), total_task_count + 2)

    # @skip("Functionality for adding existing Tasks to a Note is not complete")
    # def test_revert_note_mutation_removes_added_existing_tasks(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Add 1 purpose and 1 next step
    #     2. Save now as revert_before_timestamp
    #     3. Add another purpose and next step
    #     4. Revert to revert_before_timestamp from Step 2
    #     5. Assert note has only the associations from Step 2
    #     """
    #     note_id = self.note["id"]
    #     note = Note.objects.get(id=note_id)

    #     # Add associations that will be persisted
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.purpose_1["id"],
    #             "taskType": "PURPOSE",
    #         }
    #     )
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.next_step_1["id"],
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     # Add associations that will be discarded
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.purpose_2["id"],
    #             "taskType": "PURPOSE",
    #         }
    #     )
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.next_step_2["id"],
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    #     # Revert to revert_before_timestamp state
    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

    #     expected_query_count = 27
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, self.task_note_fields)["data"]["revertNote"]

    #     self.assertEqual(len(reverted_note["purposes"]), 1)
    #     self.assertEqual(len(reverted_note["nextSteps"]), 1)

    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     # Assert that unassociated tasks were not deleted
    #     self.assertEqual(
    #         Task.objects.filter(id__in=[self.next_step_2["id"], self.purpose_2["id"]]).count(),
    #         2,
    #     )

    def test_revert_note_mutation_removes_added_service_requests(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Add 1 requested service and 1 provided service
        2. Save now as revert_before_timestamp
        3. Add another requested service and provided service
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]
        note = Note.objects.get(id=note_id)
        blanket_svc = OrganizationService.objects.get(label="Blanket")
        water_svc = OrganizationService.objects.get(label="Water")
        clothes_svc = OrganizationService.objects.get(label="Clothes")
        food_svc = OrganizationService.objects.get(label="Food")

        # Add associations that will be persisted
        self._create_note_service_request_fixture(
            {
                "serviceId": str(blanket_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "serviceId": str(water_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )
        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Add associations that will be discarded
        discarded_requested_service_id = self._create_note_service_request_fixture(
            {
                "serviceId": str(clothes_svc.pk),
                "serviceOther": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        discarded_provided_service_id = self._create_note_service_request_fixture(
            {
                "serviceId": str(food_svc.pk),
                "serviceOther": None,
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        # Revert to revert_before_timestamp state
        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

        expected_query_count = 42
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, self.service_note_fields)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 1)
        self.assertEqual(len(reverted_note["requestedServices"]), 1)

        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        # Assert that discarded service requests were deleted
        self.assertEqual(
            ServiceRequest.objects.filter(
                id__in=[discarded_requested_service_id, discarded_provided_service_id]
            ).count(),
            0,
        )

    def test_revert_note_mutation_removes_added_custom_service_requests(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Add 1 custom requested service and 1 custom provided service
        2. Save now as revert_before_timestamp
        3. Add another custom requested service and custom provided service
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]
        note = Note.objects.get(id=note_id)

        # Add associations that will be persisted
        self._create_note_service_request_fixture(
            {
                "serviceOther": "Other Service",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "serviceOther": "Other Service",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Add associations that will be discarded
        discarded_requested_service_id = self._create_note_service_request_fixture(
            {
                "serviceOther": "Discarded Other Service",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        discarded_provided_service_id = self._create_note_service_request_fixture(
            {
                "serviceOther": "Discarded Other Service",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]["id"]

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        # Revert to revert_before_timestamp state
        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

        expected_query_count = 44
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, self.service_note_fields)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 1)
        self.assertEqual(len(reverted_note["requestedServices"]), 1)

        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        # Assert that discarded service requests were deleted
        self.assertEqual(
            ServiceRequest.objects.filter(
                id__in=[discarded_requested_service_id, discarded_provided_service_id]
            ).count(),
            0,
        )

    # @skip("not implemented")
    # def test_revert_note_mutation_returns_removed_new_tasks(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Create 2 new purposes and 2 new next steps
    #     2. Save now as revert_before_timestamp
    #     3. Delete 1 purpose and 1 next step
    #     4. Revert to revert_before_timestamp from Step 2
    #     5. Assert note has only the associations from Step 2
    #     """
    #     note_id = self.note["id"]
    #     note = Note.objects.get(id=note_id)
    #     total_task_count = Task.objects.count()

    #     # Add associations that will be persisted
    #     for i in [1, 2]:
    #         purpose_response = self._create_note_task_fixture(
    #             {
    #                 "title": f"New Note Purpose {i}",
    #                 "noteId": note_id,
    #                 "status": "TO_DO",
    #                 "taskType": "PURPOSE",
    #             }
    #         )["data"]["createNoteTask"]

    #         next_step_response = self._create_note_task_fixture(
    #             {
    #                 "title": f"New Note Next Step {i}",
    #                 "noteId": note_id,
    #                 "status": "TO_DO",
    #                 "taskType": "NEXT_STEP",
    #             }
    #         )["data"]["createNoteTask"]

    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     # Delete tasks - should be discarded
    #     self.delete_task_fixture(purpose_response["id"])
    #     self.delete_task_fixture(next_step_response["id"])

    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     # Revert to revert_before_timestamp state
    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

    #     expected_query_count = 52
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, self.task_note_fields)["data"]["revertNote"]

    #     self.assertEqual(len(reverted_note["purposes"]), 2)
    #     self.assertEqual(len(reverted_note["nextSteps"]), 2)

    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    #     self.assertEqual(Task.objects.count(), total_task_count + 4)

    # @skip("Functionality for adding existing Tasks to a Note is not complete")
    # def test_revert_note_mutation_returns_removed_existing_tasks(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Add 2 purposes and 2 next steps
    #     2. Save now as revert_before_timestamp
    #     3. Remove 1 purpose and 1 next step
    #     4. Revert to revert_before_timestamp from Step 2
    #     5. Assert note has only the associations from Step 1
    #     """
    #     note_id = self.note["id"]
    #     note = Note.objects.get(id=note_id)

    #     # Add associations that will be persisted
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.purpose_1["id"],
    #             "taskType": "PURPOSE",
    #         }
    #     )

    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.next_step_1["id"],
    #             "taskType": "NEXT_STEP",
    #         }
    #     )

    #     # Add associations that will be removed and then reverted
    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.purpose_2["id"],
    #             "taskType": "PURPOSE",
    #         }
    #     )

    #     self._add_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.next_step_2["id"],
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     # Remove task - should be discarded
    #     self._remove_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.purpose_2["id"],
    #             "taskType": "PURPOSE",
    #         }
    #     )

    #     self._remove_note_task_fixture(
    #         {
    #             "noteId": note_id,
    #             "taskId": self.next_step_2["id"],
    #             "taskType": "NEXT_STEP",
    #         }
    #     )
    #     self.assertEqual(note.purposes.count(), 1)
    #     self.assertEqual(note.next_steps.count(), 1)

    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

    #     expected_query_count = 27
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, self.task_note_fields)["data"]["revertNote"]

    #     self.assertEqual(len(reverted_note["purposes"]), 2)
    #     self.assertEqual(len(reverted_note["nextSteps"]), 2)

    #     self.assertEqual(note.purposes.count(), 2)
    #     self.assertEqual(note.next_steps.count(), 2)

    def test_revert_note_mutation_returns_removed_service_requests(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Add 2 requested service and 2 provided service
        2. Save now as revert_before_timestamp
        3. Remove 1 requested service and 1 provided service
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has only the associations from Step 1
        """
        note_id = self.note["id"]
        note = Note.objects.get(id=note_id)
        total_service_request_count = ServiceRequest.objects.count()

        blanket_svc = OrganizationService.objects.get(label="Blanket")
        water_svc = OrganizationService.objects.get(label="Water")
        clothes_svc = OrganizationService.objects.get(label="Clothes")
        food_svc = OrganizationService.objects.get(label="Food")

        # Add associations that will be persisted
        self._create_note_service_request_fixture(
            {
                "serviceId": str(blanket_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "serviceId": str(water_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )
        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        # Add associations that will be removed and then reverted
        reverted_requested_service = self._create_note_service_request_fixture(
            {
                "serviceId": str(clothes_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]

        reverted_provided_service = self._create_note_service_request_fixture(
            {
                "serviceId": str(food_svc.pk),
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Delete service requests - should be discarded
        self._delete_service_request_fixture(reverted_provided_service["id"])
        self._delete_service_request_fixture(reverted_requested_service["id"])

        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

        expected_query_count = 48
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, self.service_note_fields)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 2)
        self.assertEqual(len(reverted_note["requestedServices"]), 2)

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        self.assertEqual(ServiceRequest.objects.count(), total_service_request_count + 4)

    def test_revert_note_mutation_returns_removed_custom_service_requests(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Add 2 custom requested service and 2 custom provided service
        2. Save now as revert_before_timestamp
        3. Remove 1 custom requested service and 1 custom provided service
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has only the associations from Step 1
        """
        note_id = self.note["id"]
        note = Note.objects.get(id=note_id)
        total_service_request_count = ServiceRequest.objects.count()

        # Add associations that will be persisted
        self._create_note_service_request_fixture(
            {
                "serviceOther": "Other Service",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )
        self._create_note_service_request_fixture(
            {
                "serviceOther": "Other Service",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )

        # Add associations that will be removed and then reverted
        reverted_requested_service = self._create_note_service_request_fixture(
            {
                "serviceOther": "Retrieved Other Service",
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]

        reverted_provided_service = self._create_note_service_request_fixture(
            {
                "serviceOther": "Retrieved Other Service",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Delete service requests - should be discarded
        self._delete_service_request_fixture(reverted_provided_service["id"])
        self._delete_service_request_fixture(reverted_requested_service["id"])

        self.assertEqual(note.provided_services.count(), 1)
        self.assertEqual(note.requested_services.count(), 1)

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

        expected_query_count = 48
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, self.service_note_fields)["data"]["revertNote"]

        self.assertEqual(len(reverted_note["providedServices"]), 2)
        self.assertEqual(len(reverted_note["requestedServices"]), 2)

        self.assertEqual(note.provided_services.count(), 2)
        self.assertEqual(note.requested_services.count(), 2)

        self.assertEqual(ServiceRequest.objects.count(), total_service_request_count + 4)

    # @skip("not implemented")
    # def test_revert_note_mutation_restores_updated_tasks(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Create 1 purpose and 1 next step
    #     2. Save now as revert_before_timestamp
    #     3. Update the purpose and next step titles
    #     4. Revert to revert_before_timestamp from Step 2
    #     5. Assert note has only the associations from Step 2
    #     """
    #     note_id = self.note["id"]

    #     # Add associations that will be persisted
    #     purpose = self._create_note_task_fixture(
    #         {
    #             "title": "Purpose Title",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "PURPOSE",
    #         }
    #     )["data"]["createNoteTask"]

    #     next_step = self._create_note_task_fixture(
    #         {
    #             "title": "Next Step Title",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "NEXT_STEP",
    #         }
    #     )["data"]["createNoteTask"]

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     # Make updates that will be discarded
    #     self.update_task_fixture({"id": purpose["id"], "title": "Discarded Purpose Title"})
    #     self.update_task_fixture({"id": next_step["id"], "title": "Discarded Next Step Title"})

    #     # Revert to revert_before_timestamp state
    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}

    #     expected_query_count = 24
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, self.task_note_fields)["data"]["revertNote"]

    #     self.assertEqual(reverted_note["purposes"][0]["title"], "Purpose Title")
    #     self.assertEqual(reverted_note["nextSteps"][0]["title"], "Next Step Title")

    # @skip("not implemented")
    # def test_revert_note_mutation_restores_updated_task_location(self) -> None:
    #     """
    #     Test Actions:
    #     0. Setup creates a note
    #     1. Create 1 next step
    #     2. Update next step location
    #     3. Save now as revert_before_timestamp
    #     3. Update the next step location again
    #     4. Revert to revert_before_timestamp from Step 3
    #     5. Assert note has only the associations from Step 2
    #     """
    #     note_id = self.note["id"]

    #     task = self._create_note_task_fixture(
    #         {
    #             "title": "Next Step Title",
    #             "noteId": note_id,
    #             "status": "TO_DO",
    #             "taskType": "NEXT_STEP",
    #         }
    #     )["data"]["createNoteTask"]

    #     json_address_input, address_input = self._get_address_inputs()
    #     location = {
    #         "address": json_address_input,
    #         "point": self.point,
    #         "pointOfInterest": self.point_of_interest,
    #     }

    #     self._update_task_location_fixture({"id": task["id"], "location": location})

    #     # Select a moment to revert to
    #     revert_before_timestamp = timezone.now()

    #     discarded_json_address_input, discarded_address_input = self._get_address_inputs(street_number_override="104")
    #     discarded_point = [-118.0, 34.0]
    #     discarded_point_of_interest = "Another interesting point"
    #     discarded_location = {
    #         "address": discarded_json_address_input,
    #         "point": discarded_point,
    #         "pointOfInterest": discarded_point_of_interest,
    #     }
    #     self._update_task_location_fixture({"id": task["id"], "location": discarded_location})

    #     # Revert to revert_before_timestamp state
    #     variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
    #     note_fields = """
    #         nextSteps {
    #             id
    #             title
    #             location {
    #                 address {
    #                     street
    #                     city
    #                     state
    #                     zipCode
    #                 }
    #                 point
    #                 pointOfInterest
    #             }
    #         }
    #     """

    #     expected_query_count = 20
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

    #     next_step = reverted_note["nextSteps"][0]
    #     self.assertEqual(next_step["location"]["address"]["street"], self.street)
    #     self.assertEqual(next_step["location"]["point"], self.point)
    #     self.assertEqual(next_step["location"]["pointOfInterest"], self.point_of_interest)

    @skip("not implemented")
    def test_revert_note_mutation_restores_updated_custom_service_requests(self) -> None:
        """
        Test Actions:
        0. Setup creates a note
        1. Create 1 custom service request and 1 custom provided service
        2. Save now as revert_before_timestamp
        3. Update the service request and provided service titles
        4. Revert to revert_before_timestamp from Step 2
        5. Assert note has only the associations from Step 2
        """
        note_id = self.note["id"]

        # Add associations that will be persisted
        provided_service = self._create_note_service_request_fixture(
            {
                "service": "OTHER",
                "serviceOther": "Other Provided Service",
                "noteId": note_id,
                "serviceRequestType": "PROVIDED",
            }
        )["data"]["createNoteServiceRequest"]

        requested_service = self._create_note_service_request_fixture(
            {
                "service": "BLANKET",
                "serviceOther": None,
                "noteId": note_id,
                "serviceRequestType": "REQUESTED",
            }
        )["data"]["createNoteServiceRequest"]

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Make updates that will be discarded
        self._update_service_request_fixture(
            {
                "id": provided_service["id"],
                "serviceOther": "Discarded Provided Service Title",
            }
        )
        self._update_service_request_fixture(
            {
                "id": requested_service["id"],
                "dueBy": "2024-03-11T11:12:13+00:00",
                "status": "COMPLETED",
            }
        )

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        note_fields = """
            providedServices {
                id
                serviceOther
            }
            requestedServices {
                id
                status
                dueBy
            }
        """

        expected_query_count = 24
        with self.assertNumQueriesWithoutCache(expected_query_count):
            reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(reverted_note["providedServices"][0]["serviceOther"], "Other Provided Service")
        self.assertEqual(reverted_note["requestedServices"][0]["status"], "TO_DO")
        self.assertEqual(reverted_note["requestedServices"][0]["dueBy"], None)

    def test_revert_note_mutation_fails_in_atomic_transaction(self) -> None:
        """
        Asserts that when revertNote mutation fails, the Note instance is not partially updated.
        """
        note_id = self.note["id"]
        self._update_note_fixture({"id": note_id, "purpose": "Updated Purpose"})

        # Select a moment to revert to
        revert_before_timestamp = timezone.now()

        # Update - should be persisted because revert fails
        self._update_note_fixture({"id": note_id, "purpose": "Discarded Purpose"})

        variables = {"id": note_id, "revertBeforeTimestamp": revert_before_timestamp}
        note_fields = """
            purpose
        """

        with patch(
            "notes.utils.note_reverter_util.NoteReverter._revert_changes_to_all_related_models",
            side_effect=Exception("oops"),
        ):
            not_reverted_note = self._revert_note_fixture(variables, note_fields)["data"]["revertNote"]

        self.assertEqual(not_reverted_note["purpose"], "Discarded Purpose")


@skip("Service Requests are not currently implemented")
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
        response_service_request = response["data"]["createServiceRequest"]
        expected_service_request = {
            "id": ANY,
            "service": "BLANKET",
            "serviceOther": None,
            "dueBy": None,
            "completedOn": None,
            "status": "TO_DO",
            "clientProfile": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(response_service_request, expected_service_request)

    @time_machine.travel("2024-03-11 12:34:56", tick=False)
    def test_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
            "dueBy": "2024-03-11T11:12:13+00:00",
            "status": "COMPLETED",
        }

        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_service_request_fixture(variables)

        updated_service_request = response["data"]["updateServiceRequest"]
        expected_service_request = {
            "id": self.service_request["id"],
            "service": "BLANKET",
            "serviceOther": None,
            "status": "COMPLETED",
            "dueBy": "2024-03-11T11:12:13+00:00",
            "completedOn": "2024-03-11T12:34:56+00:00",
            "clientProfile": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(updated_service_request, expected_service_request)

    @time_machine.travel("2024-03-11 12:34:56", tick=False)
    def test_partial_update_service_request_mutation(self) -> None:
        variables = {
            "id": self.service_request["id"],
        }

        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self._update_service_request_fixture(variables)

        updated_service_request = response["data"]["updateServiceRequest"]
        expected_service_request = {
            "id": self.service_request["id"],
            "service": "BLANKET",
            "serviceOther": None,
            "status": "TO_DO",
            "dueBy": None,
            "completedOn": None,
            "clientProfile": None,
            "createdBy": {"id": str(self.org_1_case_manager_1.pk)},
            "createdAt": "2024-03-11T10:11:12+00:00",
        }
        self.assertEqual(updated_service_request, expected_service_request)

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
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        variables = {"id": self.service_request["id"]}

        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(mutation, variables)

        self.assertIsNotNone(response["data"]["deleteServiceRequest"])

        with self.assertRaises(ServiceRequest.DoesNotExist):
            ServiceRequest.objects.get(id=self.service_request["id"])
