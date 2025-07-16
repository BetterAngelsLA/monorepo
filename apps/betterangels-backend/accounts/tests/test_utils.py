from accounts.enums import OrgRoleEnum
from accounts.models import User
from accounts.utils import OrgPermissionManager
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe


class OrgPermissionManagerTestCase(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

        self.user = baker.make(User)
        self.org_1 = organization_recipe.make(name="o1")
        self.org_2 = organization_recipe.make(name="o2")
        self.org_1.add_user(self.user)
        self.org_2.add_user(self.user)
        self.omb_2 = OrgPermissionManager(self.org_2)

        self.omb_2.set_role(self.user, OrgRoleEnum.SUPERUSER)

    def test_set_role(self) -> None:
        omb = OrgPermissionManager(self.org_1)

        self.assertNotIn(omb._org_admin_group.group, self.user.groups.all())
        self.assertNotIn(omb._org_superuser_group.group, self.user.groups.all())

        omb.set_role(self.user, OrgRoleEnum.ADMIN)
        self.assertIn(omb._org_admin_group.group, self.user.groups.all())
        self.assertNotIn(omb._org_superuser_group.group, self.user.groups.all())

        omb.set_role(self.user, OrgRoleEnum.SUPERUSER)
        self.assertNotIn(omb._org_admin_group.group, self.user.groups.all())
        self.assertIn(omb._org_superuser_group.group, self.user.groups.all())

    def test_clear_permissions(self) -> None:
        self.assertIn(self.omb_2._org_superuser_group.group, self.user.groups.all())

        self.omb_2.clear_permissions(self.user)

        self.assertNotIn(self.omb_2._org_admin_group.group, self.user.groups.all())
        self.assertNotIn(self.omb_2._org_superuser_group.group, self.user.groups.all())
