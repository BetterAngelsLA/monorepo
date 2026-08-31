from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.role_manager import OrgRoleManager
from common.permissions.config import TemplateConfig
from django.contrib.auth.models import Group
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization
from shelters.groups import GLOBAL_SHELTER_OPERATOR
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
        """Helper: fetch the ``auth.Group`` row for (org, template_name).

        The parent instance rather than the ``PermissionGroup``: Django compares
        concrete models in ``__eq__``, so a child never equals the parent row
        these assertions look for in ``user.groups``.
        """
        return Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name=template_name,
        )

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

    def test_add_roles_refuses_org_bypass_role(self) -> None:
        """Org-bypassing roles are admin-only — the role manager must never grant them."""
        omb = OrgRoleManager(self.org_1)

        with self.assertRaisesMessage(ValueError, "Global Shelter Operator"):
            omb.add_roles(self.user, GLOBAL_SHELTER_OPERATOR)

        self.assertFalse(
            PermissionGroup.objects.filter(
                organization=self.org_1,
                user=self.user,
                template__bypasses_org_scoping=True,
            ).exists()
        )

    def test_add_roles_refuses_org_bypass_role_via_db_flag_for_a_crafted_config(self) -> None:
        """The DB template's flag is authoritative, not the caller's config argument.

        A caller could hand-build a ``TemplateConfig`` named like an existing
        bypass role with ``bypasses_org_scoping`` left at its ``False`` default;
        the config-level guard would pass and ``add_roles`` would resolve the
        real bypass ``PermissionGroup`` by name. The DB-row check must refuse it
        anyway.
        """
        omb = OrgRoleManager(self.org_1)
        bypass_template = PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR.name)
        PermissionGroup.objects.create(organization=self.org_1, template=bypass_template)

        crafted = TemplateConfig(
            name=GLOBAL_SHELTER_OPERATOR.name,
            permissions=GLOBAL_SHELTER_OPERATOR.permissions,
            is_invitable=False,
        )
        self.assertFalse(crafted.bypasses_org_scoping)

        with self.assertRaisesMessage(ValueError, "Global Shelter Operator"):
            omb.add_roles(self.user, crafted)

        self.assertFalse(
            PermissionGroup.objects.filter(
                organization=self.org_1,
                user=self.user,
                template__bypasses_org_scoping=True,
            ).exists()
        )

    def test_replace_roles_refuses_org_bypass_role(self) -> None:
        """replace_roles is clear + add, so the admin-only guard still applies."""
        omb = OrgRoleManager(self.org_2)

        with self.assertRaisesMessage(ValueError, "Global Shelter Operator"):
            omb.replace_roles(self.user, GLOBAL_SHELTER_OPERATOR)

        # The failed replace leaves existing roles and doesn't grant new roles.
        self.assertIn(self._get_org_group(self.org_2, "Caseworker"), self.user.groups.all())
        self.assertIn(self._get_org_group(self.org_2, "Organization Superuser"), self.user.groups.all())
        self.assertFalse(
            PermissionGroup.objects.filter(
                organization=self.org_2,
                user=self.user,
                template__bypasses_org_scoping=True,
            ).exists()
        )

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
