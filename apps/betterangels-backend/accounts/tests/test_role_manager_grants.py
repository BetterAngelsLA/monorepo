"""OrgRoleManager dual-write: role memberships mirror into ``Grant`` rows.

ADR 0001 §4 phase 2 — during the transition, ``OrgRoleManager`` writes BOTH the
legacy ``PermissionGroup`` membership AND (for role-backed templates) a
``Grant`` that is authoritative for the shelter domain.
"""

from accounts.models import Grant, PermissionGroup, PermissionGroupTemplate, Role, User
from accounts.role_manager import OrgRoleManager
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from shelters.groups import SHELTER_OPERATOR

from .baker_recipes import organization_recipe


class OrgRoleManagerDualWriteTestCase(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User)
        # A shelter-preset org has a "Shelter Operator" PermissionGroup, and the
        # synced Role row exists (post_migrate).
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        self.org.add_user(self.user)
        self.manager = OrgRoleManager(self.org)

    def _ensure_caseworker_group(self) -> None:
        """The shelter preset has no Caseworker group; create one for tests that
        exercise non-role-backed templates (ADR 0001 §2.2)."""
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=CASEWORKER.name)
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
        """CASEWORKER has no Role row, so no Grant is mirrored (legacy only)."""
        self._ensure_caseworker_group()
        self.manager.add_roles(self.user, CASEWORKER)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())
        self.assertTrue(
            self.user.groups.filter(
                permissiongroup__organization=self.org,
                permissiongroup__template__name=CASEWORKER.name,
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
        self._ensure_caseworker_group()
        self.manager.add_roles(self.user, SHELTER_OPERATOR)
        self.assertTrue(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

        # replace_roles = clear + add; CASEWORKER has no Role row, so the
        # stale Grant is deleted and none is mirrored.
        self.manager.replace_roles(self.user, CASEWORKER)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())
