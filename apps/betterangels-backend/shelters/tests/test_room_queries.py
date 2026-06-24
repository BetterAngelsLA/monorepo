from accounts.tests.baker_recipes import organization_recipe
from django.test import TestCase
from shelters.enums import RoomStatusChoices, RoomStyleChoices, StatusChoices
from shelters.models import Bed, Room
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class RoomQueriesTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(
            organization=self.org,
            status=StatusChoices.APPROVED,
            is_private=False,
        )
        self.room = Room.objects.create(
            shelter=self.shelter,
            name="Room-101",
            status=RoomStatusChoices.AVAILABLE,
            type=RoomStyleChoices.SINGLE_ROOM,
            notes="Corner room",
            amenities="WiFi",
            medical_respite=True,
        )

        self.room_query = f"""
            query ($id: ID!) {{
                room(pk: $id) {{
                    {self.room_fields}
                }}
            }}
        """

        self.rooms_query = f"""
            query ($filters: RoomFilter, $pagination: OffsetPaginationInput) {{
                rooms(filters: $filters, pagination: $pagination) {{
                    totalCount
                    pageInfo {{
                        offset
                        limit
                    }}
                    results {{
                        {self.room_fields}
                    }}
                }}
            }}
        """


class RoomQueryTestCase(RoomQueriesTestCase):
    def test_room_query(self) -> None:
        expected_query_count = 10
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.room_query, variables={"id": str(self.room.pk)})
        self.assertIsNone(response.get("errors"))

        room = response["data"]["room"]
        self.assertEqual(room["id"], str(self.room.pk))
        self.assertEqual(room["amenities"], "WiFi")
        self.assertEqual(room["lastCleanedInspected"], None)
        self.assertEqual(room["maintenanceFlag"], False)
        self.assertEqual(room["medicalRespite"], True)
        self.assertEqual(room["name"], "Room-101")
        self.assertEqual(room["notes"], "Corner room")
        self.assertEqual(room["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertEqual(room["storage"], False)
        self.assertEqual(room["type"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(room["typeOther"], None)
        self.assertEqual(room["accessibility"], [])
        self.assertEqual(room["demographics"], [])
        self.assertEqual(room["funders"], [])
        self.assertEqual(room["pets"], [])
        self.assertEqual(room["shelter"], {"id": str(self.shelter.pk)})


class RoomsQueryTestCase(RoomQueriesTestCase):
    def test_rooms_query_returns_org_rooms(self) -> None:
        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.rooms_query, variables={"pagination": {"offset": 0, "limit": 10}})
        self.assertIsNone(response.get("errors"))

        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)

        room = payload["results"][0]
        self.assertEqual(room["id"], str(self.room.pk))
        self.assertEqual(room["amenities"], "WiFi")
        self.assertEqual(room["lastCleanedInspected"], None)
        self.assertEqual(room["maintenanceFlag"], False)
        self.assertEqual(room["medicalRespite"], True)
        self.assertEqual(room["name"], "Room-101")
        self.assertEqual(room["notes"], "Corner room")
        self.assertEqual(room["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertEqual(room["storage"], False)
        self.assertEqual(room["type"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(room["typeOther"], None)
        self.assertEqual(room["accessibility"], [])
        self.assertEqual(room["demographics"], [])
        self.assertEqual(room["funders"], [])
        self.assertEqual(room["pets"], [])
        self.assertEqual(room["shelter"], {"id": str(self.shelter.pk)})

    def test_rooms_query_filters_by_shelter_id(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.org)
        other_room = Room.objects.create(shelter=other_shelter, name="Room-201")

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.rooms_query,
                variables={
                    "filters": {"shelterId": str(self.shelter.pk)},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.room.pk))
        self.assertNotIn(str(other_room.pk), [room["id"] for room in payload["results"]])

    def test_rooms_query_filters_by_status(self) -> None:
        reserved_room = Room.objects.create(
            shelter=self.shelter,
            name="Room-102",
            status=RoomStatusChoices.RESERVED,
        )

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.rooms_query,
                variables={
                    "filters": {"status": [RoomStatusChoices.RESERVED.name]},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(reserved_room.pk))

    def test_rooms_query_filters_by_number_of_beds(self) -> None:
        room_with_beds = Room.objects.create(shelter=self.shelter, name="Room-103")
        Bed.objects.create(shelter=self.shelter, room=room_with_beds, name="Bed-1")
        Bed.objects.create(shelter=self.shelter, room=room_with_beds, name="Bed-2")

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.rooms_query,
                variables={
                    "filters": {"numberOfBeds": 2},
                    "pagination": {"offset": 0, "limit": 10},
                },
            )

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(room_with_beds.pk))

    def test_rooms_query_excludes_other_org_rooms(self) -> None:
        other_org = organization_recipe.make()
        other_shelter = shelter_recipe.make(organization=other_org)
        Room.objects.create(shelter=other_shelter, name="Other-Room")

        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.rooms_query, variables={"pagination": {"offset": 0, "limit": 10}})

        self.assertIsNone(response.get("errors"))
        payload = response["data"]["rooms"]
        self.assertEqual(payload["totalCount"], 1)
        self.assertEqual(payload["results"][0]["id"], str(self.room.pk))

    def test_rooms_query_without_permission_returns_permission_denied(self) -> None:
        self.operator.user_permissions.clear()
        self.operator.groups.clear()

        response = self.execute_graphql(self.rooms_query, variables={"pagination": {"offset": 0, "limit": 10}})

        self.assertIsNotNone(response.get("errors"))
        self.assertIn(
            "You do not have permission to perform this action in this organization.",
            response["errors"][0]["message"],
        )

    def test_rooms_query_unauthenticated(self) -> None:
        self.graphql_client.logout()

        response = self.execute_graphql(self.rooms_query, variables={"pagination": {"offset": 0, "limit": 10}})

        self.assertGraphQLUnauthenticated(response)
