from datetime import datetime, timezone

from django.test import TestCase
from model_bakery import baker
from shelters.enums import (
    AccessibilityChoices,
    BedStatusChoices,
    BedTypeChoices,
    DemographicChoices,
    FunderChoices,
    MedicalNeedChoices,
    PetChoices,
)
from shelters.models import Accessibility, Bed, Demographic, Funder, MedicalNeed, Pet, Room
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class BedMutationTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.operator)
        self.shelter = shelter_recipe.make(organization=self.org)
        self.room = baker.make(Room, shelter=self.shelter)


class CreateBedMutationTestCase(BedMutationTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = f"""
            mutation CreateBed($data: CreateBedInput!) {{
                createBed(data: $data) {{
                    ... on BedType {{
                        {self.bed_fields}
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

    def test_create_bed(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        medical_need, _ = MedicalNeed.objects.get_or_create(name=MedicalNeedChoices.DMH)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        variables = {
            "data": {
                "shelterId": self.shelter.pk,
                "roomId": self.room.pk,
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name],
                "b7": True,
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "fees": 25,
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES.name],
                "lastCleanedInspected": "2025-01-15T10:30:00Z",
                "maintenanceFlag": True,
                "medicalNeeds": [MedicalNeedChoices.DMH.name],
                "name": "Bed 1",
                "pets": [PetChoices.CATS.name],
                "status": BedStatusChoices.AVAILABLE.name,
                "statusNotes": "Ready for occupancy",
                "storage": True,
                "type": BedTypeChoices.TWIN.name,
            }
        }
        expected_query_count = 34
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["createBed"]
        self.assertEqual(data["b7"], True)
        self.assertEqual(data["fees"], 25)
        self.assertEqual(data["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(data["maintenanceFlag"], True)
        self.assertEqual(data["name"], "Bed 1")
        self.assertEqual(data["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(data["statusNotes"], "Ready for occupancy")
        self.assertTrue(data["storage"])
        self.assertEqual(data["type"], BedTypeChoices.TWIN.name)
        self.assertEqual(data["room"]["id"], str(self.room.pk))
        self.assertEqual(data["shelter"]["id"], str(self.shelter.pk))
        self.assertEqual(len(data["accessibility"]), 1)
        self.assertEqual(data["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(data["demographics"]), 1)
        self.assertEqual(data["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(data["funders"]), 1)
        self.assertEqual(data["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(data["medicalNeeds"]), 1)
        self.assertEqual(data["medicalNeeds"][0]["name"], MedicalNeedChoices.DMH.name)
        self.assertEqual(len(data["pets"]), 1)
        self.assertEqual(data["pets"][0]["name"], PetChoices.CATS.name)
        self.assertTrue(Bed.objects.filter(pk=data["id"]).exists())


class UpdateBedMutationTestCase(BedMutationTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = f"""
            mutation UpdateBed($id: ID!, $data: UpdateBedInput!) {{
                updateBed(id: $id, data: $data) {{
                    ... on BedType {{
                        {self.bed_fields}
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

    def test_update_bed(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        MedicalNeed.objects.get_or_create(name=MedicalNeedChoices.DMH)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        source = baker.make(
            Bed,
            shelter=self.shelter,
            name="Bed 1",
            status=BedStatusChoices.AVAILABLE,
            type=BedTypeChoices.TWIN,
        )
        variables = {
            "id": str(source.pk),
            "data": {
                "roomId": self.room.pk,
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name],
                "b7": True,
                "demographics": [DemographicChoices.SINGLE_MEN.name],
                "fees": 25,
                "funders": [FunderChoices.CITY_OF_LOS_ANGELES.name],
                "lastCleanedInspected": "2025-01-15T10:30:00Z",
                "maintenanceFlag": True,
                "medicalNeeds": [MedicalNeedChoices.DMH.name],
                "name": "Bed 1 Updated",
                "pets": [PetChoices.CATS.name],
                "status": BedStatusChoices.RESERVED.name,
                "statusNotes": "Updated notes",
                "storage": True,
                "type": BedTypeChoices.BUNK.name,
            },
        }

        expected_query_count = 34
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateBed"]
        self.assertEqual(data["id"], str(source.pk))
        self.assertEqual(data["b7"], True)
        self.assertEqual(data["fees"], 25)
        self.assertEqual(data["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(data["maintenanceFlag"], True)
        self.assertEqual(data["name"], "Bed 1 Updated")
        self.assertEqual(data["status"], BedStatusChoices.RESERVED.name)
        self.assertEqual(data["statusNotes"], "Updated notes")
        self.assertTrue(data["storage"])
        self.assertEqual(data["type"], BedTypeChoices.BUNK.name)
        self.assertEqual(data["room"]["id"], str(self.room.pk))
        self.assertEqual(data["shelter"]["id"], str(self.shelter.pk))
        self.assertEqual(len(data["accessibility"]), 1)
        self.assertEqual(data["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(data["demographics"]), 1)
        self.assertEqual(data["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(data["funders"]), 1)
        self.assertEqual(data["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(data["medicalNeeds"]), 1)
        self.assertEqual(data["medicalNeeds"][0]["name"], MedicalNeedChoices.DMH.name)
        self.assertEqual(len(data["pets"]), 1)
        self.assertEqual(data["pets"][0]["name"], PetChoices.CATS.name)

        source.refresh_from_db()
        self.assertEqual(source.name, "Bed 1 Updated")
        self.assertEqual(source.room_id, self.room.pk)
        self.assertEqual(source.demographics.count(), 1)

    def test_partial_update_bed(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        medical_need, _ = MedicalNeed.objects.get_or_create(name=MedicalNeedChoices.DMH)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        source = baker.make(
            Bed,
            shelter=self.shelter,
            room=self.room,
            b7=True,
            fees=25,
            last_cleaned_inspected=datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc),
            maintenance_flag=True,
            name="Bed 1",
            status=BedStatusChoices.AVAILABLE,
            status_notes="Ready for occupancy",
            storage=True,
            type=BedTypeChoices.TWIN,
        )
        source.accessibility.add(accessibility)
        source.demographics.add(demographic)
        source.funders.add(funder)
        source.medical_needs.add(medical_need)
        source.pets.add(pet)

        variables = {
            "id": str(source.pk),
            "data": {"statusNotes": "New notes"},
        }

        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["updateBed"]
        self.assertEqual(data["statusNotes"], "New notes")
        self.assertEqual(data["name"], "Bed 1")
        self.assertEqual(data["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(data["type"], BedTypeChoices.TWIN.name)
        self.assertEqual(data["b7"], True)
        self.assertEqual(data["fees"], 25)
        self.assertEqual(data["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(data["maintenanceFlag"], True)
        self.assertTrue(data["storage"])
        self.assertEqual(data["room"]["id"], str(self.room.pk))
        self.assertEqual(data["shelter"]["id"], str(self.shelter.pk))
        self.assertEqual(len(data["accessibility"]), 1)
        self.assertEqual(data["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(data["demographics"]), 1)
        self.assertEqual(data["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(data["funders"]), 1)
        self.assertEqual(data["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(data["medicalNeeds"]), 1)
        self.assertEqual(data["medicalNeeds"][0]["name"], MedicalNeedChoices.DMH.name)
        self.assertEqual(len(data["pets"]), 1)
        self.assertEqual(data["pets"][0]["name"], PetChoices.CATS.name)

        source.refresh_from_db()
        self.assertEqual(source.status_notes, "New notes")
        self.assertEqual(source.name, "Bed 1")
        self.assertEqual(source.status, BedStatusChoices.AVAILABLE)
        self.assertEqual(source.type, BedTypeChoices.TWIN)
        self.assertTrue(source.b7)
        self.assertEqual(source.fees, 25)
        self.assertEqual(source.last_cleaned_inspected, datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc))
        self.assertTrue(source.maintenance_flag)
        self.assertTrue(source.storage)
        self.assertEqual(source.room_id, self.room.pk)
        self.assertEqual(source.accessibility.count(), 1)
        self.assertEqual(source.demographics.count(), 1)
        self.assertEqual(source.funders.count(), 1)
        self.assertEqual(source.medical_needs.count(), 1)
        self.assertEqual(source.pets.count(), 1)


class DeleteBedsMutationTestCase(BedMutationTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = """
            mutation ($data: BulkDeleteInput!) {
                deleteBeds(data: $data) {
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

    def test_delete_single_bed(self) -> None:
        bed = baker.make(Bed, shelter=self.shelter, name="Bed to delete")
        variables = {"data": {"ids": [str(bed.pk)]}}

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteBeds"]["ids"]
        self.assertEqual(len(deleted_ids), 1)
        self.assertEqual(deleted_ids[0], str(bed.pk))
        self.assertFalse(Bed.objects.filter(pk=bed.pk).exists())

    def test_delete_multiple_beds(self) -> None:
        bed1 = baker.make(Bed, shelter=self.shelter, name="Bed A")
        bed2 = baker.make(Bed, shelter=self.shelter, name="Bed B")
        variables = {"data": {"ids": [str(bed1.pk), str(bed2.pk)]}}

        response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteBeds"]["ids"]
        self.assertEqual(deleted_ids, [str(bed1.pk), str(bed2.pk)])
        self.assertFalse(Bed.objects.filter(pk__in=[bed1.pk, bed2.pk]).exists())


class CloneBedMutationTestCase(BedMutationTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.mutation = f"""
            mutation CloneBed($id: ID!) {{
                cloneBed(id: $id) {{
                    ... on BedType {{
                        {self.bed_fields}
                    }}
                }}
            }}
        """

    def test_clone_bed(self) -> None:
        demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        funder, _ = Funder.objects.get_or_create(name=FunderChoices.CITY_OF_LOS_ANGELES)
        accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        pet, _ = Pet.objects.get_or_create(name=PetChoices.CATS)
        medical_need, _ = MedicalNeed.objects.get_or_create(name=MedicalNeedChoices.DMH)
        self.shelter.demographics.add(demographic)
        self.shelter.funders.add(funder)
        self.shelter.accessibility.add(accessibility)
        self.shelter.pets.add(pet)

        source = baker.make(
            Bed,
            shelter=self.shelter,
            room=self.room,
            name="Bed 1",
            status=BedStatusChoices.AVAILABLE,
            type=BedTypeChoices.TWIN,
            b7=True,
            fees=25,
            last_cleaned_inspected=datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc),
            maintenance_flag=True,
            status_notes="Ready for occupancy",
            storage=True,
        )
        source.accessibility.add(accessibility)
        source.demographics.add(demographic)
        source.funders.add(funder)
        source.medical_needs.add(medical_need)
        source.pets.add(pet)

        variables = {"id": str(source.pk)}

        expected_query_count = 31
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.mutation, variables)

        self.assertIsNone(response.get("errors"))
        data = response["data"]["cloneBed"]
        self.assertNotEqual(data["id"], str(source.pk))
        self.assertEqual(data["b7"], True)
        self.assertEqual(data["fees"], 25)
        self.assertEqual(data["lastCleanedInspected"], "2025-01-15T10:30:00+00:00")
        self.assertEqual(data["maintenanceFlag"], True)
        self.assertEqual(data["name"], "Bed 1 (Copy)")
        self.assertEqual(data["status"], BedStatusChoices.AVAILABLE.name)
        self.assertEqual(data["statusNotes"], "Ready for occupancy")
        self.assertTrue(data["storage"])
        self.assertEqual(data["type"], BedTypeChoices.TWIN.name)
        self.assertEqual(data["room"]["id"], str(self.room.pk))
        self.assertEqual(data["shelter"]["id"], str(self.shelter.pk))
        self.assertEqual(len(data["accessibility"]), 1)
        self.assertEqual(data["accessibility"][0]["name"], AccessibilityChoices.WHEELCHAIR_ACCESSIBLE.name)
        self.assertEqual(len(data["demographics"]), 1)
        self.assertEqual(data["demographics"][0]["name"], DemographicChoices.SINGLE_MEN.name)
        self.assertEqual(len(data["funders"]), 1)
        self.assertEqual(data["funders"][0]["name"], FunderChoices.CITY_OF_LOS_ANGELES.name)
        self.assertEqual(len(data["medicalNeeds"]), 1)
        self.assertEqual(data["medicalNeeds"][0]["name"], MedicalNeedChoices.DMH.name)
        self.assertEqual(len(data["pets"]), 1)
        self.assertEqual(data["pets"][0]["name"], PetChoices.CATS.name)

        clone = Bed.objects.get(pk=data["id"])
        self.assertEqual(clone.b7, source.b7)
        self.assertEqual(clone.fees, source.fees)
        self.assertEqual(clone.last_cleaned_inspected, source.last_cleaned_inspected)
        self.assertEqual(clone.maintenance_flag, source.maintenance_flag)
        self.assertEqual(clone.status, source.status)
        self.assertEqual(clone.status_notes, source.status_notes)
        self.assertEqual(clone.storage, source.storage)
        self.assertEqual(clone.type, source.type)
        self.assertEqual(clone.room_id, source.room_id)
        self.assertEqual(
            set(clone.accessibility.values_list("name", flat=True)),
            set(source.accessibility.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.demographics.values_list("name", flat=True)),
            set(source.demographics.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.funders.values_list("name", flat=True)),
            set(source.funders.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.medical_needs.values_list("name", flat=True)),
            set(source.medical_needs.values_list("name", flat=True)),
        )
        self.assertEqual(
            set(clone.pets.values_list("name", flat=True)),
            set(source.pets.values_list("name", flat=True)),
        )
