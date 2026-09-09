from accounts.models import Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import grant_create
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError
from django.test import TestCase
from model_bakery import baker

from shelters.groups import SHELTER_OPERATOR
from shelters.models import ContactInfo, Shelter
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


class ShelterUpdateAdditionalContactsTestCase(ShelterServiceTestCase):
    """shelter_update applies full-replacement semantics to additional contacts."""

    def setUp(self) -> None:
        super().setUp()
        self.shelter = Shelter.objects.create(name="Contacts Shelter", organization=self.org)

    def _update(self, contacts: list[dict]) -> Shelter:
        return shelter_update(
            user=self.user,
            organization_id=self.org_id,
            data={"id": self.shelter.pk, "additional_contacts": contacts},
        )

    def test_creates_contacts_without_ids(self) -> None:
        self._update(
            [
                {"contact_name": "Ada", "contact_number": "2125550100"},
                {"contact_name": "Grace", "contact_number": "2125550101"},
            ]
        )

        names = list(self.shelter.additional_contacts.order_by("contact_name").values_list("contact_name", flat=True))
        self.assertEqual(names, ["Ada", "Grace"])

    def test_updates_existing_contact_in_place(self) -> None:
        existing = ContactInfo.objects.create(shelter=self.shelter, contact_name="Ada", contact_number="2125550100")

        self._update(
            [
                {
                    "id": existing.pk,
                    "contact_name": "Ada Lovelace",
                    "contact_number": "2125550100",
                    "contact_title": "Director",
                }
            ]
        )

        existing.refresh_from_db()
        self.assertEqual(existing.contact_name, "Ada Lovelace")
        self.assertEqual(existing.contact_title, "Director")
        self.assertEqual(self.shelter.additional_contacts.count(), 1)

    def test_deletes_omitted_contacts(self) -> None:
        keep = ContactInfo.objects.create(shelter=self.shelter, contact_name="Keep", contact_number="2125550100")
        ContactInfo.objects.create(shelter=self.shelter, contact_name="Drop", contact_number="2125550101")

        self._update([{"id": keep.pk, "contact_name": "Keep", "contact_number": "2125550100"}])

        self.assertEqual(
            list(self.shelter.additional_contacts.values_list("contact_name", flat=True)),
            ["Keep"],
        )

    def test_sets_is_claimant(self) -> None:
        self._update([{"contact_name": "Ada", "contact_number": "2125550100", "is_claimant": True}])

        self.assertTrue(self.shelter.additional_contacts.get().is_claimant)

    def test_rejects_invalid_contact_id(self) -> None:
        with self.assertRaises(ValidationError):
            self._update([{"id": "not-an-int", "contact_name": "Ada", "contact_number": "2125550100"}])

    def test_rejects_invalid_phone(self) -> None:
        with self.assertRaises(ValidationError):
            self._update([{"contact_name": "Ada", "contact_number": "not-a-phone"}])

        self.assertEqual(self.shelter.additional_contacts.count(), 0)

    def test_rejects_invalid_phone_on_update(self) -> None:
        existing = ContactInfo.objects.create(shelter=self.shelter, contact_name="Ada", contact_number="2125550100")
        original_number = str(existing.contact_number)

        with self.assertRaises(ValidationError):
            self._update([{"id": existing.pk, "contact_name": "Ada", "contact_number": "not-a-phone"}])

        existing.refresh_from_db()
        self.assertEqual(str(existing.contact_number), original_number)

    def test_rejects_invalid_email(self) -> None:
        with self.assertRaises(ValidationError):
            self._update(
                [
                    {
                        "contact_name": "Ada",
                        "contact_number": "2125550100",
                        "contact_email": "not-an-email",
                    }
                ]
            )

        self.assertEqual(self.shelter.additional_contacts.count(), 0)

    def test_invalid_contact_reports_indexed_field_path(self) -> None:
        """Errors are keyed by position so callers know which contact failed."""
        with self.assertRaises(ValidationError) as cm:
            self._update(
                [
                    {"contact_name": "Ada", "contact_number": "2125550100"},
                    {"contact_name": "Grace", "contact_number": "not-a-phone"},
                ]
            )

        self.assertIn("additional_contacts.1.contact_number", cm.exception.error_dict)

    def test_two_new_contacts_each_with_error(self) -> None:
        """Two new entries, each invalid, are both reported in one ValidationError."""
        with self.assertRaises(ValidationError) as cm:
            self._update(
                [
                    {"contact_name": "Ada", "contact_number": "not-a-phone"},
                    {
                        "contact_name": "Grace",
                        "contact_number": "2125550101",
                        "contact_email": "nope",
                    },
                ]
            )

        error_dict = cm.exception.error_dict
        self.assertIn("additional_contacts.0.contact_number", error_dict)
        self.assertIn("additional_contacts.1.contact_email", error_dict)
