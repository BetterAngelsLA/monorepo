from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group, Permission
from django.test import TestCase
from model_bakery import baker
from model_bakery.random_gen import gen_string
from organizations.models import Organization


class PermissionGroupTests(TestCase):
    def test_group_creation_with_template_permissions(self) -> None:
        org_name = gen_string(max_length=50)
        organization: Organization = baker.make(
            Organization, name=org_name, slug=org_name
        )
        permission1 = baker.make(Permission)
        permission2 = baker.make(Permission)

        permission_template = baker.make(
            PermissionGroupTemplate,
            name=gen_string(max_length=50),
            permissions=[permission1, permission2],
        )
        expected_group_name = f"{organization.name}_{permission_template.name}"

        baker.make(
            PermissionGroup,
            organization=organization,
            template=permission_template,
        )

        created_group = Group.objects.get(name=expected_group_name)
        self.assertTrue(
            created_group.permissions.filter(codename=permission1.codename).exists()
        )
        self.assertTrue(
            created_group.permissions.filter(codename=permission2.codename).exists()
        )

    def test_group_creation_without_template_creates_empty_group(self) -> None:
        org_name = gen_string(max_length=50)
        organization: Organization = baker.make(
            Organization, name=org_name, slug=org_name
        )
        permission_group = baker.make(PermissionGroup, organization=organization)

        created_group = Group.objects.get(
            name=f"{organization.name}_{permission_group.name}"
        )
        self.assertEqual(
            created_group.permissions.count(),
            0,
            "Group created without a template should have no permissions",
        )
