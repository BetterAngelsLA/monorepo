from accounts.role_manager import OrgRoleManager
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth import get_user_model
from django.test import TestCase
from shelters.groups import SHELTER_OPERATOR
from shelters.models import Shelter
from shelters.services.shelter import shelter_update


class ShelterUpdateOrganizationImmutableTestCase(TestCase):
    """Ensure shelter_update cannot change the shelter's organization."""

    def setUp(self) -> None:
        User = get_user_model()
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.other_org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.user = User.objects.create_user(username="testuser", password="pw")
        self.org.users.add(self.user)
        self.shelter = Shelter.objects.create(name="Test Shelter", organization=self.org)
        self.org_id = str(self.org.pk)
        OrgRoleManager(self.org).add_roles(self.user, SHELTER_OPERATOR)

    def test_organization_is_not_changed(self) -> None:
        """Passing organization in the update payload must not change the shelter's org."""
        shelter_update(
            user=self.user,
            organization_id=self.org_id,
            data={"id": self.shelter.pk, "organization": self.other_org.pk, "name": "Renamed"},
        )
        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.organization, self.org)
        self.assertEqual(self.shelter.name, "Renamed")

    def test_organization_key_absent_still_updates_other_fields(self) -> None:
        """When organization is not in the payload, other fields update normally."""
        shelter_update(
            user=self.user,
            organization_id=self.org_id,
            data={"id": self.shelter.pk, "name": "New Name"},
        )
        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.name, "New Name")
        self.assertEqual(self.shelter.organization, self.org)
