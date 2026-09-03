from accounts.models import Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import grant_create
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied
from django.test import TestCase
from model_bakery import baker

from shelters.groups import SHELTER_OPERATOR
from shelters.models import Shelter
from shelters.services.shelter import shelter_create, shelter_delete, shelter_update


class ShelterServiceTestCase(TestCase):
    """Shared fixtures for shelter service permission tests."""

    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.user = baker.make(User)
        self.org.users.add(self.user)
        self.org_id = str(self.org.pk)
        OrgRoleManager(self.org).add_roles(self.user, SHELTER_OPERATOR)

    def _grant_view_only(self) -> User:
        """Return an org member whose only shelter grant is VIEW (no ADD/CHANGE/DELETE)."""
        viewer = User.objects.create_user(username="shelter-viewer", password="pw")
        self.org.users.add(viewer)
        role, _ = Role.objects.get_or_create(name="Test Shelter Viewer", is_global=False)
        role.permissions.add(Permission.objects.get(codename="view_shelter", content_type__app_label="shelters"))
        grant_create(user=viewer, role=role, scope_org=self.org)
        return viewer


class ShelterCreateServiceTestCase(ShelterServiceTestCase):
    """shelter_create is gated on Shelter.perms.ADD (ADR 0001 §2.6)."""

    def test_create_succeeds_with_add_permission(self) -> None:
        shelter = shelter_create(
            user=self.user,
            organization_id=self.org_id,
            data={"name": "New Shelter", "description": "Created with ADD"},
        )

        self.assertTrue(Shelter.objects.filter(pk=shelter.pk, organization_id=self.org.pk).exists())
        self.assertEqual(Shelter.objects.get(pk=shelter.pk).name, "New Shelter")

    def test_create_denied_without_add_permission(self) -> None:
        viewer = self._grant_view_only()

        with self.assertRaises(PermissionDenied):
            shelter_create(
                user=viewer,
                organization_id=self.org_id,
                data={"name": "Viewer Shelter", "description": "Must be rejected"},
            )

        self.assertFalse(Shelter.objects.filter(name="Viewer Shelter").exists())


class ShelterUpdateServiceTestCase(ShelterServiceTestCase):
    """shelter_update is gated on Shelter.perms.CHANGE."""

    def setUp(self) -> None:
        super().setUp()
        self.shelter = Shelter.objects.create(name="Original Name", organization=self.org)

    def test_update_succeeds_with_change_permission(self) -> None:
        updated = shelter_update(
            user=self.user,
            organization_id=self.org_id,
            data={"id": self.shelter.pk, "name": "Renamed"},
        )

        self.assertEqual(updated.name, "Renamed")
        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.name, "Renamed")

    def test_update_denied_without_change_permission(self) -> None:
        viewer = self._grant_view_only()

        with self.assertRaises(ObjectDoesNotExist):
            shelter_update(
                user=viewer,
                organization_id=self.org_id,
                data={"id": self.shelter.pk, "name": "Viewer Rename"},
            )

        self.shelter.refresh_from_db()
        self.assertEqual(self.shelter.name, "Original Name")


class ShelterDeleteServiceTestCase(ShelterServiceTestCase):
    """shelter_delete is gated on Shelter.perms.DELETE."""

    def setUp(self) -> None:
        super().setUp()
        self.shelter = Shelter.objects.create(name="Doomed Shelter", organization=self.org)

    def test_delete_succeeds_with_delete_permission(self) -> None:
        deleted = shelter_delete(user=self.user, organization_id=self.org_id, shelter_id=str(self.shelter.pk))

        self.assertEqual(deleted.pk, self.shelter.pk)
        self.assertFalse(Shelter.objects.filter(pk=self.shelter.pk).exists())

    def test_delete_denied_without_delete_permission(self) -> None:
        viewer = self._grant_view_only()

        with self.assertRaises(ObjectDoesNotExist):
            shelter_delete(user=viewer, organization_id=self.org_id, shelter_id=str(self.shelter.pk))

        self.assertTrue(Shelter.objects.filter(pk=self.shelter.pk).exists())


class ShelterUpdateOrganizationImmutableTestCase(TestCase):
    """Ensure shelter_update cannot change the shelter's organization."""

    def setUp(self) -> None:
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
