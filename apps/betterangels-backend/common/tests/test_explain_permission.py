"""Tests for the grant-model explanation (``common.permissions.explain``).

The load-bearing property: the verdict is the canonical predicate's answer —
each scenario asserts parity with ``can`` / ``can_obj`` / ``can_anywhere`` — and
the arms attribute it correctly (global tier, direct, delegated, object, legacy).
"""

from __future__ import annotations

import contextlib
from io import StringIO
from typing import Any

from django.contrib.auth.models import Permission
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from model_bakery import baker
from strawberry_django.utils.query import filter_for_user

from accounts.models import Grant, Role, User
from accounts.selectors import organization_effective_permissions, organization_permissions
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from clients.models import ClientProfile, ClientProfileImportRecord
from common.permissions.domain import LEGACY_LIVE_PERMISSIONS
from common.permissions.explain import Arm, Explanation, explain
from common.permissions.selectors import can, can_anywhere, can_obj
from common.tests.utils import add_legacy_membership, make_permission_group
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

    def test_direct_user_permission_allows(self) -> None:
        holder = baker.make(User)
        holder.user_permissions.add(Permission.objects.get(content_type__app_label="shelters", codename="view_shelter"))

        result = explain(holder, Shelter.perms.VIEW, org=self.org_b)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can(holder, Shelter.perms.VIEW, org=self.org_b))
        self.assertTrue(_arm(result, "global tier").holds)
        self.assertIn("user_permissions: yes", _arm(result, "global tier").detail)

    def test_grant_referencing_a_global_role_is_not_authority(self) -> None:
        """``loaddata`` can create what ``Grant.clean()`` refuses — the arm must not credit it.

        Enforcement matches scoped roles only (``is_global=False``); an arm that
        credited the row would be the debugger telling a user they hold
        something ``can()`` denies.
        """
        holder = baker.make(User)
        Grant.objects.create(principal_user=holder, role=self.gso_role, scope_org=self.org_a)

        result = explain(holder, Shelter.perms.VIEW, org=self.org_a)

        self.assertFalse(result.verdict)
        self.assertEqual(result.verdict, can(holder, Shelter.perms.VIEW, org=self.org_a))
        self.assertFalse(_arm(result, "direct grant").holds)
        self.assertEqual([arm.label for arm in result.arms if arm.holds], [])

    # ── inactive accounts ─────────────────────────────────────────────────

    def test_inactive_user_is_flagged(self) -> None:
        """``scopes()`` ignores ``is_active``, so the verdict still reads ALLOWED."""
        alice = baker.make(User, is_active=False)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        result = explain(alice, Shelter.perms.VIEW, org=self.org_a)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can(alice, Shelter.perms.VIEW, org=self.org_a))
        self.assertTrue(any("inactive" in note for note in result.notes))

    def test_active_user_has_no_inactive_note(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        result = explain(alice, Shelter.perms.VIEW, org=self.org_a)

        self.assertFalse(any("inactive" in note for note in result.notes))

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

    #: The ``clients.*`` permissions with a live legacy consumer today, each with
    #: the surface that still consults the legacy row.  The test asserts this set
    #: equals the ``clients.*`` entries of ``LEGACY_LIVE_PERMISSIONS``, so adding
    #: a carve-out permission without a surface here fails loudly.
    LEGACY_LIVE_CLIENT_SURFACES: tuple[tuple[str, str], ...] = (
        (ClientProfile.perms.CHANGE, "document uploads (filter_for_user)"),
        (ClientProfileImportRecord.perms.ADD, "the import mutations"),
        (ClientProfileImportRecord.perms.VIEW, "bulkClientProfileImportRecords"),
    )

    def test_client_document_and_import_permissions_stay_live_after_the_cut_over(self) -> None:
        """The carve-out: ``clients`` is inert per app, but docs and imports still read legacy.

        ``change_clientprofile`` is the parent-load permission the two document
        upload mutations check through ``filter_for_user``; the import pair gates
        the import mutations and the bulk lookup through the default ``HasPerm``
        checker (``user.has_perm``).  A legacy-only holder really does carry all
        three, so reporting them as inert would make both the explanation and
        the per-org report understate live authority.
        """
        clients_carve_outs = {perm for perm in LEGACY_LIVE_PERMISSIONS if perm.startswith("clients.")}
        self.assertEqual({perm for perm, _ in self.LEGACY_LIVE_CLIENT_SURFACES}, clients_carve_outs)

        for perm, surface in self.LEGACY_LIVE_CLIENT_SURFACES:
            with self.subTest(perm=perm, surface=surface):
                group = make_permission_group(organization=self.org_a, template_name="Caseworker")
                # set() rather than add(): one carve-out permission per iteration,
                # so a later case cannot pass on an earlier case's row.  VIEW rides
                # along as the control — a legacy row for a genuinely inert
                # permission — so the family assertion below fails on absence and
                # inertness alike.
                group.permissions.set(
                    [
                        Permission.objects.get(content_type__app_label="clients", codename=perm.split(".", 1)[1]),
                        Permission.objects.get(content_type__app_label="clients", codename="view_clientprofile"),
                    ]
                )
                holder = baker.make(User)
                self.org_a.add_user(holder)
                add_legacy_membership(holder, group=group)

                result = explain(holder, perm, org=self.org_a)

                self.assertFalse(result.cut_over, f"{perm} must not read as inert")
                self.assertFalse(result.verdict)  # grant model: no Grant, so no grant verdict
                legacy = _arm(result, "legacy rows")
                self.assertTrue(legacy.holds, surface)
                self.assertIn("document/import path only", legacy.detail)
                # The caveat names the surface, not "this domain has not cut over" —
                # the profile/family writes on these apps are grant-enforced.
                self.assertTrue(any("legacy consumer" in note for note in result.notes))
                self.assertFalse(any("has not cut over" in note for note in result.notes))

                reported = organization_permissions(holder)[self.org_a.pk]
                self.assertIn(perm, reported)
                # VIEW is carried by the same legacy row, but it is inert — the
                # report must not credit it.
                self.assertNotIn(ClientProfile.perms.VIEW, reported)

                # The family permission on the same app is genuinely inert for this
                # holder: the row exists, so the arm's refusal is inertness.
                family = explain(holder, ClientProfile.perms.VIEW, org=self.org_a)
                self.assertTrue(family.cut_over)
                legacy_family = _arm(family, "legacy rows")
                self.assertFalse(legacy_family.holds)
                self.assertIn("inert for this domain", legacy_family.detail)
                self.assertTrue(any("inert for this domain" in note for note in family.notes))

    def test_global_tier_carve_out_permission_folds_into_an_org_without_a_group(self) -> None:
        """A carve-out permission held globally is folded into every org entry.

        Neither live legacy path consults the organization: the import mutations
        go through the default ``HasPerm`` checker (``user.has_perm``), and the
        document uploads' ``filter_for_user`` filters on global/object permission
        with no org notion at all.  So a global-tier holder really can exercise
        both at an org where they hold no ``PermissionGroup``, and the fold must
        keep advertising that — filtering ``LEGACY_LIVE_PERMISSIONS`` out of it
        would under-report authority the backend honours.
        """
        profile = baker.make(ClientProfile, first_name="Fold")
        holder = baker.make(User)
        self.org_a.add_user(holder)
        holder.user_permissions.add(
            Permission.objects.get(content_type__app_label="clients", codename="change_clientprofile")
        )
        # Re-read so ``has_perm`` sees the new row rather than a warm perm cache.
        holder = User.objects.get(pk=holder.pk)

        # Both paths the carve-out exists for, exercised at an org with no group.
        self.assertTrue(holder.has_perm(ClientProfile.perms.CHANGE))
        self.assertEqual(
            list(
                filter_for_user(ClientProfile.objects.all(), holder, [ClientProfile.perms.CHANGE]).values_list(
                    "pk", flat=True
                )
            ),
            [profile.pk],
        )
        self.assertIn(ClientProfile.perms.CHANGE, organization_effective_permissions(holder)[self.org_a.pk])

    def test_legacy_only_holder_denied_in_object_mode(self) -> None:
        """The divergence that makes the caveat load-bearing.

        A notes holder carries real authority today, but the notes domain is not
        cut over, so ``can_obj`` — the grant model — denies.  The tool reports
        the grant model's answer and must say so, because here it is the
        opposite of what enforcement would decide.
        """
        group = make_permission_group(organization=self.org_a, template_name="Caseworker")
        group.permissions.add(Permission.objects.get(content_type__app_label="notes", codename="view_note"))
        holder = baker.make(User)
        self.org_a.add_user(holder)
        add_legacy_membership(holder, group=group)
        note: Any = baker.make("notes.Note", organization=self.org_a)

        result = explain(holder, "notes.view_note", obj=note)

        self.assertFalse(result.cut_over)
        self.assertFalse(result.verdict)
        self.assertEqual(result.verdict, can_obj(holder, "notes.view_note", note))
        self.assertTrue(any("has not cut over" in note_ for note_ in result.notes))
        self.assertTrue(_arm(result, "legacy rows").holds)

    # ── notes ─────────────────────────────────────────────────────────────

    def test_other_orgs_note_names_the_reference_org(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_b)

        result = explain(alice, Shelter.perms.VIEW, org=self.org_a)

        self.assertEqual(result.verdict, can(alice, Shelter.perms.VIEW, org=self.org_a))
        self.assertTrue(any("1 other org(s): Explain Org B" in note for note in result.notes))

    def test_other_orgs_note_omitted_without_a_reference_org(self) -> None:
        """In anywhere/object mode there is no "this org" for others to be other than."""
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_b)

        anywhere = explain(alice, Shelter.perms.VIEW)
        on_object = explain(alice, Shelter.perms.VIEW, obj=self.shelter_a)

        self.assertTrue(anywhere.verdict)
        self.assertEqual(anywhere.verdict, can_anywhere(alice, Shelter.perms.VIEW))
        self.assertFalse(any("other org(s)" in note for note in anywhere.notes))
        self.assertTrue(on_object.verdict)
        self.assertFalse(any("other org(s)" in note for note in on_object.notes))

    def test_cut_over_domain_has_no_posture_banner(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        result = explain(alice, Shelter.perms.VIEW, org=self.org_a)

        self.assertTrue(result.cut_over)
        self.assertFalse(any("has not cut over" in note for note in result.notes))

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

    def test_delegation_reported_in_anywhere_mode(self) -> None:
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_a)
        bob = baker.make(User)
        self.org_b.add_user(bob)
        grant_create(user=bob, role=self.shelter_role, scope_org=self.org_b)

        result = explain(bob, Shelter.perms.VIEW)

        self.assertTrue(result.verdict)
        self.assertEqual(result.verdict, can_anywhere(bob, Shelter.perms.VIEW))
        self.assertTrue(_arm(result, "delegated").holds)
        self.assertIn("Explain Org A", _arm(result, "delegated").detail)

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

    def test_rejects_unknown_permission(self) -> None:
        """A typo must not read as a denial — it is a question that has no answer."""
        user = baker.make(User)

        with self.assertRaises(ValueError) as ctx:
            explain(user, "shelters.view_shelterx", org=self.org_a)

        message = str(ctx.exception)
        self.assertIn("unknown permission", message)
        self.assertIn("shelters.view_shelterx", message)
        self.assertIn("shelters.view_shelter", message)  # the close match it suggests

    def test_non_canonical_permission_spelling_is_rejected(self) -> None:
        """Validation runs first, so a differently-cased carve-out perm never reaches an arm.

        ``_split_perm`` rejects anything outside the modeled registry, so the
        raw-string ``LEGACY_LIVE_PERMISSIONS`` membership tests in ``_legacy_arm``
        and ``_notes`` cannot be bypassed with a re-typed spelling: the call
        fails as an unknown permission rather than misreporting the surface.
        """
        user = baker.make(User)

        with self.assertRaises(ValueError) as ctx:
            explain(user, "clients.CHANGE_CLIENTPROFILE", org=self.org_a)

        self.assertIn("unknown permission", str(ctx.exception))

    def test_unknown_permission_carries_no_suggestion_when_nothing_is_close(self) -> None:
        user = baker.make(User)

        with self.assertRaises(ValueError) as ctx:
            explain(user, "shelters.zzzzzzzzzz", org=self.org_a)

        self.assertIn("unknown permission", str(ctx.exception))
        self.assertNotIn("Did you mean", str(ctx.exception))

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


class ExplainPermissionCommandTestCase(TestCase):
    """The command surface: argument resolution and the refusals a caller script hits."""

    def setUp(self) -> None:
        sync_roles()
        self.org = organization_recipe.make(name="Command Org")
        self.shelter = shelter_recipe.make(organization=self.org)
        # baker's generated handle is already unique per call — reuse it verbatim
        # rather than deriving one, so these tests survive a reused test database.
        self.user = baker.make(User)
        self.username = self.user.username
        self.email = f"{self.username}@example.org"
        self.user.email = self.email
        self.user.save(update_fields=["email"])
        self.granted = baker.make(User)
        grant_create(user=self.granted, role=Role.objects.get(name=SHELTER_OPERATOR_ROLE.name), scope_org=self.org)

    def _run(self, *args: str) -> str:
        """Run the command and return its stdout.

        A DENIED verdict raises ``SystemExit(1)`` — that is the documented
        contract, so these tests absorb it and assert on the output.
        """
        out = StringIO()
        with contextlib.suppress(SystemExit):
            call_command("explain_permission", *args, stdout=out)
        return out.getvalue()

    def test_resolves_user_by_username(self) -> None:
        output = self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--org", str(self.org.pk))

        self.assertIn(f"pk={self.user.pk}", output)

    def test_resolves_user_by_email(self) -> None:
        output = self._run("--user", self.email, "--perm", Shelter.perms.VIEW, "--org", str(self.org.pk))

        self.assertIn(f"pk={self.user.pk}", output)

    def test_rejects_ambiguous_username(self) -> None:
        """One user has it as a username, another as an email — the ref matches both."""
        handle = "cmd-ambiguous"
        baker.make(User, username=handle, email="first@example.org")
        baker.make(User, email=handle)  # unique username, but the email is the handle

        with self.assertRaises(CommandError) as ctx:
            self._run("--user", handle, "--perm", Shelter.perms.VIEW, "--org", str(self.org.pk))

        self.assertIn("more than one user", str(ctx.exception))

    def test_rejects_unknown_user(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run("--user", "nobody@example.org", "--perm", Shelter.perms.VIEW, "--org", str(self.org.pk))

        self.assertIn("no user matches", str(ctx.exception))

    def test_resolves_org_by_slug(self) -> None:
        output = self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--org", self.org.slug)

        self.assertIn(f'org         {self.org.pk} "Command Org"', output)

    def test_rejects_unknown_org(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--org", "no-such-slug")

        self.assertIn("no organization matches", str(ctx.exception))

    def test_rejects_malformed_object_ref(self) -> None:
        for ref in ("shelters.shelter", "shelters:12", "shelters.shelter:abc"):
            with self.subTest(ref=ref), self.assertRaises(CommandError) as ctx:
                self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--object", ref)
            self.assertIn("app_label.model:pk", str(ctx.exception))

    def test_rejects_unknown_model(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--object", "nope.nope:1")

        self.assertIn("no installed model named", str(ctx.exception))

    def test_rejects_missing_object_row(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run("--user", self.username, "--perm", Shelter.perms.VIEW, "--object", "shelters.shelter:999999")

        self.assertIn("no shelters.shelter with pk 999999", str(ctx.exception))

    def test_rejects_both_a_reference_org_and_object(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run(
                "--user",
                self.username,
                "--perm",
                Shelter.perms.VIEW,
                "--org",
                str(self.org.pk),
                "--object",
                f"shelters.shelter:{self.shelter.pk}",
            )

        self.assertIn("at most one of --org / --object", str(ctx.exception))

    def test_anywhere_mode_needs_no_scope(self) -> None:
        output = self._run("--user", str(self.granted.pk), "--perm", Shelter.perms.VIEW)

        self.assertIn("verdict     ALLOWED  (anywhere predicate)", output)
        self.assertNotIn("org         ", output)

    def test_unknown_permission_is_a_command_error(self) -> None:
        with self.assertRaises(CommandError) as ctx:
            self._run("--user", self.username, "--perm", "shelters.view_shelterx", "--org", str(self.org.pk))

        self.assertIn("unknown permission", str(ctx.exception))

    def test_legacy_domain_run_carries_the_posture_banner(self) -> None:
        """The exit code follows the grant model, so the divergence has to be visible."""
        output = self._run("--user", self.username, "--perm", "notes.view_note", "--org", str(self.org.pk))

        self.assertIn("legacy domain — NOT cut over yet", output)
        self.assertIn("^ grant-model answer", output)
        self.assertIn("has not cut over", output)

    def test_cut_over_run_has_no_posture_banner(self) -> None:
        output = self._run("--user", str(self.granted.pk), "--perm", Shelter.perms.VIEW, "--org", str(self.org.pk))

        self.assertIn("grant-only domain", output)
        self.assertNotIn("^ grant-model answer", output)
