from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.test import TestCase
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    BedTypeChoices,
    DemographicChoices,
    FunderChoices,
    PetChoices,
)
from shelters.models import Accessibility, Bed, Demographic, Funder, Pet, Room, Shelter
from shelters.services.bed import _BED_M2M_FIELDS, bed_clone, bed_create, bed_delete, bed_update
from shelters.tests.baker_recipes import shelter_recipe


class BedServiceTestCase(TestCase):
    def setUp(self) -> None:
        User = get_user_model()
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.user = User.objects.create_user(username="bed-service-user", password="pw")
        self.org.users.add(self.user)
        self.shelter = shelter_recipe.make(organization=self.org)


class BedCreateTestCase(BedServiceTestCase):
    def test_creates_bed_with_scalar_fields(self) -> None:
        bed = bed_create(
            shelter=self.shelter,
            data={
                "status": BedStatusChoices.AVAILABLE,
                "name": "Bed 1",
                "type": BedTypeChoices.TWIN,
            },
        )

        self.assertEqual(bed.shelter_id, self.shelter.pk)
        self.assertEqual(bed.status, BedStatusChoices.AVAILABLE)
        self.assertEqual(bed.name, "Bed 1")
        self.assertEqual(bed.type, BedTypeChoices.TWIN)
        self.assertIsNone(bed.room_id)
        self.assertTrue(Bed.objects.filter(pk=bed.pk).exists())

    def test_creates_bed_with_room(self) -> None:
        room = Room.objects.create(shelter=self.shelter, name="Room-A1")

        bed = bed_create(
            shelter=self.shelter,
            data={
                "room_id": room.pk,
                "status": BedStatusChoices.AVAILABLE,
            },
        )

        self.assertEqual(bed.room_id, room.pk)

    def test_creates_bed_with_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)

        bed = bed_create(
            shelter=self.shelter,
            data={
                "demographics": [DemographicChoices.SINGLE_MEN],
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES],
            },
        )

        demographic_result = bed.demographics.first()
        funder_result = bed.funders.first()
        assert demographic_result
        assert funder_result

        self.assertEqual(bed.demographics.count(), 1)
        self.assertEqual(bed.funders.count(), 1)
        self.assertEqual(demographic_result.name, DemographicChoices.SINGLE_MEN)
        self.assertEqual(funder_result.name, FunderChoices.CITY_OF_LOS_ANGELES)

    def test_invalid_m2m_subset_raises_validation_error(self) -> None:
        shelter = Shelter.objects.create(organization=self.org)
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        shelter.demographics.add(demographic)

        with self.assertRaises(ValidationError) as ctx:
            bed_create(
                shelter=shelter,
                data={
                    "demographics": [DemographicChoices.FAMILIES],
                },
            )
        self.assertIn("demographics", ctx.exception.message_dict)


class BedUpdateTestCase(BedServiceTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.bed = Bed.objects.create(
            shelter=self.shelter,
            name="Bed 1",
            status=BedStatusChoices.AVAILABLE,
            type=BedTypeChoices.TWIN,
        )

    def test_updates_scalar_fields(self) -> None:
        updated = bed_update(
            bed=self.bed,
            data={
                "name": "Bed 1 Updated",
                "status": BedStatusChoices.RESERVED,
                "type": BedTypeChoices.BUNK,
            },
        )

        self.assertEqual(updated.pk, self.bed.pk)
        self.assertEqual(updated.name, "Bed 1 Updated")
        self.assertEqual(updated.status, BedStatusChoices.RESERVED)
        self.assertEqual(updated.type, BedTypeChoices.BUNK)
        self.bed.refresh_from_db()
        self.assertEqual(self.bed.name, "Bed 1 Updated")

    def test_none_scalar_values_are_skipped(self) -> None:
        bed_update(bed=self.bed, data={"name": "Renamed", "status": None})

        self.bed.refresh_from_db()
        self.assertEqual(self.bed.name, "Renamed")
        self.assertEqual(self.bed.status, BedStatusChoices.AVAILABLE)

    def test_updates_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)

        bed_update(
            bed=self.bed,
            data={
                "demographics": [DemographicChoices.SINGLE_MEN],
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES],
            },
        )

        self.bed.refresh_from_db()
        self.assertEqual(self.bed.demographics.count(), 1)
        self.assertEqual(self.bed.funders.count(), 1)

    def test_empty_m2m_list_clears_relations(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(demographic)
        self.bed.demographics.add(demographic)

        bed_update(bed=self.bed, data={"demographics": []})

        self.bed.refresh_from_db()
        self.assertEqual(self.bed.demographics.count(), 0)


class BedDeleteTestCase(BedServiceTestCase):
    def test_deletes_single_bed(self) -> None:
        bed_to_delete = Bed.objects.create(shelter=self.shelter, name="Bed 1", status=BedStatusChoices.AVAILABLE)
        other_bed = Bed.objects.create(shelter=self.shelter, name="Bed 2", status=BedStatusChoices.AVAILABLE)

        deleted = bed_delete(queryset=Bed.objects.filter(pk=bed_to_delete.pk))

        self.assertEqual(len(deleted), 1)
        self.assertEqual(deleted[0], bed_to_delete.pk)
        self.assertFalse(Bed.objects.filter(pk=bed_to_delete.pk).exists())
        self.assertTrue(Bed.objects.filter(pk=other_bed.pk).exists())

    def test_deletes_multiple_beds(self) -> None:
        bed_to_delete_1 = Bed.objects.create(shelter=self.shelter, name="Bed 1", status=BedStatusChoices.AVAILABLE)
        bed_to_delete_2 = Bed.objects.create(shelter=self.shelter, name="Bed 2", status=BedStatusChoices.AVAILABLE)
        other_bed = Bed.objects.create(shelter=self.shelter, name="Bed 3", status=BedStatusChoices.AVAILABLE)

        deleted = bed_delete(queryset=Bed.objects.filter(pk__in=[bed_to_delete_1.pk, bed_to_delete_2.pk]))

        self.assertEqual(len(deleted), 2)
        self.assertFalse(Bed.objects.filter(pk__in=[bed_to_delete_1.pk, bed_to_delete_2.pk]).exists())
        self.assertTrue(Bed.objects.filter(pk=other_bed.pk).exists())

    def test_empty_list_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist):
            bed_delete(queryset=Bed.objects.none())


class BedCloneTestCase(BedServiceTestCase):
    def test_clones_bed_with_scalar_and_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        room = Room.objects.create(shelter=self.shelter, name="Room-A1")
        source = Bed.objects.create(
            shelter=self.shelter,
            room=room,
            name="Bed 1",
            status=BedStatusChoices.AVAILABLE,
            type=BedTypeChoices.TWIN,
            b7=True,
            storage=True,
            maintenance_flag=True,
            status_notes="All good",
            fees=10,
        )
        source.demographics.add(demographic)
        source.funders.add(funder)
        source.accessibility.add(accessibility)
        source.pets.add(pet)

        clone = bed_clone(
            queryset=Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS), bed_id=str(source.pk)
        )

        self.assertNotEqual(clone.pk, source.pk)
        self.assertEqual(clone.name, "Bed 1 (Copy)")
        self.assertEqual(clone.shelter, source.shelter)
        self.assertEqual(clone.room, source.room)
        self.assertEqual(clone.status, BedStatusChoices.AVAILABLE)
        self.assertEqual(clone.type, BedTypeChoices.TWIN)
        self.assertTrue(clone.b7)
        self.assertTrue(clone.storage)
        self.assertTrue(clone.maintenance_flag)
        self.assertEqual(clone.status_notes, "All good")
        self.assertEqual(clone.fees, 10)
        self.assertTrue(Bed.objects.filter(pk=clone.pk).exists())
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

    def test_bed_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            bed_clone(
                queryset=Bed.objects.select_related("shelter").prefetch_related(*_BED_M2M_FIELDS), bed_id="999999"
            )
        self.assertIn(
            "Bed matching ID 999999 could not be found.",
            str(ctx.exception),
        )
