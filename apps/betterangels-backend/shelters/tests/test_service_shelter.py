from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.test import TestCase
from shelters.models import Shelter
from shelters.services.shelter import shelter_update


class ShelterUpdateOrganizationImmutableTestCase(TestCase):
    """Ensure shelter_update cannot change the shelter's organization."""

    def setUp(self) -> None:
        User = get_user_model()
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.user = User.objects.create_user(username="testuser", password="pw")
        self.org.users.add(self.user)
        self.shelter = Shelter.objects.create(name="Test Shelter", organization=self.org)

    def test_organization_is_not_changed(self) -> None:
        """Passing organization in the update payload must not change the shelter's org."""
        shelter_update(
            user=self.user,
            data={"id": self.shelter.pk, "organization": self.other_org.pk, "name": "Renamed"},
        )
        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.organization, self.org)
        self.assertEqual(self.shelter.name, "Renamed")

    def test_organization_key_absent_still_updates_other_fields(self) -> None:
        """When organization is not in the payload, other fields update normally."""
        shelter_update(
            user=self.user,
            data={"id": self.shelter.pk, "name": "New Name"},
        )
        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.name, "New Name")
        self.assertEqual(self.shelter.organization, self.org)
