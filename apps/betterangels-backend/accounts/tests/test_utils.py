from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from django.contrib.auth.models import Group
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe


class OrgRoleManagerTestCase(ParametrizedTestCase, TestCase):
    """OrgRoleManager after the org-admin teardown (ADR 0001).

    ORG_ADMIN/ORG_SUPERUSER are grant-only: ``add_roles``/``remove_roles``
    mirror the scoped ``Role`` ``Grant`` and never touch a ``PermissionGroup``
    row (none exists — reconcile retires them).  CASEWORKER is still dual-write:
    the org ``PermissionGroup`` membership is created alongside its Grant.
    """

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
        """Helper: fetch the ``auth.Group`` row for a dual-write (org, template).

        The parent instance rather than the ``PermissionGroup``: Django compares
        concrete models in ``__eq__``, so a child never equals the parent row
        these assertions look for in ``user.groups``.
        """
        return Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name=template_name,
        )

    def _has_grant(self, org: Organization, role_name: str) -> bool:
        """Whether *user* holds the scoped ``Role`` ``Grant`` at *org*."""
        return self.user.grants.filter(scope_org=org, role__name=role_name).exists()

    def _assert_no_org_admin_rows(self, org: Organization) -> None:
        """No PermissionGroup row may exist for the grant-only org-admin roles."""
        from accounts.models import PermissionGroup

        self.assertFalse(
            PermissionGroup.objects.filter(
                organization=org, template__name__in=[ORG_ADMIN.name, ORG_SUPERUSER.name]
            ).exists()
        )

    def test_set_role(self) -> None:
        omb = OrgRoleManager(self.org_1)

        self.assertFalse(self._has_grant(self.org_1, ORG_ADMIN.name))
        self.assertFalse(self._has_grant(self.org_1, ORG_SUPERUSER.name))

        omb.add_roles(self.user, CASEWORKER, ORG_ADMIN)
        self.assertTrue(self._has_grant(self.org_1, ORG_ADMIN.name))
        self.assertFalse(self._has_grant(self.org_1, ORG_SUPERUSER.name))
        self._assert_no_org_admin_rows(self.org_1)

        omb.replace_roles(self.user, CASEWORKER, ORG_SUPERUSER)
        self.assertFalse(self._has_grant(self.org_1, ORG_ADMIN.name))
        self.assertTrue(self._has_grant(self.org_1, ORG_SUPERUSER.name))

    def test_remove_roles(self) -> None:
        """remove_roles removes only the specified templates, leaving others."""
        omb = OrgRoleManager(self.org_2)
        caseworker_group = self._get_org_group(self.org_2, "Caseworker")

        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertTrue(self._has_grant(self.org_2, ORG_SUPERUSER.name))

        omb.remove_roles(self.user, ORG_SUPERUSER)
        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertFalse(self._has_grant(self.org_2, ORG_SUPERUSER.name))

        omb.remove_roles(self.user, CASEWORKER)
        self.assertNotIn(caseworker_group, self.user.groups.all())

    def test_clear_roles(self) -> None:
        caseworker_group = self._get_org_group(self.org_2, "Caseworker")

        self.assertIn(caseworker_group, self.user.groups.all())
        self.assertTrue(self._has_grant(self.org_2, ORG_SUPERUSER.name))

        self.omb_2.clear_roles(self.user)

        self.assertNotIn(caseworker_group, self.user.groups.all())
        self.assertFalse(self._has_grant(self.org_2, ORG_SUPERUSER.name))
        self.assertFalse(self._has_grant(self.org_2, ORG_ADMIN.name))
