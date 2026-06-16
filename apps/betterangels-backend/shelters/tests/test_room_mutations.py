from accounts.tests.baker_recipes import organization_recipe
from django.test import TestCase
from model_bakery import baker
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    DemographicChoices,
    FunderChoices,
    PetChoices,
    RoomStatusChoices,
    RoomStyleChoices,
)
from shelters.models import Accessibility, Bed, Demographic, Funder, Pet, Room, Shelter
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class RoomMutationTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(organization=self.org)


class CreateRoomMutationTestCase(RoomMutationTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.mutation = f"""
            mutation ($data: CreateRoomInput!) {{
                createRoom(data: $data) {{
                    ... on RoomType {{
                        {self.room_fields}
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

    def test_create_room(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        variables = {
            "data": {
                "shelterId": self.shelter.pk,
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name],
                "amenities": "WiFi, AC",
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES.name],
                "lastCleanedInspected": "2025-01-15T10:30:00Z",
                "maintenanceFlag": True,
                "medicalRespite": True,
                "name": "Room-101",
                "notes": "Corner room",
                "pets": [PetChoices.CATS.name],
                "status": RoomStatusChoices.AVAILABLE.name,
                "storage": True,
                "type": RoomStyleChoices.SINGLE_ROOM.name,
                "typeOther": "Custom style",
            }
        }

        expected_query_count = 28
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        room = response["data"]["createRoom"]
        self.assertEqual(room["amenities"], "WiFi, AC")
        self.assertEqual(room["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(room["maintenanceFlag"], True)
        self.assertEqual(room["medicalRespite"], True)
        self.assertEqual(room["name"], "Room-101")
        self.assertEqual(room["notes"], "Corner room")
        self.assertEqual(room["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertTrue(room["storage"])
        self.assertEqual(room["type"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(room["typeOther"], "Custom style")
        self.assertEqual(len(room["accessibility"]), 1)
        self.assertEqual(room["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(room["demographics"]), 1)
        self.assertEqual(room["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(room["funders"]), 1)
        self.assertEqual(room["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(room["pets"]), 1)
        self.assertEqual(room["pets"][0]["name"], PetChoices.CATS.name)
        self.assertEqual(room["shelter"], {"id": str(self.shelter.pk)})
        self.assertTrue(Room.objects.filter(pk=room["id"]).exists())

    def test_create_room_clone_identifier(self) -> None:
        Room.objects.create(shelter=self.shelter, name="Room-101")

        variables = {"data": {"shelterId": self.shelter.pk, "name": "Room-101"}}

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        messages = response["data"]["createRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")

    def test_create_room_shelter_not_found(self) -> None:
        variables = {"data": {"shelterId": 999999, "name": "Room-101"}}

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        messages = response["data"]["createRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("Shelter matching ID 999999 could not be found.", messages[0]["message"])

    def test_create_room_invalid_status(self) -> None:
        variables = {"data": {"shelterId": self.shelter.pk, "name": "Room-101", "status": "INVALID_STATUS"}}

        expected_query_count = 1
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "Value 'INVALID_STATUS' does not exist in 'RoomStatusChoices' enum.", response["errors"][0]["message"]
        )


class UpdateRoomMutationTestCase(RoomMutationTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.mutation = f"""
            mutation ($id: ID!, $data: UpdateRoomInput!) {{
                updateRoom(id: $id, data: $data) {{
                    ... on RoomType {{
                        {self.room_fields}
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

    def test_update_room_scalar_fields(self) -> None:
        room = baker.make(
            Room,
            shelter=self.shelter,
            name="Room-101",
            status=RoomStatusChoices.AVAILABLE,
            type=RoomStyleChoices.SINGLE_ROOM,
        )
        variables = {
            "id": str(room.pk),
            "data": {
                "name": "Room-101 Updated",
                "status": RoomStatusChoices.RESERVED.name,
                "type": RoomStyleChoices.MOTEL_ROOM.name,
                "notes": "Updated notes",
            },
        }

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        updated_room = response["data"]["updateRoom"]
        self.assertEqual(updated_room["id"], str(room.pk))
        self.assertEqual(updated_room["amenities"], None)
        self.assertEqual(updated_room["lastCleanedInspected"], None)
        self.assertEqual(updated_room["maintenanceFlag"], False)
        self.assertEqual(updated_room["medicalRespite"], False)
        self.assertEqual(updated_room["name"], "Room-101 Updated")
        self.assertEqual(updated_room["notes"], "Updated notes")
        self.assertEqual(updated_room["status"], RoomStatusChoices.RESERVED.name)
        self.assertEqual(updated_room["storage"], False)
        self.assertEqual(updated_room["type"], RoomStyleChoices.MOTEL_ROOM.name)
        self.assertEqual(updated_room["typeOther"], None)
        self.assertEqual(updated_room["accessibility"], [])
        self.assertEqual(updated_room["demographics"], [])
        self.assertEqual(updated_room["funders"], [])
        self.assertEqual(updated_room["pets"], [])
        self.assertEqual(updated_room["shelter"], {"id": str(self.shelter.pk)})
        room.refresh_from_db()
        self.assertEqual(room.name, "Room-101 Updated")

    def test_update_room_patch_semantics(self) -> None:
        room = baker.make(
            Room,
            shelter=self.shelter,
            name="Room-101",
            status=RoomStatusChoices.AVAILABLE,
            type=RoomStyleChoices.SINGLE_ROOM,
            notes="Original notes",
        )
        variables = {
            "id": str(room.pk),
            "data": {"notes": "New notes"},
        }

        expected_query_count = 12
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateRoom"]
        self.assertEqual(data["name"], "Room-101")
        self.assertEqual(data["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertEqual(data["type"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(data["notes"], "New notes")

    def test_update_room_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(demographic)
        room = baker.make(Room, shelter=self.shelter, name="Room-101")
        variables = {
            "id": str(room.pk),
            "data": {"demographics": [DemographicChoices.SINGLE_MEN.name]},
        }

        expected_query_count = 16
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateRoom"]
        demographic_names = [d["name"] for d in data["demographics"]]
        self.assertEqual(demographic_names, [DemographicChoices.SINGLE_MEN.name])
        room.refresh_from_db()
        self.assertEqual(room.demographics.count(), 1)

    def test_update_room_clone_name_returns_operation_info(self) -> None:
        baker.make(Room, shelter=self.shelter, name="Room-101")
        room = baker.make(Room, shelter=self.shelter, name="Room-102")
        variables = {"id": str(room.pk), "data": {"name": "Room-101"}}

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        messages = response["data"]["updateRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")

    def test_update_room_not_found_returns_operation_info(self) -> None:
        variables = {"id": "999999", "data": {"name": "Missing"}}

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["updateRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("Room matching ID 999999 could not be found.", messages[0]["message"])

    def test_update_room_wrong_org_rejected(self) -> None:
        other_org = organization_recipe.make()
        other_org_shelter = baker.make(Shelter, organization=other_org)
        room = baker.make(Room, shelter=other_org_shelter)

        variables = {"id": str(room.pk), "data": {"name": "Unauthorized update"}}

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        messages = response["data"]["updateRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn(f"Room matching ID {room.pk} could not be found.", messages[0]["message"])

    def test_update_room_invalid_status(self) -> None:
        room = baker.make(Room, shelter=self.shelter)
        variables = {"id": str(room.pk), "data": {"status": "INVALID_STATUS"}}

        expected_query_count = 1
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "Value 'INVALID_STATUS' does not exist in 'RoomStatusChoices' enum.", response["errors"][0]["message"]
        )


class CloneRoomMutationTestCase(RoomMutationTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.mutation = f"""
            mutation ($id: ID!) {{
                cloneRoom(id: $id) {{
                    ... on RoomType {{
                        {self.room_fields}
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

    def test_clone_room(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)
        source = baker.make(
            Room,
            shelter=self.shelter,
            name="Room-101",
            status=RoomStatusChoices.AVAILABLE,
            type=RoomStyleChoices.SINGLE_ROOM,
            type_other="Custom style",
            notes="Corner room",
            amenities="WiFi, AC",
            medical_respite=True,
            storage=True,
            maintenance_flag=True,
        )
        source.demographics.add(demographic)
        source.funders.add(funder)
        source.accessibility.add(accessibility)
        source.pets.add(pet)
        Bed.objects.create(shelter=self.shelter, room=source, name="Bed 1", status=BedStatusChoices.AVAILABLE)
        Bed.objects.create(shelter=self.shelter, room=source, name="Bed 2", status=BedStatusChoices.AVAILABLE)

        variables = {"id": str(source.pk)}

        expected_query_count = 29
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["cloneRoom"]
        self.assertNotEqual(data["id"], str(source.pk))
        self.assertEqual(data["name"], "Room-101 (Copy)")
        self.assertEqual(data["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertEqual(data["type"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(data["typeOther"], "Custom style")
        self.assertEqual(data["notes"], "Corner room")
        self.assertEqual(data["amenities"], "WiFi, AC")
        self.assertTrue(data["medicalRespite"])
        self.assertTrue(data["storage"])
        self.assertTrue(data["maintenanceFlag"])
        self.assertEqual(data["shelter"], {"id": str(self.shelter.pk)})
        self.assertEqual(len(data["demographics"]), 1)
        self.assertEqual(data["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(data["funders"]), 1)
        self.assertEqual(data["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(data["accessibility"]), 1)
        self.assertEqual(data["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(data["pets"]), 1)
        self.assertEqual(data["pets"][0]["name"], PetChoices.CATS.name)

        clone = Room.objects.get(pk=data["id"])
        self.assertEqual(clone.beds.count(), 0)
        self.assertEqual(source.beds.count(), 2)
        self.assertEqual(
            set(clone.demographics.values_list("name", flat=True)),
            set(source.demographics.values_list("name", flat=True)),
        )


class DeleteRoomsMutationTestCase(RoomMutationTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.mutation = """
            mutation ($data: BulkDeleteInput!) {
                deleteRooms(data: $data) {
                    ... on BulkDeleteResult {
                        ids
                    }
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                }
            }
        """

    def test_delete_single_room(self) -> None:
        room = baker.make(Room, shelter=self.shelter, name="Room to delete")
        variables = {"data": {"ids": [str(room.pk)]}}

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteRooms"]["ids"]
        self.assertEqual(len(deleted_ids), 1)
        self.assertEqual(deleted_ids[0], str(room.pk))
        self.assertFalse(Room.objects.filter(pk=room.pk).exists())

    def test_delete_multiple_rooms(self) -> None:
        room1 = baker.make(Room, shelter=self.shelter, name="Room A")
        room2 = baker.make(Room, shelter=self.shelter, name="Room B")
        variables = {"data": {"ids": [str(room1.pk), str(room2.pk)]}}

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteRooms"]["ids"]
        self.assertEqual(deleted_ids, [str(room1.pk), str(room2.pk)])
        self.assertFalse(Room.objects.filter(pk__in=[room1.pk, room2.pk]).exists())
