from django.contrib.auth.models import Group
from django.test import TestCase

from .recipes import (
    organization_recipe,
    permission_group_recipe,
    permission_group_template_recipe,
    permission_recipe,
)


class PermissionGroupTests(TestCase):

    def test_group_creation_inherits_template_permissions(self):
        permission1 = permission_recipe.make()
        permission2 = permission_recipe.make()
        permission_template = permission_group_template_recipe.make(
            permissions=[permission1, permission2]
        )

        permission_group = permission_group_recipe.make(template=permission_template)
        expected_group_name = (
            f"{permission_group.organization.name}_{permission_group.template.name}"
        )

        created_group = Group.objects.get(name=expected_group_name)
        self.assertTrue(created_group.permissions.filter(id=permission1.id).exists())
        self.assertTrue(created_group.permissions.filter(id=permission2.id).exists())

    def test_group_creation_without_template_has_no_permissions(self):
        permission_group = permission_group_recipe.make(template=None)
        created_group = Group.objects.get(
            name=f"{permission_group.organization.name}_{permission_group.name}"
        )
        self.assertEqual(created_group.permissions.count(), 0)

    def test_deleting_permission_group_also_deletes_associated_group(self):
        permission_group = permission_group_recipe.make()
        group_id = permission_group.group.id
        permission_group.delete()
        self.assertFalse(Group.objects.filter(id=group_id).exists())

    def test_deleting_organization_cascades_to_delete_permission_groups_and_associated_groups(
        self,
    ):
        organization = organization_recipe.make()
        permission_groups = permission_group_recipe.make(
            _quantity=3, organization=organization
        )

        permission_groups_before_delete = PermissionGroup.objects.filter(
            organization=organization
        ).count()
        groups_before_delete = Group.objects.filter(
            permissiongroup__organization=organization
        ).count()

        self.assertEqual(permission_groups_before_delete, 3)
        self.assertEqual(groups_before_delete, 3)

        organization.delete()

        permission_groups_after_delete = PermissionGroup.objects.filter(
            organization=organization
        ).exists()
        groups_after_delete = Group.objects.filter(
            permissiongroup__organization=organization
        ).exists()

        self.assertFalse(permission_groups_after_delete)
        self.assertFalse(groups_after_delete)
