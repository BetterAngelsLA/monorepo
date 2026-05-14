from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from pghistory.models import Events
from shelters.models import Shelter, ShelterAvailability
from shelters.tests.baker_recipes import shelter_availability_recipe

User = get_user_model()


class ShelterAvailabilityModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        self.user = baker.make(User)

    def test_create_availability(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restrictive_beds=10,
            restrictive_beds=5,
            restriction_notes="Women only wing",
            updated_by=self.user,
        )
        self.assertEqual(availability.shelter, self.shelter)
        self.assertEqual(availability.non_restrictive_beds, 10)
        self.assertEqual(availability.restrictive_beds, 5)
        self.assertEqual(availability.restriction_notes, "Women only wing")
        self.assertEqual(availability.updated_by, self.user)
        self.assertIsNotNone(availability.created_at)
        self.assertIsNotNone(availability.updated_at)

    def test_str_representation(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restrictive_beds=10,
            restrictive_beds=5,
        )
        self.assertEqual(str(availability), "Test Shelter — 10 non-restrictive / 5 restrictive")

    def test_defaults(self) -> None:
        availability = ShelterAvailability.objects.create(shelter=self.shelter)
        self.assertEqual(availability.non_restrictive_beds, 0)
        self.assertEqual(availability.restrictive_beds, 0)
        self.assertEqual(availability.restriction_notes, "")
        self.assertIsNone(availability.updated_by)

    def test_clean_rejects_negative_non_restrictive_beds(self) -> None:
        availability = ShelterAvailability(
            shelter=self.shelter,
            non_restrictive_beds=-1,
            restrictive_beds=0,
        )
        with self.assertRaises(ValidationError) as ctx:
            availability.clean()
        self.assertIn("non_restrictive_beds", ctx.exception.message_dict)

    def test_clean_rejects_negative_restrictive_beds(self) -> None:
        availability = ShelterAvailability(
            shelter=self.shelter,
            non_restrictive_beds=0,
            restrictive_beds=-1,
        )
        with self.assertRaises(ValidationError) as ctx:
            availability.clean()
        self.assertIn("restrictive_beds", ctx.exception.message_dict)

    def test_cascade_delete_with_shelter(self) -> None:
        ShelterAvailability.objects.create(shelter=self.shelter, non_restrictive_beds=5)
        self.assertEqual(ShelterAvailability.objects.count(), 1)
        self.shelter.delete()
        self.assertEqual(ShelterAvailability.objects.count(), 0)

    def test_updated_by_set_null_on_user_delete(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            updated_by=self.user,
        )
        self.user.delete()
        availability.refresh_from_db()
        self.assertIsNone(availability.updated_by)

    def test_pghistory_tracks_insert(self) -> None:
        ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restrictive_beds=10,
        )
        events = Events.objects.filter(pgh_label="shelter.availability.add")
        self.assertEqual(events.count(), 1)

    def test_pghistory_tracks_update(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restrictive_beds=10,
        )
        availability.non_restrictive_beds = 20
        availability.save()
        events = Events.objects.filter(pgh_label="shelter.availability.update")
        self.assertEqual(events.count(), 1)

    def test_pghistory_tracks_delete(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restrictive_beds=10,
        )
        availability.delete()
        events = Events.objects.filter(pgh_label="shelter.availability.remove")
        self.assertEqual(events.count(), 1)

    def test_ordering_by_updated_at_desc(self) -> None:
        a1 = ShelterAvailability.objects.create(shelter=self.shelter, non_restrictive_beds=1)
        a2 = ShelterAvailability.objects.create(shelter=self.shelter, non_restrictive_beds=2)
        # Re-save a1 to make it the most recently updated
        a1.non_restrictive_beds = 3
        a1.save()
        results = list(ShelterAvailability.objects.all())
        self.assertEqual(results[0].pk, a1.pk)
        self.assertEqual(results[1].pk, a2.pk)

    def test_related_name_from_shelter(self) -> None:
        ShelterAvailability.objects.create(shelter=self.shelter, non_restrictive_beds=5)
        ShelterAvailability.objects.create(shelter=self.shelter, non_restrictive_beds=10)
        self.assertEqual(ShelterAvailability.objects.filter(shelter=self.shelter).count(), 2)

    def test_recipe_creates_valid_instance(self) -> None:
        availability = shelter_availability_recipe.make(shelter=self.shelter)
        availability.full_clean()
        self.assertIsNotNone(availability.pk)
        self.assertGreaterEqual(availability.non_restrictive_beds, 0)
        self.assertGreaterEqual(availability.restrictive_beds, 0)
