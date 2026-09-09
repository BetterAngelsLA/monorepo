"""OrgRoleManager dual-write: role memberships mirror into ``Grant`` rows.

ADR 0001 §4 phase 2 — during the transition, ``OrgRoleManager`` writes BOTH the
legacy ``PermissionGroup`` membership AND (for role-backed templates) a
``Grant`` that is authoritative for the shelter domain.
"""

from accounts.models import Grant, PermissionGroup, PermissionGroupTemplate, Role, User
from accounts.role_manager import OrgRoleManager
from common.permissions.config import TemplateConfig
from django.test import TestCase
from model_bakery import baker
from shelters.groups import SHELTER_OPERATOR

from .baker_recipes import organization_recipe

# A template with no scoped Role row — every real member/admin template
# (SHELTER_OPERATOR, CASEWORKER, ORG_ADMIN, ORG_SUPERUSER) is role-backed now,
# so the "no Role row ⇒ no mirror" path is exercised with a test-only template.
NOT_ROLE_BACKED = TemplateConfig(name="Not Role Backed", permissions=[])


class OrgRoleManagerDualWriteTestCase(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User)
        # A shelter-preset org has a "Shelter Operator" PermissionGroup, and the
        # synced Role row exists (post_migrate).
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org.add_user(self.user)
        self.manager = OrgRoleManager(self.org)

    def _ensure_not_role_backed_group(self) -> None:
        """Create a PermissionGroup for the test-only template."""
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=NOT_ROLE_BACKED.name)
        PermissionGroup.objects.get_or_create(organization=self.org, template=template)

    def _shelter_operator_role(self) -> Role:
        return Role.objects.get(name=SHELTER_OPERATOR.name, is_global=False)

    def test_add_roles_mirrors_a_role_backed_membership_as_a_grant(self) -> None:
        self.manager.add_roles(self.user, SHELTER_OPERATOR)

        grant = Grant.objects.get(principal_user=self.user, scope_org=self.org)
        self.assertEqual(grant.role, self._shelter_operator_role())
        # The legacy membership is still written too (dual-write).
        self.assertTrue(
            self.user.groups.filter(
                permissiongroup__organization=self.org,
                permissiongroup__template__name=SHELTER_OPERATOR.name,
            ).exists()
        )

    def test_add_roles_skips_templates_without_a_role_row(self) -> None:
        """A template with no Role row mirrors no Grant (legacy only)."""
        self._ensure_not_role_backed_group()
        self.manager.add_roles(self.user, NOT_ROLE_BACKED)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())
        self.assertTrue(
            self.user.groups.filter(
                permissiongroup__organization=self.org,
                permissiongroup__template__name=NOT_ROLE_BACKED.name,
            ).exists()
        )

    def test_remove_roles_deletes_the_mirrored_grant(self) -> None:
        self.manager.add_roles(self.user, SHELTER_OPERATOR)
        self.assertTrue(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

        self.manager.remove_roles(self.user, SHELTER_OPERATOR)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

    def test_clear_roles_deletes_all_grants_at_the_org(self) -> None:
        self.manager.add_roles(self.user, SHELTER_OPERATOR)
        other = baker.make(User)
        self.org.add_user(other)
        OrgRoleManager(self.org).add_roles(other, SHELTER_OPERATOR)
        # self.user + other (the auto-generated owner also has one, excluded here).
        self.assertEqual(
            Grant.objects.filter(principal_user__in=[self.user, other], scope_org=self.org).count(),
            2,
        )

        self.manager.clear_roles(self.user)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())
        # Other users' grants are untouched.
        self.assertTrue(Grant.objects.filter(principal_user=other, scope_org=self.org).exists())

    def test_replace_roles_removes_stale_grant_and_mirrors_new_one(self) -> None:
        self.manager.add_roles(self.user, SHELTER_OPERATOR)
        self.assertTrue(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

        # replace_roles = clear + add; the replacement has no Role row, so the
        # stale Grant is deleted and none is mirrored.
        self._ensure_not_role_backed_group()
        self.manager.replace_roles(self.user, NOT_ROLE_BACKED)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())
        self.assertTrue(
            self.user.groups.filter(
                permissiongroup__organization=self.org,
                permissiongroup__template__name=NOT_ROLE_BACKED.name,
            ).exists()
        )
