"""Tests for the grant-model explanation (``common.permissions.explain``).

The load-bearing property: the verdict is the canonical predicate's answer —
each scenario asserts parity with ``can`` / ``can_obj`` / ``can_anywhere`` — and
the arms attribute it correctly (global tier, direct, delegated, object, legacy).
"""

from __future__ import annotations

from io import StringIO

from accounts.models import Role, User
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from clients.models import ClientProfile
from common.permissions.explain import Arm, Explanation, explain
from common.permissions.selectors import can, can_anywhere, can_obj
from common.tests.utils import add_legacy_membership, make_permission_group
from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE
from shelters.models import Shelter
from shelters.tests.baker_recipes import shelter_recipe


def _arm(explanation: Explanation, label: str) -> Arm:
    return next(arm for arm in explanation.arms if arm.label == label)


class ExplainPermissionTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.org_a = organization_recipe.make(name="Explain Org A")
        self.org_b = organization_recipe.make(name="Explain Org B")
        self.shelter_a = shelter_recipe.make(organization=self.org_a)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    # ── org mode ──────────────────────────────────────────────────────────

    def test_direct_grant_allows_at_org(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        result = explain(alice, Shelter.perms.VIEW, org=self.org_a)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can(alice, Shelter.perms.VIEW, org=self.org_a))
        self.assertTrue(result.cut_over)
        self.assertTrue(_arm(result, "direct grant").holds)
        self.assertFalse(_arm(result, "global tier").holds)
        self.assertFalse(_arm(result, "delegated").holds)
        self.assertFalse(_arm(result, "legacy rows").holds)

    def test_no_authority_denies_every_arm(self) -> None:
        stranger = baker.make(User)

        result = explain(stranger, Shelter.perms.VIEW, org=self.org_a)

        self.assertFalse(result.verdict)
        self.assertEqual(result.verdict, can(stranger, Shelter.perms.VIEW, org=self.org_a))
        self.assertEqual([arm.label for arm in result.arms if arm.holds], [])

    def test_global_role_holder_allows(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        result = explain(gso, Shelter.perms.VIEW, org=self.org_b)
        anywhere = explain(gso, Shelter.perms.VIEW)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can(gso, Shelter.perms.VIEW, org=self.org_b))
        self.assertTrue(_arm(result, "global tier").holds)
        self.assertTrue(anywhere.verdict)
        self.assertEqual(anywhere.verdict, can_anywhere(gso, Shelter.perms.VIEW))

    def test_superuser_allows(self) -> None:
        admin = baker.make(User, is_superuser=True)

        result = explain(admin, Shelter.perms.VIEW, org=self.org_a)

        self.assertTrue(result.verdict)
        self.assertIn("superuser: yes", _arm(result, "global tier").detail)

    # ── legacy arm posture ────────────────────────────────────────────────

    def test_legacy_only_holder_denied_for_cut_over_domain(self) -> None:
        group = make_permission_group(organization=self.org_a, template_name=SHELTER_OPERATOR_ROLE.name)
        group.permissions.add(Permission.objects.get(content_type__app_label="shelters", codename="view_shelter"))
        holder = baker.make(User)
        self.org_a.add_user(holder)
        add_legacy_membership(holder, group=group)

        result = explain(holder, Shelter.perms.VIEW, org=self.org_a)

        self.assertFalse(result.verdict)
        self.assertEqual(result.verdict, can(holder, Shelter.perms.VIEW, org=self.org_a))
        legacy = _arm(result, "legacy rows")
        self.assertFalse(legacy.holds)
        self.assertIn("inert", legacy.detail)
        self.assertTrue(any("inert" in note for note in result.notes))

    def test_legacy_domain_rows_are_reported_live(self) -> None:
        group = make_permission_group(organization=self.org_a, template_name="Caseworker")
        group.permissions.add(Permission.objects.get(content_type__app_label="notes", codename="view_note"))
        holder = baker.make(User)
        self.org_a.add_user(holder)
        add_legacy_membership(holder, group=group)

        result = explain(holder, "notes.view_note", org=self.org_a)

        self.assertFalse(result.cut_over)
        self.assertFalse(result.verdict)  # the grant model is not wired for notes yet
        self.assertEqual(result.verdict, can(holder, "notes.view_note", org=self.org_a))
        legacy = _arm(result, "legacy rows")
        self.assertTrue(legacy.holds)
        self.assertIn("live", legacy.detail)
        self.assertTrue(any("has not cut over" in note for note in result.notes))

    # ── delegated arm ─────────────────────────────────────────────────────

    def test_delegation_allows_where_the_user_acts(self) -> None:
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_a)
        bob = baker.make(User)
        self.org_b.add_user(bob)
        grant_create(user=bob, role=self.shelter_role, scope_org=self.org_b)

        result = explain(bob, Shelter.perms.VIEW, org=self.org_a)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can(bob, Shelter.perms.VIEW, org=self.org_a))
        self.assertTrue(_arm(result, "delegated").holds)
        self.assertIn("Explain Org B", _arm(result, "delegated").detail)
        self.assertFalse(_arm(result, "direct grant").holds)

    def test_delegation_requires_acting_at_the_delegator(self) -> None:
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_a)
        charlie = baker.make(User)
        self.org_b.add_user(charlie)  # membership alone — no grant at B

        result = explain(charlie, Shelter.perms.VIEW, org=self.org_a)

        self.assertFalse(result.verdict)
        self.assertIn("does not act", _arm(result, "delegated").detail)

    # ── object mode ───────────────────────────────────────────────────────

    def test_object_mode_org_tier(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        in_scope = explain(alice, Shelter.perms.VIEW, obj=self.shelter_a)
        out_of_scope = explain(alice, Shelter.perms.VIEW, obj=self.shelter_b)

        self.assertTrue(in_scope.verdict)
        self.assertEqual(in_scope.verdict, can_obj(alice, Shelter.perms.VIEW, self.shelter_a))
        self.assertTrue(any("ORG" in note for note in in_scope.notes))
        self.assertFalse(out_of_scope.verdict)
        self.assertEqual(out_of_scope.verdict, can_obj(alice, Shelter.perms.VIEW, self.shelter_b))

    def test_object_mode_shared_tier(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)  # carries view_clientprofile
        client = baker.make(ClientProfile)

        result = explain(alice, ClientProfile.perms.VIEW, obj=client)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can_obj(alice, ClientProfile.perms.VIEW, client))
        self.assertTrue(any("SHARED" in note for note in result.notes))

    # ── input validation ──────────────────────────────────────────────────

    def test_rejects_malformed_perm_and_double_scope(self) -> None:
        user = baker.make(User)

        with self.assertRaises(ValueError):
            explain(user, "view_shelter", org=self.org_a)
        with self.assertRaises(ValueError):
            explain(user, Shelter.perms.VIEW, org=self.org_a, obj=self.shelter_a)

    # ── command surface ───────────────────────────────────────────────────

    def test_command_reports_verdict(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        out = StringIO()

        call_command(
            "explain_permission",
            "--user",
            str(alice.pk),
            "--perm",
            Shelter.perms.VIEW,
            "--org",
            str(self.org_a.pk),
            stdout=out,
        )

        output = out.getvalue()
        self.assertIn("verdict     ALLOWED", output)
        self.assertIn("direct grant", output)

    def test_command_exits_nonzero_on_deny(self) -> None:
        stranger = baker.make(User)

        with self.assertRaises(SystemExit) as ctx:
            call_command(
                "explain_permission",
                "--user",
                str(stranger.pk),
                "--perm",
                Shelter.perms.VIEW,
                "--org",
                str(self.org_a.pk),
                stdout=StringIO(),
            )

        self.assertEqual(ctx.exception.code, 1)
