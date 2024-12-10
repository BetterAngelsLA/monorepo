import random

from django.test import TestCase
from pghistory.models import Events
from places import Places
from shelters.enums import DemographicChoices, GeneralServiceChoices, ShelterChoices
from shelters.models import Demographic, GeneralService, Shelter, ShelterType


class ShelterModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = self._create_shelter("Test Shelter")

    def _get_random_shelter_location(self) -> Places:
        street_names = ["Main St", "Santa Monica Blvd", "Wilshire Blvd", "Venice Blvd"]
        latitude_bounds = [33.937143, 34.102757]
        longitude_bounds = [-118.493372, -118.246635]

        random_address = f"{random.randint(100, 20000)} {random.choice(street_names)}"
        random_latitude = str(round(random.uniform(latitude_bounds[0], latitude_bounds[1]), 4))
        random_longitude = str(round(random.uniform(longitude_bounds[0], longitude_bounds[1]), 4))

        return Places(
            place=random_address,
            latitude=random_latitude,
            longitude=random_longitude,
        )

    def test_save(self) -> None:
        location = self._get_random_shelter_location()
        shelter = Shelter.objects.create(location=location)

        assert shelter.geolocation
        self.assertEqual(str(shelter.location.latitude), str(shelter.geolocation.coords[1]))
        self.assertEqual(str(shelter.location.longitude), str(shelter.geolocation.coords[0]))

        shelter.location.latitude = "123.0"
        shelter.location.longitude = "-123.0"
        shelter.save()

        self.assertEqual(str(shelter.geolocation.coords[1]), "123.0")
        self.assertEqual(str(shelter.geolocation.coords[0]), "-123.0")

        shelter.location = None
        shelter.save()

        self.assertIsNone(shelter.geolocation)

    def test_create_shelter_events(self) -> None:
        # Verify shelter creation event
        shelter_events = Events.objects.filter(pgh_label="shelter.add")
        self.assertEqual(shelter_events.count(), 1)

        # Verify associated events
        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter.shelter_type.add",
                "shelter.demographic.add",
                "shelter.general_service.add",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.add"))
        self.assertEqual(1, event_labels.count("shelter.demographic.add"))
        self.assertEqual(2, event_labels.count("shelter.general_service.add"))

    def test_delete_shelter_events(self) -> None:
        # Delete shelter and verify events
        self.shelter.delete()

        shelter_events = Events.objects.filter(pgh_label="shelter.remove")
        self.assertEqual(shelter_events.count(), 1)

        # Verify associated remove events
        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter.shelter_type.remove",
                "shelter.demographic.remove",
                "shelter.general_service.remove",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.remove"))
        self.assertEqual(1, event_labels.count("shelter.demographic.remove"))
        self.assertEqual(2, event_labels.count("shelter.general_service.remove"))

    def _create_shelter(self, shelter_name: str) -> Shelter:
        # Create related models for ManyToMany fields
        shelter_type = ShelterType.objects.create(name=ShelterChoices.BUILDING)
        population = Demographic.objects.create(name=DemographicChoices.SINGLE_MEN)
        general_service_1 = GeneralService.objects.create(name=GeneralServiceChoices.CASE_MANAGEMENT)
        general_service_2 = GeneralService.objects.create(name=GeneralServiceChoices.CHILDCARE)

        # Create shelter and add ManyToMany relationships
        shelter = Shelter.objects.create(name=shelter_name)
        shelter.shelter_types.add(shelter_type)
        shelter.demographics.add(population)
        shelter.general_services.add(general_service_1, general_service_2)
        return shelter
