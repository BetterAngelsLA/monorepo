import datetime
from typing import Any

from accounts.models import User
from clients.models import ClientProfile
from django.test import TestCase
from django.utils import timezone
from model_bakery import baker

from shelters.enums import ReservationStatusChoices
from shelters.models import Bed, Reservation, Room, Shelter
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class ReservationMutationTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.room_1 = baker.make(Room, shelter=self.shelter, name="Room-101")
        self.room_2 = baker.make(Room, shelter=self.shelter, name="Room-202")
        self.bed_1 = baker.make(Bed, shelter=self.shelter, room=self.room_1, name="Bed-1")
        self.bed_2 = baker.make(Bed, shelter=self.shelter, room=self.room_2, name="Bed-2")
        self.client_1 = baker.make(ClientProfile)
        self.client_2 = baker.make(ClientProfile)

        self.reservation_fields = """
            id
            status
            startDate
            duration
            notes
            checkedInAt
            checkedOutAt
            bed { id }
            room { id }
            shelter { id }
            createdById
            clients {
                clientProfile {
                    id
                    firstName
                    lastName
                    middleName
                    nickname
                    californiaId
                    dateOfBirth
                    email
                }
                isPrimary
            }
        """


class CreateReservationMutationTestCase(ReservationMutationTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = f"""
            mutation CreateReservation($data: CreateReservationInput!) {{
                createReservation(data: $data) {{
                    ... on ReservationType {{
                        {self.reservation_fields}
                    }}
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                }}
            }}
        """

    def test_create_reservation_with_bed(self) -> None:
        initial_count = Reservation.objects.count()

        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createReservation"]
        self.assertEqual(data["status"], "CONFIRMED")
        self.assertEqual(data["bed"]["id"], str(self.bed_1.pk))
        self.assertIsNotNone(data["id"])
        self.assertEqual(Reservation.objects.count(), initial_count + 1)

    def test_create_room_only_reservation(self) -> None:
        variables: dict[str, Any] = {
            "data": {
                "roomId": str(self.room_2.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createReservation"]
        self.assertEqual(data["status"], "CONFIRMED")
        self.assertEqual(data["room"]["id"], str(self.room_2.pk))
        self.assertIsNone(data["bed"])

    def test_create_reservation_requires_bed_or_room(self) -> None:
        """Omitting bedId and roomId (but providing required clients) returns a validation error."""
        variables: dict[str, Any] = {
            "data": {
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("bed or room", messages[0]["message"])

    def test_create_reservation_bed_out_of_service(self) -> None:
        self.bed_1.maintenance_flag = True
        self.bed_1.save()

        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")

    def test_create_reservation_bed_in_turnaround(self) -> None:
        now = timezone.now()
        # Create a completed reservation with checkout after last_cleaned
        baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.COMPLETED,
            checked_out_at=now + datetime.timedelta(hours=1),
        )

        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")

    def test_create_reservation_room_out_of_service(self) -> None:
        self.room_2.maintenance_flag = True
        self.room_2.save()

        variables: dict[str, Any] = {
            "data": {
                "roomId": str(self.room_2.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertIn("room", messages[0]["message"].lower())

    def test_create_reservation_duplicate_bed(self) -> None:
        baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.CONFIRMED,
        )

        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)

    def test_create_reservation_wrong_org_rejected(self) -> None:
        other_org_shelter = shelter_recipe.make()
        other_bed = baker.make(Bed, shelter=other_org_shelter)

        variables: dict[str, Any] = {
            "data": {
                "bedId": str(other_bed.pk),
                "clients": [{"clientProfileId": str(self.client_1.pk)}],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn(f"Bed matching ID {other_bed.pk} could not be found.", messages[0]["message"])

    def test_create_reservation_with_clients(self) -> None:
        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [
                    {"clientProfileId": str(self.client_1.pk), "isPrimary": True},
                    {"clientProfileId": str(self.client_2.pk), "isPrimary": False},
                ],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createReservation"]
        self.assertIsNotNone(data["id"])
        self.assertEqual(len(data["clients"]), 2)
        client_map = {c["clientProfile"]["id"]: c["isPrimary"] for c in data["clients"]}
        self.assertTrue(client_map[str(self.client_1.pk)])
        self.assertFalse(client_map[str(self.client_2.pk)])

    def test_create_reservation_without_clients_returns_error(self) -> None:
        """Sending an empty clients list triggers the service-level validation error."""
        variables: dict[str, Any] = {
            "data": {
                "bedId": str(self.bed_1.pk),
                "clients": [],
            }
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["createReservation"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("client", messages[0]["message"].lower())


class UpdateReservationMutationTestCase(ReservationMutationTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.reservation = baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.CONFIRMED,
        )

        self.mutation = f"""
            mutation UpdateReservation($id: ID!, $data: UpdateReservationInput!) {{
                updateReservation(id: $id, data: $data) {{
                    ... on ReservationType {{
                        {self.reservation_fields}
                    }}
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                }}
            }}
        """

    def test_update_reservation(self) -> None:
        variables: dict[str, Any] = {
            "id": str(self.reservation.pk),
            "data": {
                "status": "CHECKED_IN",
                "notes": "Updated notes",
                "duration": 14,
            },
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateReservation"]
        self.assertEqual(data["status"], "CHECKED_IN")
        self.assertEqual(data["notes"], "Updated notes")
        self.assertEqual(data["duration"], 14)

        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.status, ReservationStatusChoices.CHECKED_IN)
        self.assertEqual(self.reservation.notes, "Updated notes")

    def test_update_reservation_to_completed(self) -> None:
        self.assertIsNone(self.reservation.checked_out_at)

        variables: dict[str, Any] = {"id": str(self.reservation.pk), "data": {"status": "COMPLETED"}}

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateReservation"]
        self.assertEqual(data["status"], "COMPLETED")
        self.assertIsNotNone(data["checkedOutAt"])

        self.reservation.refresh_from_db()
        self.assertIsNotNone(self.reservation.checked_out_at)

    def test_update_reservation_to_checked_in(self) -> None:
        self.assertIsNone(self.reservation.checked_in_at)

        variables: dict[str, Any] = {
            "id": str(self.reservation.pk),
            "data": {"status": "CHECKED_IN"},
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateReservation"]
        self.assertEqual(data["status"], "CHECKED_IN")
        self.assertIsNotNone(data["checkedInAt"])

        self.reservation.refresh_from_db()
        self.assertIsNotNone(self.reservation.checked_in_at)

    def test_update_reservation_patch_semantics(self) -> None:
        variables: dict[str, Any] = {
            "id": str(self.reservation.pk),
            "data": {"notes": "New notes"},
        }

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateReservation"]
        self.assertEqual(data["notes"], "New notes")
        self.assertEqual(data["status"], "CONFIRMED")

        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.notes, "New notes")
        self.assertIsNone(self.reservation.duration)


class DeleteReservationMutationTestCase(ReservationMutationTestCase):
    def test_delete_reservations(self) -> None:
        to_delete = baker.make(
            Reservation,
            bed=self.bed_1,
            status=ReservationStatusChoices.CONFIRMED,
        )
        other = baker.make(
            Reservation,
            bed=self.bed_2,
            status=ReservationStatusChoices.CONFIRMED,
        )

        mutation = """
            mutation DeleteReservations($data: BulkDeleteInput!) {
                deleteReservations(data: $data) {
                    ... on BulkDeleteResult {
                        ids
                    }
                }
            }
        """

        variables: dict[str, Any] = {"data": {"ids": [str(to_delete.pk)]}}

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        result = response["data"]["deleteReservations"]
        self.assertEqual(len(result["ids"]), 1)
        self.assertIn(str(to_delete.pk), result["ids"])

        self.assertFalse(Reservation.objects.filter(pk=to_delete.pk).exists())
        self.assertTrue(Reservation.objects.filter(pk=other.pk).exists())


class ReservationMutationPermissionTestCase(ReservationMutationTestCase):
    """Reservation mutations are gated on the specific Reservation permission.

    A read-only viewer (Shelter + Room + Bed + Reservation VIEW grants, no
    ADD/CHANGE/DELETE) can read reservations but cannot mutate them: creates
    fail with a PERMISSION OperationInfo, updates/deletes fail closed as
    not-found (ADR 0001 §2.6). The operator (SHELTER_OPERATOR) succeeds.
    """

    CREATE_MUTATION = """
        mutation CreateReservation($data: CreateReservationInput!) {
            createReservation(data: $data) {
                ... on ReservationType {
                    id
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    UPDATE_MUTATION = """
        mutation UpdateReservation($id: ID!, $data: UpdateReservationInput!) {
            updateReservation(id: $id, data: $data) {
                ... on ReservationType {
                    id
                    notes
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    DELETE_MUTATION = """
        mutation DeleteReservations($data: BulkDeleteInput!) {
            deleteReservations(data: $data) {
                ... on BulkDeleteResult {
                    ids
                }
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        # Fixture reservation on bed_2 so bed_1 stays free for the create tests.
        self.reservation = baker.make(Reservation, bed=self.bed_2, status=ReservationStatusChoices.CONFIRMED)
        self.viewer = baker.make(User)
        self.org.users.add(self.viewer)
        for perm in (Shelter.perms.VIEW, Room.perms.VIEW, Bed.perms.VIEW, Reservation.perms.VIEW):
            self._grant_permission(self.viewer, perm, self.org, role_name="Reservation Read Only")

    # ── createReservation (ADD) ────────────────────────────────────────────

    def test_create_reservation_succeeds_for_user_with_add_permission(self) -> None:
        self.graphql_client.force_login(self.operator)

        response = self.execute_graphql(
            self.CREATE_MUTATION,
            {"data": {"bedId": str(self.bed_1.pk), "clients": [{"clientProfileId": str(self.client_1.pk)}]}},
        )

        self.assertIsNone(response.get("errors"))
        created_id = response["data"]["createReservation"]["id"]
        self.assertTrue(Reservation.objects.filter(pk=created_id).exists())

    def test_create_reservation_denied_for_user_without_add_permission(self) -> None:
        self.graphql_client.force_login(self.viewer)

        response = self.execute_graphql(
            self.CREATE_MUTATION,
            {"data": {"bedId": str(self.bed_1.pk), "clients": [{"clientProfileId": str(self.client_1.pk)}]}},
        )

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "createReservation", "do not have permission", kind="PERMISSION")
        self.assertFalse(Reservation.objects.filter(created_by=self.viewer).exists())

    # ── updateReservation (CHANGE) ─────────────────────────────────────────

    def test_update_reservation_succeeds_for_user_with_change_permission(self) -> None:
        self.graphql_client.force_login(self.operator)

        response = self.execute_graphql(
            self.UPDATE_MUTATION,
            {"id": str(self.reservation.pk), "data": {"notes": "Updated notes"}},
        )

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["updateReservation"]["notes"], "Updated notes")
        self.reservation.refresh_from_db()
        self.assertEqual(self.reservation.notes, "Updated notes")

    def test_update_reservation_denied_for_user_without_change_permission(self) -> None:
        self.graphql_client.force_login(self.viewer)

        response = self.execute_graphql(
            self.UPDATE_MUTATION,
            {"id": str(self.reservation.pk), "data": {"notes": "Nope"}},
        )

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "updateReservation", "Reservation matching ID", kind="ERROR")
        self.reservation.refresh_from_db()
        self.assertIsNone(self.reservation.notes)

    # ── deleteReservations (DELETE) ────────────────────────────────────────

    def test_delete_reservations_succeeds_for_user_with_delete_permission(self) -> None:
        self.graphql_client.force_login(self.operator)

        response = self.execute_graphql(self.DELETE_MUTATION, {"data": {"ids": [str(self.reservation.pk)]}})

        self.assertIsNone(response.get("errors"))
        self.assertIn(str(self.reservation.pk), response["data"]["deleteReservations"]["ids"])
        self.assertFalse(Reservation.objects.filter(pk=self.reservation.pk).exists())

    def test_delete_reservations_denied_for_user_without_delete_permission(self) -> None:
        self.graphql_client.force_login(self.viewer)

        response = self.execute_graphql(self.DELETE_MUTATION, {"data": {"ids": [str(self.reservation.pk)]}})

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "deleteReservations", "No matching reservations found", kind="ERROR")
        self.assertTrue(Reservation.objects.filter(pk=self.reservation.pk).exists())
