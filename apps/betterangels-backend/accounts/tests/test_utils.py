from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from django.contrib.auth.models import Group
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe


class OrgRoleManagerTestCase(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()

        self.user = baker.make(User)
        self.org_1 = organization_recipe.make(name="o1")
        self.org_2 = organization_recipe.make(name="o2")
        self.org_1.add_user(self.user)
        self.org_2.add_user(self.user)
        self.omb_2 = OrgRoleManager(self.org_2)

        self.omb_2.add_roles(self.user, CASEWORKER, ORG_SUPERUSER)

    def _get_org_group(self, org: Organization, template_name: str) -> Group:
        """Helper: fetch the actual Group object for (org, template_name)."""
        pg = PermissionGroup.objects.get(organization=org, template__name=template_name)
        return pg.group

    def test_set_role(self) -> None:
        omb = OrgRoleManager(self.org_1)

        org_admin_group = self._get_org_group(self.org_1, "Organization Admin")
        org_superuser_group = self._get_org_group(self.org_1, "Organization Superuser")

        self.assertNotIn(org_admin_group, self.user.groups.all())
        self.assertNotIn(org_superuser_group, self.user.groups.all())

        omb.add_roles(self.user, CASEWORKER, ORG_ADMIN)
        self.assertIn(org_admin_group, self.user.groups.all())
        self.assertNotIn(org_superuser_group, self.user.groups.all())

        omb.replace_roles(self.user, CASEWORKER, ORG_SUPERUSER)
        self.assertNotIn(org_admin_group, self.user.groups.all())
        self.assertIn(org_superuser_group, self.user.groups.all())

    def test_remove_roles(self) -> None:
        """remove_roles should remove only the specified templates, leaving others."""
        omb = OrgRoleManager(self.org_2)
        caseworker_group = self._get_org_group(self.org_2, "Caseworker")
        org_superuser_group = self._get_org_group(self.org_2, "Organization Superuser")

        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertIn(org_superuser_group, self.user.groups.all())

        omb.remove_roles(self.user, ORG_SUPERUSER)
        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertNotIn(org_superuser_group, self.user.groups.all())

        omb.remove_roles(self.user, CASEWORKER)
        self.assertNotIn(caseworker_group, self.user.groups.all())

    def test_clear_roles(self) -> None:
        org_superuser_group = self._get_org_group(self.org_2, "Organization Superuser")

        self.assertIn(org_superuser_group, self.user.groups.all())

        self.omb_2.clear_roles(self.user)

        org_admin_group = self._get_org_group(self.org_2, "Organization Admin")
        self.assertNotIn(org_admin_group, self.user.groups.all())
        self.assertNotIn(org_superuser_group, self.user.groups.all())
