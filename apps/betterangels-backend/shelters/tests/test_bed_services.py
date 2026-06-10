from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.test import TestCase
from shelters.enums import BedStatusChoices, BedTypeChoices, DemographicChoices, FunderChoices
from shelters.models import Bed, Demographic, Funder, Room, Shelter
from shelters.services.bed import bed_clone, bed_create, bed_delete, bed_update
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
            user=self.user,
            data={
                "shelter_id": self.shelter.pk,
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
            user=self.user,
            data={
                "shelter_id": self.shelter.pk,
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
            user=self.user,
            data={
                "shelter_id": self.shelter.pk,
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

    def test_shelter_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            bed_create(user=self.user, data={"shelter_id": 999999, "name": "Bed 1"})
        self.assertIn("Shelter matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_object_does_not_exist(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.other_org)

        with self.assertRaises(ObjectDoesNotExist):
            bed_create(user=self.user, data={"shelter_id": other_shelter.pk, "name": "Bed 1"})

    def test_invalid_m2m_subset_raises_validation_error(self) -> None:
        shelter = Shelter.objects.create(organization=self.org)
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        shelter.demographics.add(demographic)

        with self.assertRaises(ValidationError) as ctx:
            bed_create(
                user=self.user,
                data={
                    "shelter_id": shelter.pk,
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
            user=self.user,
            bed_id=self.bed.pk,
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
        bed_update(user=self.user, bed_id=self.bed.pk, data={"name": "Renamed", "status": None})

        self.bed.refresh_from_db()
        self.assertEqual(self.bed.name, "Renamed")
        self.assertEqual(self.bed.status, BedStatusChoices.AVAILABLE)

    def test_updates_m2m_fields(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)

        bed_update(
            user=self.user,
            bed_id=self.bed.pk,
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

        bed_update(user=self.user, bed_id=self.bed.pk, data={"demographics": []})

        self.bed.refresh_from_db()
        self.assertEqual(self.bed.demographics.count(), 0)

    def test_bed_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            bed_update(user=self.user, bed_id=999999, data={"name": "Missing"})
        self.assertIn("Bed matching ID 999999 could not be found.", str(ctx.exception))

    def test_user_without_org_access_raises_does_not_exist(self) -> None:
        with self.assertRaises(Shelter.DoesNotExist):
            User = get_user_model()
            outsider = User.objects.create_user(username="outsider", password="pw")
            bed_update(user=outsider, bed_id=self.bed.pk, data={"name": "Blocked"})


class BedDeleteTestCase(BedServiceTestCase):
    def test_deletes_single_bed(self) -> None:
        bed = Bed.objects.create(shelter=self.shelter, name="Bed 1", status=BedStatusChoices.AVAILABLE)

        deleted = bed_delete(data={"ids": [bed.pk]})

        self.assertEqual(len(deleted), 1)
        self.assertEqual(deleted[0], bed.pk)
        self.assertFalse(Bed.objects.filter(pk=bed.pk).exists())

    def test_deletes_multiple_beds(self) -> None:
        bed1 = Bed.objects.create(shelter=self.shelter, name="Bed 1", status=BedStatusChoices.AVAILABLE)
        bed2 = Bed.objects.create(shelter=self.shelter, name="Bed 2", status=BedStatusChoices.AVAILABLE)

        deleted = bed_delete(data={"ids": [bed1.pk, bed2.pk]})

        self.assertEqual(len(deleted), 2)
        self.assertFalse(Bed.objects.filter(pk__in=[bed1.pk, bed2.pk]).exists())

    def test_missing_id_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            bed_delete(data={"ids": [999999]})
        self.assertIn("999999", str(ctx.exception))

    def test_partial_missing_ids_raises_object_does_not_exist(self) -> None:
        bed = Bed.objects.create(shelter=self.shelter, name="Bed 1", status=BedStatusChoices.AVAILABLE)

        with self.assertRaises(ObjectDoesNotExist):
            bed_delete(data={"ids": [bed.pk, 999999]})

        self.assertTrue(Bed.objects.filter(pk=bed.pk).exists())

    def test_empty_list_returns_empty(self) -> None:
        deleted = bed_delete(data={"ids": []})

        self.assertEqual(deleted, [])


class BedDuplicateTestCase(BedServiceTestCase):
    def test_bed_not_found_raises_object_does_not_exist(self) -> None:
        with self.assertRaises(ObjectDoesNotExist) as ctx:
            bed_clone(user=self.user, bed_id="999999", shelter_id=str(self.shelter.pk))
        self.assertIn(
            f"Bed matching ID 999999 could not be found for shelter {self.shelter.pk}.",
            str(ctx.exception),
        )

    def test_bed_on_different_shelter_raises_object_does_not_exist(self) -> None:
        other_shelter = shelter_recipe.make(organization=self.org)
        bed = Bed.objects.create(shelter=other_shelter, name="Other bed")

        with self.assertRaises(ObjectDoesNotExist):
            bed_clone(user=self.user, bed_id=str(bed.pk), shelter_id=str(self.shelter.pk))
