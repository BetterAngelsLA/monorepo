from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group, Permission
from django.test import TestCase
from model_bakery import baker
from organizations.models import Organization


class PermissionGroupTests(TestCase):
    def test_group_creation_with_template_permissions(self) -> None:
        organization: Organization = baker.make(
            Organization, name="OrgWithTemplate", slug="orgwithtemplate"
        )
        permission1 = baker.make(Permission, codename="can_view")
        permission2 = baker.make(Permission, codename="can_edit")

        permission_template = baker.make(
            PermissionGroupTemplate,
            name="TemplateWithPerms",
            permissions=[permission1, permission2],
        )
        expected_group_name = f"{organization.name}_TemplateWithPerms"

        baker.make(
            PermissionGroup,
            organization=organization,
            template=permission_template,
        )

        created_group = Group.objects.get(name=expected_group_name)
        self.assertTrue(created_group.permissions.filter(codename="can_view").exists())
        self.assertTrue(created_group.permissions.filter(codename="can_edit").exists())

    def test_group_creation_without_template_creates_empty_group(self) -> None:
        organization: Organization = baker.make(
            Organization, name="OrgWithTemplate", slug="orgwithtemplate"
        )
        group_name = "GroupWithoutPerms"

        group = baker.make(Group, name=group_name)
        baker.make(PermissionGroup, organization=organization, group=group)

        created_group = Group.objects.get(name=group_name)
        self.assertEqual(
            created_group.permissions.count(),
            0,
            "Group created without a template should have no permissions",
        )
