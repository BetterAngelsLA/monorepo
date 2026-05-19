from django.test import TestCase
from shelters.models import Shelter, ShelterAvailability
from shelters.tests.baker_recipes import shelter_availability_recipe


class ShelterAvailabilityModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")

    def test_str_representation(self) -> None:
        availability = ShelterAvailability.objects.create(
            shelter=self.shelter,
            non_restricted_beds=10,
            restricted_beds=5,
        )
        self.assertEqual(str(availability), "Test Shelter — 10 non-restricted / 5 restricted")

    def test_recipe_creates_valid_instance(self) -> None:
        availability = shelter_availability_recipe.make(shelter=self.shelter)
        availability.full_clean()
        self.assertIsNotNone(availability.pk)
        self.assertGreaterEqual(availability.non_restricted_beds, 0)
        self.assertGreaterEqual(availability.restricted_beds, 0)
