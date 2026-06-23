from accounts.tests.baker_recipes import organization_recipe
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ReservationStatusChoices, StatusChoices
from shelters.models import Bed, Reservation, Room
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class ReservationQueriesTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(
            organization=self.org,
            status=StatusChoices.APPROVED,
            is_private=False,
        )
        self.room = baker.make(Room, shelter=self.shelter, name="Room-101")
        self.bed = baker.make(
            Bed,
            shelter=self.shelter,
            room=self.room,
            name="Bed-1",
        )

        self.reservation_query = f"""
            query ($id: ID!) {{
                reservation(pk: $id) {{
                    {self.reservation_fields}
                }}
            }}
        """

        self.reservations_query = f"""
            query ($filters: ReservationFilter, $pagination: OffsetPaginationInput) {{
                reservations(filters: $filters, pagination: $pagination) {{
                    totalCount
                    pageInfo {{
                        offset
                        limit
                    }}
                    results {{
                        {self.reservation_fields}
                    }}
                }}
            }}
        """


class ReservationQueryTestCase(ReservationQueriesTestCase):
    def test_reservation_query(self) -> None:
        reservation = baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
            notes="Test reservation",
        )

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.reservation_query, variables={"id": str(reservation.pk)})
        self.assertIsNone(response.get("errors"))

        data = response["data"]["reservation"]
        self.assertEqual(data["id"], str(reservation.pk))
        self.assertEqual(data["status"], ReservationStatusChoices.CONFIRMED.name)
        self.assertEqual(data["notes"], "Test reservation")
        self.assertEqual(data["bed"], {"id": str(self.bed.pk)})
        self.assertEqual(data["room"], None)
        self.assertEqual(data["shelter"], {"id": str(self.shelter.pk)})


class ReservationsQueryTestCase(ReservationQueriesTestCase):
    def test_reservations_query(self) -> None:
        baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
        )
        baker.make(
            Reservation,
            room=self.room,
            bed=None,
            status=ReservationStatusChoices.CHECKED_IN,
        )

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={"pagination": {"offset": 0, "limit": 10}},
            )
        self.assertIsNone(response.get("errors"))

        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 2)

    def test_reservations_query_filters_by_shelter_id_via_bed(self) -> None:
        """Reservations with a bed belonging to the shelter are returned."""
        reservation = baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
        )

        other_shelter = shelter_recipe.make(organization=self.org)
        other_bed = baker.make(Bed, shelter=other_shelter, name="Bed-Other")
        other_reservation = baker.make(
            Reservation,
            bed=other_bed,
            status=ReservationStatusChoices.CONFIRMED,
        )

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={
                    "filters": {"shelterId": str(self.shelter.pk)},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(reservation.pk))
        self.assertNotIn(
            str(other_reservation.pk),
            [r["id"] for r in payload["results"]],
        )

    def test_reservations_query_filters_by_shelter_id_via_room(self) -> None:
        """Reservations with a room (no bed) belonging to the shelter are returned."""
        room_only_reservation = baker.make(
            Reservation,
            room=self.room,
            bed=None,
            status=ReservationStatusChoices.CONFIRMED,
        )

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={
                    "filters": {"shelterId": str(self.shelter.pk)},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(room_only_reservation.pk))

    def test_reservations_query_filters_by_shelter_id_both_bed_and_room(self) -> None:
        """Reservations with both a bed and room in the same shelter match once."""
        reservation_with_both = baker.make(
            Reservation,
            bed=self.bed,
            room=self.room,
            status=ReservationStatusChoices.CONFIRMED,
        )

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={
                    "filters": {"shelterId": str(self.shelter.pk)},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(reservation_with_both.pk))

    def test_reservations_query_excludes_other_org_reservations(self) -> None:
        baker.make(
            Reservation,
            bed=self.bed,
            status=ReservationStatusChoices.CONFIRMED,
        )
        other_org = organization_recipe.make()
        other_shelter = shelter_recipe.make(organization=other_org)
        other_bed = baker.make(Bed, shelter=other_shelter, name="Other-Bed")
        baker.make(
            Reservation,
            bed=other_bed,
            status=ReservationStatusChoices.CONFIRMED,
        )

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={"pagination": {"offset": 0, "limit": 10}},
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 1)

    def test_reservations_query_without_permission_returns_empty(self) -> None:
        self.operator.user_permissions.clear()

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={"pagination": {"offset": 0, "limit": 10}},
            )

        payload = response["data"]["reservations"]
        self.assertEqual(payload["totalCount"], 0)
        self.assertEqual(payload["results"], [])

    def test_reservations_query_unauthenticated(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.reservations_query,
                variables={"pagination": {"offset": 0, "limit": 10}},
            )

        self.assertGraphQLUnauthenticated(response)
