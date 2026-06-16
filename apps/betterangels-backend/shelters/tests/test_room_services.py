import datetime

from accounts.models import OrganizationProfile, OrgTypeChoices
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
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
from shelters.services.room import room_clone, room_create, room_delete, room_update
from shelters.tests.baker_recipes import shelter_recipe


class RoomServiceTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.org, self.other_org = organization_recipe.make(_quantity=2)
        OrganizationProfile.objects.update_or_create(
            organization=self.org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        OrganizationProfile.objects.update_or_create(
            organization=self.other_org, defaults={"org_types": [OrgTypeChoices.SHELTER]}
        )
        self.user = baker.make(User)
        self.org.users.add(self.user)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.org_id = str(self.org.id)


class RoomCreateTestCase(RoomServiceTestCase):
    def test_creates_room_with_scalar_fields(self) -> None:
        last_cleaned = datetime.datetime(2025, 1, 15, 10, 30, tzinfo=datetime.timezone.utc)

        room = room_create(
            user=self.user,
            organization_id=self.org_id,
            data={
                "shelter_id": self.shelter.pk,
                "amenities": "WiFi, AC",
                "last_cleaned_inspected": last_cleaned,
                "medical_respite": True,
                "name": "Room-101",
                "notes": "Corner room",
                "status": RoomStatusChoices.AVAILABLE,
                "type": RoomStyleChoices.SINGLE_ROOM,
            },
        )

        self.assertEqual(room.shelter_id, self.shelter.pk)
        self.assertEqual(room.name, "Room-101")
        self.assertEqual(room.type, RoomStyleChoices.SINGLE_ROOM)
        self.assertEqual(room.status, RoomStatusChoices.AVAILABLE)
        self.assertEqual(room.notes, "Corner room")
        self.assertEqual(room.amenities, "WiFi, AC")
        self.assertTrue(room.medical_respite)
        self.assertEqual(room.last_cleaned_inspected, last_cleaned)
        self.assertTrue(Room.objects.filter(pk=room.pk).exists())

    def test_creates_room_with_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        room = room_create(
            user=self.user,
            organization_id=self.org_id,
            data={
                "shelter_id": self.shelter.pk,
                "name": "Room-102",
                "demographics": [DemographicChoices.SINGLE_MEN],
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES],
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE],
                "pets": [PetChoices.CATS],
            },
        )

        self.assertEqual(room.demographics.count(), 1)
        self.assertEqual(room.funders.count(), 1)
        self.assertEqual(room.accessibility.count(), 1)
        self.assertEqual(room.pets.count(), 1)

    def test_shelter_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            room_create(user=self.user, organization_id=self.org_id, data={"shelter_id": 999999, "name": "Room-101"})
        self.assertIn("Shelter matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_object_does_not_exist(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.other_org)

        with self.assertRaises(ObjectDoesNotExist):
            room_create(user=self.user, organization_id=self.org_id, data={"shelter_id": other_shelter.pk, "name": "Room-101"})

    def test_duplicate_name_raises_validation_error(self) -> None:
        Room.objects.create(shelter=self.shelter, name="Room-101")

        with self.assertRaises(ValidationError):
            room_create(user=self.user, organization_id=self.org_id, data={"shelter_id": self.shelter.pk, "name": "Room-101"})

    def test_invalid_m2m_subset_raises_validation_error(self) -> None:
        shelter = Shelter.objects.create(organization=self.org)
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        shelter.demographics.add(demographic)

        with self.assertRaises(ValidationError) as ctx:
            room_create(
                user=self.user,
                organization_id=self.org_id,
                data={
                    "shelter_id": shelter.pk,
                    "name": "Room-103",
                    "demographics": [DemographicChoices.FAMILIES],
                },
            )
        self.assertIn("demographics", ctx.exception.message_dict)


class RoomUpdateTestCase(RoomServiceTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.room = Room.objects.create(
            shelter=self.shelter,
            name="Room-101",
            status=RoomStatusChoices.AVAILABLE,
            type=RoomStyleChoices.SINGLE_ROOM,
        )

    def test_updates_scalar_fields(self) -> None:
        updated = room_update(
            user=self.user,
            organization_id=self.org_id,
            room_id=self.room.pk,
            data={
                "name": "Room-101 Updated",
                "status": RoomStatusChoices.RESERVED,
                "type": RoomStyleChoices.MOTEL_ROOM,
                "notes": "Updated notes",
            },
        )

        self.assertEqual(updated.pk, self.room.pk)
        self.assertEqual(updated.name, "Room-101 Updated")
        self.assertEqual(updated.status, RoomStatusChoices.RESERVED)
        self.assertEqual(updated.type, RoomStyleChoices.MOTEL_ROOM)
        self.assertEqual(updated.notes, "Updated notes")
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Room-101 Updated")

    def test_none_scalar_values_are_skipped(self) -> None:
        room_update(user=self.user, organization_id=self.org_id, room_id=self.room.pk, data={"name": "Renamed", "status": None})

        self.room.refresh_from_db()
        self.assertEqual(self.room.name, "Renamed")
        self.assertEqual(self.room.status, RoomStatusChoices.AVAILABLE)

    def test_updates_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(demographic)

        room_update(
            user=self.user,
            organization_id=self.org_id,
            room_id=self.room.pk,
            data={"demographics": [DemographicChoices.SINGLE_MEN]},
        )

        self.room.refresh_from_db()
        self.assertEqual(self.room.demographics.count(), 1)

    def test_empty_m2m_list_clears_relations(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(demographic)
        self.room.demographics.add(demographic)

        room_update(user=self.user, organization_id=self.org_id, room_id=self.room.pk, data={"demographics": []})

        self.room.refresh_from_db()
        self.assertEqual(self.room.demographics.count(), 0)

    def test_room_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            room_update(user=self.user, organization_id=self.org_id, room_id=999999, data={"name": "Missing"})
        self.assertIn("Room matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            User = get_user_model()
            outsider = User.objects.create_user(username="outsider", password="pw")
            room_update(user=outsider, organization_id=self.org_id, room_id=self.room.pk, data={"name": "Blocked"})


class RoomDeleteTestCase(RoomServiceTestCase):
    def test_deletes_single_room(self) -> None:
        room_to_delete = Room.objects.create(shelter=self.shelter, name="Room-101")
        other_room = Room.objects.create(shelter=self.shelter, name="Room-102")
        bed_in_room = Bed.objects.create(
            shelter=self.shelter, room=room_to_delete, name="Bed 1", status=BedStatusChoices.AVAILABLE
        )
        other_bed = Bed.objects.create(
            shelter=self.shelter, room=other_room, name="Bed 2", status=BedStatusChoices.AVAILABLE
        )

        deleted = room_delete(user=self.user, organization_id=self.org_id, ids=[room_to_delete.pk])

        self.assertEqual(len(deleted), 1)
        self.assertEqual(deleted[0], room_to_delete.pk)
        self.assertFalse(Room.objects.filter(pk=room_to_delete.pk).exists())
        self.assertTrue(Room.objects.filter(pk=other_room.pk).exists())
        bed_in_room.refresh_from_db()
        self.assertIsNone(bed_in_room.room_id)
        self.assertTrue(Bed.objects.filter(pk=other_bed.pk).exists())

    def test_deletes_multiple_rooms(self) -> None:
        room_to_delete_1 = Room.objects.create(shelter=self.shelter, name="Room-101")
        room_to_delete_2 = Room.objects.create(shelter=self.shelter, name="Room-102")
        other_room = Room.objects.create(shelter=self.shelter, name="Room-103")
        other_bed = Bed.objects.create(
            shelter=self.shelter, room=other_room, name="Bed 1", status=BedStatusChoices.AVAILABLE
        )

        deleted = room_delete(user=self.user, organization_id=self.org_id, ids=[room_to_delete_1.pk, room_to_delete_2.pk])

        self.assertEqual(len(deleted), 2)
        self.assertFalse(Room.objects.filter(pk__in=[room_to_delete_1.pk, room_to_delete_2.pk]).exists())
        self.assertTrue(Room.objects.filter(pk=other_room.pk).exists())
        self.assertTrue(Bed.objects.filter(pk=other_bed.pk).exists())

    def test_empty_list_returns_empty(self) -> None:
        deleted = room_delete(user=self.user, organization_id=self.org_id, ids=[])

        self.assertEqual(deleted, [])


class RoomCloneTestCase(RoomServiceTestCase):
    def test_clones_room_with_m2m_without_beds(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)
        source = Room.objects.create(
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

        clone = room_clone(user=self.user, organization_id=self.org_id, room_id=str(source.pk))

        self.assertNotEqual(clone.pk, source.pk)
        self.assertEqual(clone.name, "Room-101 (Copy)")
        self.assertEqual(clone.status, RoomStatusChoices.AVAILABLE)
        self.assertEqual(clone.type, RoomStyleChoices.SINGLE_ROOM)
        self.assertEqual(clone.type_other, "Custom style")
        self.assertEqual(clone.notes, "Corner room")
        self.assertEqual(clone.amenities, "WiFi, AC")
        self.assertTrue(clone.medical_respite)
        self.assertTrue(clone.storage)
        self.assertTrue(clone.maintenance_flag)
        self.assertEqual(clone.beds.count(), 0)
        self.assertEqual(source.beds.count(), 2)
        self.assertEqual(
            set(clone.demographics.values_list("name", flat=True)),
            set(source.demographics.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.funders.values_list("name", flat=True)),
            set(source.funders.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.accessibility.values_list("name", flat=True)),
            set(source.accessibility.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.pets.values_list("name", flat=True)),
            set(source.pets.values_list("name", flat=True)),
        )

    def test_clone_same_room_twice_uses_incremented_name(self) -> None:
        source = Room.objects.create(shelter=self.shelter, name="Room-101")

        first = room_clone(user=self.user, organization_id=self.org_id, room_id=str(source.pk))
        second = room_clone(user=self.user, organization_id=self.org_id, room_id=str(source.pk))

        self.assertEqual(first.name, "Room-101 (Copy)")
        self.assertEqual(second.name, "Room-101 (Copy 2)")

    def test_room_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            room_clone(user=self.user, organization_id=self.org_id, room_id="999999")
        self.assertIn(
            "Room matching ID 999999 could not be found.",
            str(ctx.exception),
        )
