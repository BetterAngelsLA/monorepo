"""Referral permissions: the Caseworker capability and the effective report.

The referrals app contributes its slice of the Caseworker bundle via
``referrals.permissions``; these tests pin that contribution so a template edit
cannot silently drop or over-grant referral access.  ``ffReferrals`` (waffle,
scoped to users and groups) decides which teams actually get the feature, so no
other role bundle should carry referral permissions.
"""

from django.test import TestCase
from model_bakery import baker

from accounts.groups import ORG_ADMIN, ORG_ADMIN_ROLE, ORG_SUPERUSER, ORG_SUPERUSER_ROLE
from accounts.models import User
from accounts.seed import sync_group_permissions
from accounts.selectors import organization_effective_permissions
from accounts.tests.baker_recipes import organization_recipe
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


def referral_perms(permissions: list[str]) -> set[str]:
    return {perm for perm in permissions if perm.startswith("referrals.")}


class ReferralTemplateTests(TestCase):
    def test_caseworker_template_keeps_add_change_view_without_model_delete(self) -> None:
        self.assertEqual(referral_perms(CASEWORKER.permissions), REFERRAL_PERMS)

    def test_caseworker_role_stays_a_subset_and_does_not_role_back_referrals(self) -> None:
        self.assertTrue(set(CASEWORKER_ROLE.permissions) <= set(CASEWORKER.permissions))
        self.assertEqual(referral_perms(CASEWORKER_ROLE.permissions), set())

    def test_no_other_template_or_role_carries_referrals(self) -> None:
        # Rollout is flag-driven, so the capability must not leak onto every role.
        definitions = (
            ORG_ADMIN,
            ORG_SUPERUSER,
            SHELTER_OPERATOR,
            GLOBAL_SHELTER_OPERATOR,
            ORG_ADMIN_ROLE,
            ORG_SUPERUSER_ROLE,
            SHELTER_OPERATOR_ROLE,
            GLOBAL_SHELTER_OPERATOR_ROLE,
        )
        for definition in definitions:
            self.assertEqual(referral_perms(definition.permissions), set(), definition.name)


class ReferralPermissionSyncTests(TestCase):
    def test_sync_applies_caseworker_referral_permissions_without_delete(self) -> None:
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        group = make_permission_group(organization=org, template_name=CASEWORKER.name)

        sync_group_permissions(organization=org)

        codenames = set(
            group.permissions.filter(content_type__app_label="referrals").values_list("codename", flat=True)
        )
        self.assertEqual(codenames, {"add_referral", "change_referral", "view_referral"})


class ReferralEffectivePermissionTests(TestCase):
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

    def test_org_member_without_the_capability_has_no_referral_permissions(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        org.add_user(user)

        effective = set(organization_effective_permissions(user)[org.id])
        self.assertEqual({perm for perm in effective if perm.startswith("referrals.")}, set())
