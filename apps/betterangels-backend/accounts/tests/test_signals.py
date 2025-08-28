from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from django.test import TestCase
from model_bakery import baker

from .baker_recipes import organization_recipe


class OrgSignalTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_handle_caseworker_perm_group_created_signal(self) -> None:
        org_1 = organization_recipe.make()
        org_2 = organization_recipe.make()
        user = baker.make(User)

        initial_org_1_perm_groups = PermissionGroup.objects.filter(organization=org_1)
        initial_org_2_perm_groups = PermissionGroup.objects.filter(organization=org_2)
        self.assertEqual(initial_org_1_perm_groups.count(), 0)
        self.assertEqual(initial_org_2_perm_groups.count(), 0)

        org_1.add_user(user)
        org_1_perm_groups = PermissionGroup.objects.filter(organization=org_1)
        org_2_perm_groups = PermissionGroup.objects.filter(organization=org_2)
        self.assertEqual(org_1_perm_groups.count(), 3)
        self.assertEqual(org_2_perm_groups.count(), 0)

        org_perm_group_names = [pg.name for pg in org_1_perm_groups]
        expected_names = [
            GroupTemplateNames.CASEWORKER,
            GroupTemplateNames.ORG_ADMIN,
            GroupTemplateNames.ORG_SUPERUSER,
        ]
        self.assertCountEqual(org_perm_group_names, expected_names)
