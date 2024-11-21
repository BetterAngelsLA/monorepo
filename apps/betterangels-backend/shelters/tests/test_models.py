from django.test import TestCase
from pghistory.models import Events
from shelters.enums import DemographicChoices, GeneralServiceChoices, ShelterChoices
from shelters.models import Demographic, GeneralService, Shelter, ShelterType


class ShelterModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = self._create_shelter("Test Shelter")

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
