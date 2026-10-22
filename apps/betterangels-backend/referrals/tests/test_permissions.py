"""Referral capability: the scoped Caseworker Role, and nothing else.

Referrals are the first fully grant-only domain in the caseworker bundle.  The
legacy ``CASEWORKER`` template carries **no** referral permission — a
model-level copy there is global and would bypass the org scope — and
add/change/view/delete ride the scoped ``Caseworker`` Role, which is exercised
only through a ``Grant``.  These tests pin that split so a template edit cannot
silently re-create the crossing capability.
"""

from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker

from accounts.models import Role, User
from accounts.seed import sync_group_permissions
from accounts.selectors import organization_effective_permissions
from accounts.services import sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.tests.utils import make_permission_group
from notes.groups import CASEWORKER, CASEWORKER_ROLE
from referrals.models import Referral
from shelters.groups import SHELTER_OPERATOR

REFERRAL_PERMS = {
    Referral.perms.ADD,
    Referral.perms.CHANGE,
    Referral.perms.VIEW,
    Referral.perms.DELETE,
}


def referral_perms(permissions: list[str]) -> set[str]:
    return {perm for perm in permissions if perm.startswith("referrals.")}


class ReferralCapabilityDefinitionTests(TestCase):
    def test_caseworker_role_owns_the_referral_capability(self) -> None:
        self.assertEqual(referral_perms(CASEWORKER_ROLE.permissions), REFERRAL_PERMS)

    def test_caseworker_template_carries_no_referrals(self) -> None:
        # The point of the cutover: no legacy, model-level copy exists, so the
        # PermissionGroup arm is inert and cannot reach across organizations.
        self.assertEqual(referral_perms(CASEWORKER.permissions), set())

    def test_no_other_template_or_role_carries_referrals(self) -> None:
        # Rollout is flag-driven, so the capability must not leak onto every role.
        # Walked, not enumerated: a new role or template fails here instead of
        # silently inheriting it — the subset rule in ``accounts/tests/test_roles``
        # exempts this app, so this is the guard for it.
        from accounts.services import _all_role_defs
        from common.org_types import REGISTRY

        for role_def in _all_role_defs():
            if role_def.name != CASEWORKER_ROLE.name:
                self.assertEqual(referral_perms(role_def.permissions), set(), role_def.name)

        for name in REGISTRY.template_names():
            template = REGISTRY.template(name)
            if template is not None and name != CASEWORKER.name:
                self.assertEqual(referral_perms(template.permissions), set(), name)


class ReferralRoleSyncTests(TestCase):
    def test_sync_roles_applies_the_referral_capability_to_the_role(self) -> None:
        sync_roles()

        codenames = set(
            Role.objects.get(name=CASEWORKER_ROLE.name)
            .permissions.filter(content_type__app_label="referrals")
            .values_list("codename", flat=True)
        )
        self.assertEqual(codenames, {"add_referral", "change_referral", "view_referral", "delete_referral"})

    def test_sync_group_permissions_strips_referrals_from_the_legacy_group(self) -> None:
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        group = make_permission_group(organization=org, template_name=CASEWORKER.name)
        # Simulate the pre-cutover row: the group *did* carry the referral
        # bundle.  Without this the test asserts empty == empty and proves
        # nothing.
        group.permissions.add(*Permission.objects.filter(content_type__app_label="referrals"))
        self.assertTrue(group.permissions.filter(content_type__app_label="referrals").exists())

        sync_group_permissions(organization=org)

        codenames = set(
            group.permissions.filter(content_type__app_label="referrals").values_list("codename", flat=True)
        )
        self.assertEqual(codenames, set())


class ReferralEffectivePermissionTests(TestCase):
    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_caseworker_grant_reports_the_referral_capability(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        org.add_user(user)
        user.groups.add(make_permission_group(organization=org, template_name=CASEWORKER.name))

        effective = set(organization_effective_permissions(user)[org.id])

        self.assertTrue(REFERRAL_PERMS <= effective)

    def test_org_member_without_the_role_reports_no_referrals(self) -> None:
        user = baker.make(User)
        org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        org.add_user(user)

        effective = set(organization_effective_permissions(user)[org.id])

        self.assertEqual({perm for perm in effective if perm.startswith("referrals.")}, set())
