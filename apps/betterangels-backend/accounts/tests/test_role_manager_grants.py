"""Membership dual-write: role memberships mirror into ``Grant`` rows.

ADR 0001 §4 phase 2 — during the transition, a legacy ``PermissionGroup``
membership is written together with (for role-backed templates) a ``Grant``
that is authoritative for the cut-over domains.  The mirror is enforced at the
``User.groups`` m2m edge (``accounts.signals``), so it holds for every writer,
not just ``OrgRoleManager``.
"""

from typing import Any

from accounts.models import Grant, OrganizationProfile, PermissionGroup, Role, User
from accounts.role_manager import OrgRoleManager
from accounts.services import reconcile_org_groups
from common.permissions.config import TemplateConfig
from common.tests.utils import make_permission_group
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
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
        make_permission_group(organization=self.org, template_name=NOT_ROLE_BACKED.name)

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


class MembershipEdgeMirrorTestCase(TestCase):
    """The mirror is enforced at the ``User.groups`` m2m edge (``accounts.signals``).

    Any writer — the Django admin, a data script, the shell — keeps the
    invariant without going through ``OrgRoleManager``.  A cascading delete of
    the legacy group does NOT revoke the Grants: teardown retires legacy rows,
    and the Grants are the successor authority.
    """

    def setUp(self) -> None:
        self.user = baker.make(User)
        self.org = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.org.add_user(self.user)
        self.group = PermissionGroup.objects.get(organization=self.org, template__name=CASEWORKER.name)
        self.role = Role.objects.get(name=CASEWORKER.name, is_global=False)

    def _mirrors(self) -> Any:
        return Grant.objects.filter(principal_user=self.user, role=self.role, scope_org=self.org)

    def test_a_direct_group_add_mirrors_a_grant(self) -> None:
        self.user.groups.add(self.group)

        self.assertTrue(self._mirrors().exists())

    def test_a_reverse_user_set_add_mirrors_a_grant(self) -> None:
        self.group.user_set.add(self.user)

        self.assertTrue(self._mirrors().exists())

    def test_a_direct_group_remove_unmirrors_the_grant(self) -> None:
        self.user.groups.add(self.group)

        self.user.groups.remove(self.group)

        self.assertFalse(self._mirrors().exists())

    def test_clearing_groups_unmirrors_every_held_membership(self) -> None:
        self.user.groups.add(self.group)

        self.user.groups.clear()

        self.assertFalse(self._mirrors().exists())

    def test_a_reverse_clear_unmirrors_every_member(self) -> None:
        self.group.user_set.add(self.user)

        self.group.user_set.clear()

        self.assertFalse(self._mirrors().exists())

    def test_a_label_only_group_mirrors_nothing(self) -> None:
        hand_made = PermissionGroup.objects.create(organization=self.org, label="Hand-made role")
        self.user.groups.add(hand_made)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

    def test_a_global_role_group_mirrors_nothing(self) -> None:
        global_role = Role.objects.create(name="Test Global Role", is_global=True)
        self.user.groups.add(global_role)

        self.assertFalse(Grant.objects.filter(principal_user=self.user, scope_org=self.org).exists())

    def test_deleting_the_group_leaves_the_grant_for_teardown(self) -> None:
        """Teardown deletes legacy rows; the Grant is the successor authority."""
        self.user.groups.add(self.group)
        self.assertTrue(self._mirrors().exists())

        PermissionGroup.objects.filter(pk=self.group.pk).delete()

        self.assertTrue(self._mirrors().exists())

    def test_reconcile_of_a_stale_group_unmirrors_the_grant(self) -> None:
        """Config cleanup REVOKES the mirrored authority (finding F1 on #2443).

        A type change that drops a role must lose its Grant — reconcile knows
        the row is stale, so it unmirrors before the delete.  That is the
        counterpart to the teardown delete above, which deliberately does not.
        """
        self.user.groups.add(self.group)
        self.assertTrue(self._mirrors().exists())

        OrganizationProfile.objects.filter(organization=self.org).update(org_types=["shelter"])
        reconcile_org_groups(self.org)

        self.assertFalse(PermissionGroup.objects.filter(pk=self.group.pk).exists())
        self.assertFalse(self._mirrors().exists())

    def test_removing_a_membership_revokes_a_same_row_direct_grant(self) -> None:
        """A direct Grant of the same role/org IS the mirrored row (finding F3).

        The unique constraint makes them indistinguishable, so removing the
        membership deletes the directly-created row too — pinned here, and
        flagged in the ``GrantAdmin`` form description.
        """
        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org)
        self.user.groups.add(self.group)
        self.assertEqual(self._mirrors().count(), 1)  # add found the same row

        self.user.groups.remove(self.group)

        self.assertFalse(self._mirrors().exists())
