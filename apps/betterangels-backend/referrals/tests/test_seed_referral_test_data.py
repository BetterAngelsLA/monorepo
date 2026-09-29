from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from referrals.management.commands.seed_referral_test_data import SCENARIOS, Command
from referrals.models import Referral, ReferralTestShelter
from shelters.enums import PetChoices, StatusChoices
from shelters.models import Pet, Shelter


class ReferralTestDataCommandTests(TestCase):
    def seed(self, *, clear: bool = False) -> str:
        output = StringIO()
        call_command("seed_referral_test_data", clear=clear, stdout=output)
        return output.getvalue()

    def test_creates_exact_scenarios_and_reruns_without_changing_ids_or_referrals(self) -> None:
        self.seed()
        before = dict(ReferralTestShelter.objects.values_list("key", "shelter_id"))
        referral = Referral.objects.create(shelter_id=before["match-all"])
        shelter = Shelter.objects.get(pk=before["match-all"])
        original_location = shelter.location
        shelter.name = "Renamed owned fixture"
        shelter.status = StatusChoices.DRAFT
        shelter.is_private = True
        shelter.save()
        shelter.pets.set([Pet.objects.get_or_create(name=PetChoices.DOGS_UNDER_25_LBS)[0]])

        self.seed()

        self.assertEqual(dict(ReferralTestShelter.objects.values_list("key", "shelter_id")), before)
        self.assertEqual(Shelter.objects.count(), 3)
        referral.refresh_from_db()
        self.assertEqual(referral.shelter_id, before["match-all"])
        shelter.refresh_from_db()
        self.assertEqual(shelter.location, original_location)
        for scenario in SCENARIOS:
            owned = ReferralTestShelter.objects.get(key=scenario["key"]).shelter
            self.assertEqual(owned.name, scenario["name"])
            self.assertEqual(owned.status, StatusChoices.APPROVED)
            self.assertFalse(owned.is_private)
            for field in ("pets", "demographics", "accessibility"):
                self.assertSetEqual(set(getattr(owned, field).values_list("name", flat=True)), set(scenario[field]))

    def test_neither_seed_nor_clear_adopts_or_deletes_unregistered_shelters(self) -> None:
        # Include the exact old fixture names as well as an unrelated prefix
        # match. A familiar name is not sufficient evidence of ownership.
        names = ["Shelter Unrelated Community Residence", "Shelter One", "Shelter Two", "Shelter Three"]
        originals = [Shelter.objects.create(name=name) for name in names]
        referral = Referral.objects.create(shelter=originals[0])
        self.seed()
        self.seed(clear=True)

        self.assertEqual(set(Shelter.objects.values_list("pk", flat=True)), {shelter.pk for shelter in originals})
        self.assertFalse(ReferralTestShelter.objects.exists())
        referral.refresh_from_db()
        self.assertEqual(referral.shelter_id, originals[0].pk)
        for original, name in zip(originals, names):
            original.refresh_from_db()
            self.assertEqual(original.name, name)
            self.assertEqual(original.status, StatusChoices.DRAFT)

    def test_clear_finds_owned_shelters_after_display_names_change(self) -> None:
        self.seed()
        Shelter.objects.all().update(name="Changed fixture label")
        self.assertIn("Removed 3 seeded record(s)", self.seed(clear=True))
        self.assertFalse(Shelter.objects.exists())
        self.assertFalse(ReferralTestShelter.objects.exists())
        self.assertIn("Removed 0 seeded record(s)", self.seed(clear=True))

    def test_clear_refuses_all_deletion_when_any_owned_fixture_has_a_referral(self) -> None:
        self.seed()
        fixture = ReferralTestShelter.objects.get(key="mixed-coverage")
        referral = Referral.objects.create(shelter=fixture.shelter)
        before = set(Shelter.objects.values_list("pk", flat=True))

        with self.assertRaisesMessage(CommandError, "Fixture shelters still have referrals"):
            self.seed(clear=True)

        self.assertEqual(set(Shelter.objects.values_list("pk", flat=True)), before)
        self.assertEqual(ReferralTestShelter.objects.count(), 3)
        referral.refresh_from_db()
        self.assertEqual(referral.shelter_id, fixture.shelter_id)

    def test_recreates_only_a_missing_fixture_without_claiming_a_same_named_record(self) -> None:
        self.seed()
        before = dict(ReferralTestShelter.objects.values_list("key", "shelter_id"))
        Shelter.objects.get(pk=before["unreported"]).delete()
        unrelated = Shelter.objects.create(name="Shelter Three")

        self.seed()

        after = dict(ReferralTestShelter.objects.values_list("key", "shelter_id"))
        self.assertEqual(after["match-all"], before["match-all"])
        self.assertEqual(after["mixed-coverage"], before["mixed-coverage"])
        self.assertNotIn(after["unreported"], [before["unreported"], unrelated.pk])
        self.assertEqual(Shelter.objects.count(), 4)
        unrelated.refresh_from_db()
        self.assertEqual(unrelated.status, StatusChoices.DRAFT)

    def test_failure_rolls_back_updates_to_earlier_scenarios(self) -> None:
        self.seed()
        first = ReferralTestShelter.objects.get(key="match-all").shelter
        first.name = "Name before failed reseed"
        first.save()
        ReferralTestShelter.objects.get(key="mixed-coverage").shelter.delete()
        before = dict(ReferralTestShelter.objects.values_list("key", "shelter_id"))

        with patch.object(Command, "_build", side_effect=RuntimeError("Test factory failure")):
            with self.assertRaisesMessage(RuntimeError, "Test factory failure"):
                self.seed()

        first.refresh_from_db()
        self.assertEqual(first.name, "Name before failed reseed")
        self.assertEqual(dict(ReferralTestShelter.objects.values_list("key", "shelter_id")), before)
