"""Referral permissions across the role templates and the effective report.

The referrals app contributes its slice of each role's bundle via
``referrals.permissions``; these tests pin that contribution so a template edit
cannot silently drop or over-grant referral access.
"""

from django.test import TestCase
from model_bakery import baker

from accounts.groups import ORG_ADMIN, ORG_ADMIN_ROLE, ORG_SUPERUSER, ORG_SUPERUSER_ROLE
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from accounts.seed import sync_group_permissions
from accounts.selectors import organization_effective_permissions
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.selectors import can
from common.tests.utils import make_permission_group
from notes.groups import CASEWORKER, CASEWORKER_ROLE
from referrals.models import Referral
from shelters.groups import (
    GLOBAL_SHELTER_OPERATOR,
    GLOBAL_SHELTER_OPERATOR_ROLE,
    SHELTER_OPERATOR,
    SHELTER_OPERATOR_ROLE,
)

REFERRAL_PERMS = {Referral.perms.ADD, Referral.perms.CHANGE, Referral.perms.VIEW}
REFERRAL_ALL = REFERRAL_PERMS | {Referral.perms.DELETE}


def referral_perms(permissions: list[str]) -> set[str]:
    return {perm for perm in permissions if perm.startswith("referrals.")}


class ReferralTemplateMatrixTests(TestCase):
    def test_caseworker_template_keeps_add_change_view_without_model_delete(self) -> None:
        self.assertEqual(referral_perms(CASEWORKER.permissions), REFERRAL_PERMS)

    def test_caseworker_role_stays_a_subset_and_does_not_role_back_referrals(self) -> None:
        self.assertTrue(set(CASEWORKER_ROLE.permissions) <= set(CASEWORKER.permissions))
        self.assertEqual(referral_perms(CASEWORKER_ROLE.permissions), set())

    def test_org_admin_templates_and_roles_carry_full_referral_crud(self) -> None:
        for template in (ORG_ADMIN, ORG_SUPERUSER):
            self.assertEqual(referral_perms(template.permissions), REFERRAL_ALL)
        for role in (ORG_ADMIN_ROLE, ORG_SUPERUSER_ROLE):
            self.assertEqual(referral_perms(role.permissions), REFERRAL_ALL)

    def test_shelter_operator_templates_and_roles_carry_view_only(self) -> None:
        for template in (SHELTER_OPERATOR, GLOBAL_SHELTER_OPERATOR):
            self.assertEqual(referral_perms(template.permissions), {Referral.perms.VIEW})
        for role in (SHELTER_OPERATOR_ROLE, GLOBAL_SHELTER_OPERATOR_ROLE):
            self.assertEqual(referral_perms(role.permissions), {Referral.perms.VIEW})


class ReferralPermissionSyncTests(TestCase):
    def test_sync_applies_caseworker_referral_permissions_without_delete(self) -> None:
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        group = make_permission_group(organization=org, template_name=CASEWORKER.name)

        sync_group_permissions(organization=org)

        codenames = set(
            group.permissions.filter(content_type__app_label="referrals").values_list(
                "codename", flat=True
            )
        )
        self.assertEqual(codenames, {"add_referral", "change_referral", "view_referral"})


class ReferralEffectivePermissionTests(TestCase):
    def test_org_admin_role_grants_full_referral_crud(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(ORG_ADMIN,))
        org.add_user(user)
        OrgRoleManager(org).add_roles(user, ORG_ADMIN)

        for perm in REFERRAL_ALL:
            self.assertTrue(can(user, perm, org=org), perm)

        effective = set(organization_effective_permissions(user)[org.id])
        self.assertTrue(REFERRAL_ALL <= effective)

    def test_shelter_operator_role_grants_referral_view_only(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        org.add_user(user)
        OrgRoleManager(org).add_roles(user, SHELTER_OPERATOR)

        self.assertTrue(can(user, Referral.perms.VIEW, org=org))
        self.assertFalse(can(user, Referral.perms.CHANGE, org=org))

    def test_caseworker_effective_permissions_include_view_without_delete(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        org.add_user(user)
        group = make_permission_group(organization=org, template_name=CASEWORKER.name)
        user.groups.add(group)

        sync_group_permissions(organization=org)

        effective = set(organization_effective_permissions(user)[org.id])
        self.assertTrue(REFERRAL_PERMS <= effective)
        self.assertNotIn(Referral.perms.DELETE, effective)
