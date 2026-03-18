from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from shelters.enums import BedStatusChoices, RoomStatusChoices, RoomStyleChoices
from shelters.models import Bed, Room
from shelters.tests.baker_recipes import shelter_recipe


class BedMutationTestCase(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        bed_content_type = ContentType.objects.get_for_model(Bed)
        add_bed_perm = Permission.objects.get(content_type=bed_content_type, codename="add_bed")
        self.org_1_case_manager_1.user_permissions.add(add_bed_perm)
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_bed(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        mutation = """
            mutation CreateBed($data: CreateBedInput!) {
                createBed(data: $data) {
                    ... on BedType {
                        id
                        status
                        shelter {
                            id
                        }
                    }
                }
            }
        """
        variables = {
            "data": {
                "shelterId": shelter.pk,
                "status": BedStatusChoices.AVAILABLE.name,
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createBed"]
        self.assertEqual(data["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(data["shelter"]["id"], str(shelter.pk))

        self.assertTrue(Bed.objects.filter(pk=data["id"]).exists())

    def test_create_bed_shelter_not_found(self) -> None:
        mutation = """
            mutation CreateBed($data: CreateBedInput!) {
                createBed(data: $data) {
                    ... on BedType {
                        id
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
        variables = {
            "data": {
                "shelterId": 999999,
                "status": BedStatusChoices.AVAILABLE.name,
            }
        }

        response = self.execute_graphql(mutation, variables)

        messages = response["data"]["createBed"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("Shelter matching ID 999999 could not be found.", messages[0]["message"])

    def test_create_bed_invalid_status(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        mutation = """
            mutation CreateBed($data: CreateBedInput!) {
                createBed(data: $data) {
                    ... on BedType {
                        id
                    }
                }
            }
        """
        variables = {
            "data": {
                "shelterId": shelter.pk,
                "status": "INVALID_STATUS",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "Value 'INVALID_STATUS' does not exist in 'BedStatusChoices' enum.", response["errors"][0]["message"]
        )


class RoomMutationTestCase(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        room_content_type = ContentType.objects.get_for_model(Room)
        add_room_perm = Permission.objects.get(content_type=room_content_type, codename="add_room")
        self.org_1_case_manager_1.user_permissions.add(add_room_perm)
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_create_room(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        mutation = """
            mutation CreateRoom($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType {
                        id
                        roomIdentifier
                        roomType
                        roomTypeOther
                        status
                        notes
                        amenities
                        medicalRespite
                        lastCleanedInspected
                        shelter {
                            id
                        }
                    }
                }
            }
        """
        variables = {
            "data": {
                "shelterId": shelter.pk,
                "roomIdentifier": "Room-101",
                "roomType": RoomStyleChoices.SINGLE_ROOM.name,
                "roomTypeOther": None,
                "status": RoomStatusChoices.AVAILABLE.name,
                "notes": "Corner room",
                "amenities": "WiFi, AC",
                "medicalRespite": True,
                "lastCleanedInspected": "2025-01-15T10:30:00Z",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createRoom"]
        self.assertEqual(data["roomIdentifier"], "Room-101")
        self.assertEqual(data["roomType"], RoomStyleChoices.SINGLE_ROOM.name)
        self.assertEqual(data["status"], RoomStatusChoices.AVAILABLE.name)
        self.assertEqual(data["notes"], "Corner room")
        self.assertEqual(data["amenities"], "WiFi, AC")
        self.assertTrue(data["medicalRespite"])
        self.assertEqual(data["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(data["shelter"]["id"], str(shelter.pk))
        self.assertTrue(Room.objects.filter(pk=data["id"]).exists())

    def test_create_room_duplicate_identifier(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        Room.objects.create(shelter=shelter, room_identifier="Room-101")

        mutation = """
            mutation CreateRoom($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType {
                        id
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
        variables = {
            "data": {
                "shelterId": shelter.pk,
                "roomIdentifier": "Room-101",
            }
        }

        response = self.execute_graphql(mutation, variables)

        messages = response["data"]["createRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["kind"], "VALIDATION")

    def test_create_room_shelter_not_found(self) -> None:
        mutation = """
            mutation CreateRoom($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType {
                        id
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
        variables = {
            "data": {
                "shelterId": 999999,
                "roomIdentifier": "Room-101",
            }
        }

        response = self.execute_graphql(mutation, variables)

        messages = response["data"]["createRoom"]["messages"]
        self.assertEqual(len(messages), 1)
        self.assertIn("Shelter matching ID 999999 could not be found.", messages[0]["message"])

    def test_create_room_invalid_status(self) -> None:
        shelter = shelter_recipe.make(organization=self.org_1)
        mutation = """
            mutation CreateRoom($data: CreateRoomInput!) {
                createRoom(data: $data) {
                    ... on RoomType {
                        id
                    }
                }
            }
        """
        variables = {
            "data": {
                "shelterId": shelter.pk,
                "roomIdentifier": "Room-101",
                "status": "INVALID_STATUS",
            }
        }

        response = self.execute_graphql(mutation, variables)

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 1)
        self.assertIn(
            "Value 'INVALID_STATUS' does not exist in 'RoomStatusChoices' enum.", response["errors"][0]["message"]
        )
