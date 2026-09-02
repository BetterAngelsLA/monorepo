from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import Grant, Role, User
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
        """Helper: fetch the legacy ``auth.Group`` row for (org, template_name).

        The parent instance rather than the ``PermissionGroup``: Django compares
        concrete models in ``__eq__``, so a child never equals the parent row
        these assertions look for in ``user.groups``.
        """
        return Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name=template_name,
        )

    def _role(self, name: str) -> Role:
        return Role.objects.get(name=name, is_global=False)

    def _holds_role(self, org: Organization, user: User, role_name: str) -> bool:
        """§5.3 provisioning: role-backed templates (ORG_ADMIN/ORG_SUPERUSER)
        are held as Grants — the legacy PermissionGroup rows no longer exist."""
        return Grant.objects.filter(
            principal_user=user,
            role=self._role(role_name),
            scope_org=org,
        ).exists()

    def test_set_role(self) -> None:
        omb = OrgRoleManager(self.org_1)

        # Initially the user holds nothing at org_1.
        self.assertFalse(self._holds_role(self.org_1, self.user, ORG_ADMIN.name))
        self.assertFalse(self._holds_role(self.org_1, self.user, ORG_SUPERUSER.name))
        self.assertFalse(self.user.groups.filter(permissiongroup__organization=self.org_1).exists())

        omb.add_roles(self.user, CASEWORKER, ORG_ADMIN)
        caseworker_group = self._get_org_group(self.org_1, CASEWORKER.name)
        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertTrue(self._holds_role(self.org_1, self.user, ORG_ADMIN.name))
        self.assertFalse(self._holds_role(self.org_1, self.user, ORG_SUPERUSER.name))

        omb.replace_roles(self.user, CASEWORKER, ORG_SUPERUSER)
        self.assertFalse(self._holds_role(self.org_1, self.user, ORG_ADMIN.name))
        self.assertTrue(self._holds_role(self.org_1, self.user, ORG_SUPERUSER.name))
        self.assertIn(caseworker_group, self.user.groups.all())

    def test_remove_roles(self) -> None:
        """remove_roles should remove only the specified templates, leaving others."""
        omb = OrgRoleManager(self.org_2)
        caseworker_group = self._get_org_group(self.org_2, CASEWORKER.name)

        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertTrue(self._holds_role(self.org_2, self.user, ORG_SUPERUSER.name))

        omb.remove_roles(self.user, ORG_SUPERUSER)
        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertFalse(self._holds_role(self.org_2, self.user, ORG_SUPERUSER.name))

        omb.remove_roles(self.user, CASEWORKER)
        self.assertNotIn(caseworker_group, self.user.groups.all())

    def test_clear_roles(self) -> None:
        self.assertTrue(self._holds_role(self.org_2, self.user, ORG_SUPERUSER.name))

        self.omb_2.clear_roles(self.user)

        self.assertFalse(self._holds_role(self.org_2, self.user, ORG_SUPERUSER.name))
        self.assertFalse(self._holds_role(self.org_2, self.user, ORG_ADMIN.name))
        self.assertFalse(self.user.groups.filter(permissiongroup__organization=self.org_2).exists())
