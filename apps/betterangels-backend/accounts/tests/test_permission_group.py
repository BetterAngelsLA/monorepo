from accounts.models import PermissionGroup, PermissionGroupTemplate
from accounts.seed import sync_group_permissions
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from django.test import TestCase
from notes.groups import CASEWORKER
from organizations.models import Organization

from .baker_recipes import organization_recipe, permission_group_recipe


class PermissionGroupTestCase(TestCase):
    def test_group_name_is_scoped_to_the_organization_id(self) -> None:
        """The name must key on the org's pk, not its name.

        ``auth.Group.name`` is unique and capped at 150 characters, while
        ``Organization.name`` is neither, so a name-derived value collides
        between same-named orgs and goes stale on rename.
        """
        permission_group = permission_group_recipe.make(template=None)

        self.assertEqual(
            permission_group.group.name,
            f"org:{permission_group.organization_id}:{permission_group.name}",
        )

    def test_two_organizations_may_share_a_name(self) -> None:
        first = Organization.objects.create(name="Acme")
        second = Organization.objects.create(name="Acme")
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=CASEWORKER.name)

        first_group = PermissionGroup.objects.create(organization=first, template=template)
        second_group = PermissionGroup.objects.create(organization=second, template=template)

        self.assertNotEqual(first_group.group.name, second_group.group.name)

    def test_renaming_an_organization_leaves_its_group_names_intact(self) -> None:
        permission_group = permission_group_recipe.make(template=None)
        original_name = permission_group.group.name

        organization = permission_group.organization
        organization.name = "Renamed Organization"
        organization.save()

        permission_group.group.refresh_from_db()
        self.assertEqual(permission_group.group.name, original_name)

    def test_group_receives_the_permissions_configured_for_its_template(self) -> None:
        organization = organization_recipe.make(owner_roles=())
        permission_group = PermissionGroup.objects.get(organization=organization, template__name=CASEWORKER.name)

        sync_group_permissions()

        granted = set(permission_group.group.permissions.values_list("content_type__app_label", "codename"))
        expected = {tuple(entry.split(".", 1)) for entry in CASEWORKER.permissions}
        self.assertSetEqual(granted, expected)

    def test_group_without_a_template_has_no_permissions(self) -> None:
        permission_group = permission_group_recipe.make(template=None)

        sync_group_permissions()

        self.assertEqual(permission_group.group.permissions.count(), 0)

    def test_deleting_permission_group_also_deletes_associated_group(self) -> None:
        permission_group = permission_group_recipe.make()
        group_id = permission_group.group_id

        permission_group.delete()

        self.assertFalse(Group.objects.filter(id=group_id).exists())

    def test_deleting_organization_deletes_permission_groups_and_associated_groups(
        self,
    ) -> None:
        organization = organization_recipe.make(owner_roles=())
        permission_group_ids = list(
            PermissionGroup.objects.filter(organization=organization).values_list("pk", flat=True)
        )
        # Captured up front: once the rows are gone, a join through them matches
        # nothing whether or not the groups were actually deleted.
        group_ids = list(PermissionGroup.objects.filter(organization=organization).values_list("group_id", flat=True))
        self.assertEqual(len(group_ids), 3)

        organization.delete()

        self.assertFalse(PermissionGroup.objects.filter(pk__in=permission_group_ids).exists())
        self.assertFalse(Group.objects.filter(pk__in=group_ids).exists())

    def test_a_group_with_neither_template_nor_name_is_rejected(self) -> None:
        """The admin inline leaves both optional, but one is needed to name the group.

        Without this the group is named ``org:<pk>:`` and the next such row
        collides on the unique ``auth.Group.name``.
        """
        organization = organization_recipe.make(owner_roles=())

        with self.assertRaises(ValidationError):
            PermissionGroup(organization=organization).full_clean()
