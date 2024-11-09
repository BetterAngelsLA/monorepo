from os import name

from django.test import TestCase
from pghistory.models import Events
from shelters.enums import GeneralServiceChoices, PopulationChoices, ShelterChoices
from shelters.models import GeneralService, Population, Shelter, ShelterType


class ShelterModelTestCase(TestCase):

    def setUp(self) -> None:
        self.shelter = self._create_shelter("Test Shelter")

    def test_create_shelter_events(self) -> None:
        shelter_events = Events.objects.filter(pgh_label="shelter.add")
        self.assertEqual(shelter_events.count(), 1)
        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter_shelter_types.add",
                "shelter_populations.add",
                "shelter_general_services.add",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter_shelter_types.add"))
        self.assertEqual(1, event_labels.count("shelter_populations.add"))
        self.assertEqual(2, event_labels.count("shelter_general_services.add"))

    def test_update_shelter_events(self) -> None:
        self.shelter.name = "Updated Shelter"
        self.shelter.save()
        events = Events.objects.filter(pgh_label="shelter.update")
        self.assertEqual(events.count(), 1)
        # revert the update
        action = events[0].pgh_label.split(".")[1]
        diff = events[0].pgh_diff
        self.shelter.revert_action(action=action, diff=diff)
        self.assertEqual(self.shelter.name, "Test Shelter")

    def test_delete_shelter_events(self) -> None:
        self.shelter.delete()

        shelter_events = Events.objects.filter(pgh_label="shelter.remove")
        self.assertEqual(shelter_events.count(), 1)

        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter_shelter_types.remove",
                "shelter_populations.remove",
                "shelter_general_services.remove",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter_shelter_types.remove"))
        self.assertEqual(1, event_labels.count("shelter_populations.remove"))
        self.assertEqual(2, event_labels.count("shelter_general_services.remove"))

    def _create_shelter(self, shelter_name: str) -> Shelter:
        shelter_type = ShelterType.objects.create(name=ShelterChoices.A_BRIDGE_HOME)
        population = Population.objects.create(name=PopulationChoices.ADULTS)
        general_service_1 = GeneralService.objects.create(name=GeneralServiceChoices.CASE_MANAGEMENT)
        general_service_2 = GeneralService.objects.create(name=GeneralServiceChoices.CHILDCARE)

        shelter = Shelter.objects.create(name=shelter_name)
        shelter.shelter_types.add(shelter_type)
        shelter.populations.add(population)
        shelter.general_services.add(general_service_1, general_service_2)
        return shelter
