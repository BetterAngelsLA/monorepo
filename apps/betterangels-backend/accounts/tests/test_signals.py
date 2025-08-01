from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from accounts.utils import OrgPermissionManager
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe


class OrgSignalTestCase(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_handle_caseworker_perm_group_created_signal(self) -> None:
        org = organization_recipe.make()
        user = baker.make(User)

        initial_org_perm_groups = PermissionGroup.objects.filter(organization=org)
        self.assertEqual(initial_org_perm_groups.count(), 0)

        org.add_user(user)
        org_perm_groups = PermissionGroup.objects.filter(organization=org)
        self.assertEqual(org_perm_groups.count(), 3)

        org_perm_group_names = [pg.name for pg in org_perm_groups]
        expected_names = [
            GroupTemplateNames.CASEWORKER,
            GroupTemplateNames.ORG_ADMIN,
            GroupTemplateNames.ORG_SUPERUSER,
        ]
        self.assertCountEqual(org_perm_group_names, expected_names)
