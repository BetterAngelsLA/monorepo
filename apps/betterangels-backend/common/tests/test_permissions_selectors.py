"""Tests for the read-side authorization selectors (ADR 0001 §2.4, §2.10)."""

from typing import Any

from accounts.models import Grant, Role, User
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.test import TestCase
from model_bakery import baker
from notes.models import Note
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE
from shelters.models import ContactInfo, Shelter
from shelters.tests.baker_recipes import shelter_recipe

from common.models import ACCESS_GLOBAL, WRITE_GLOBAL
from common.permissions.selectors import (
    ALL,
    can,
    can_anywhere,
    can_globally,
    can_model,
    can_obj,
    scopes,
    visible,
    writable,
)


class GrantSelectorsTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.org_a = organization_recipe.make(name="Selectors Org A")
        self.org_b = organization_recipe.make(name="Selectors Org B")
        self.shelter_a = shelter_recipe.make(organization=self.org_a)
        self.shelter_b = shelter_recipe.make(organization=self.org_b)
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_org_scoped_user_sees_only_their_org(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        qs = visible(Shelter.objects.all(), alice, Shelter.perms.VIEW)

        self.assertIn(self.shelter_a.pk, list(qs.values_list("pk", flat=True)))
        self.assertNotIn(self.shelter_b.pk, list(qs.values_list("pk", flat=True)))

    def test_global_role_holder_sees_everything(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        qs = visible(Shelter.objects.all(), gso, Shelter.perms.VIEW)

        self.assertEqual(set(qs.values_list("pk", flat=True)), {self.shelter_a.pk, self.shelter_b.pk})

    def test_narrower_global_role_composes_per_perm(self) -> None:
        """A global Role carrying only VIEW sees everything for VIEW, nothing for CHANGE.

        Global roles compose per-permission (ADR 0001 §2.2) — authority is the
        union of the held perms, so a read-only global role is never amplified to
        the write perms it does not carry.
        """
        viewer = baker.make(User)
        role = Role.objects.create(name="Global Shelter Viewer", is_global=True)
        view_perm, _ = Permission.objects.get_or_create(
            content_type=ContentType.objects.get_for_model(Shelter),
            codename=Shelter.perms.VIEW.split(".")[1],
            defaults={"name": "Can view shelter"},
        )
        role.permissions.add(view_perm)
        viewer.groups.add(role)

        self.assertEqual(
            set(visible(Shelter.objects.all(), viewer, Shelter.perms.VIEW).values_list("pk", flat=True)),
            {self.shelter_a.pk, self.shelter_b.pk},
        )
        self.assertFalse(visible(Shelter.objects.all(), viewer, Shelter.perms.CHANGE).exists())

    def test_superuser_sees_everything(self) -> None:
        admin = baker.make(User, is_superuser=True)

        qs = visible(Shelter.objects.all(), admin, Shelter.perms.VIEW)

        self.assertEqual(set(qs.values_list("pk", flat=True)), {self.shelter_a.pk, self.shelter_b.pk})

    def test_user_without_any_grant_sees_nothing(self) -> None:
        stranger = baker.make(User)

        self.assertFalse(visible(Shelter.objects.all(), stranger, Shelter.perms.VIEW).exists())

    def test_in_org_confines_only_finite_scopes(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        # Scoped user is confined by in_org to that org.
        self.assertFalse(visible(Shelter.objects.all(), alice, Shelter.perms.VIEW, in_org=str(self.org_b.pk)).exists())
        # A global holder is never confined by a stale header (ADR 0001 §2.4).
        self.assertEqual(
            set(
                visible(Shelter.objects.all(), gso, Shelter.perms.VIEW, in_org=str(self.org_a.pk)).values_list(
                    "pk", flat=True
                )
            ),
            {self.shelter_a.pk, self.shelter_b.pk},
        )

    def test_platform_shared_model_is_visible_to_any_holder(self) -> None:
        """ClientProfile (org_via=None) is platform-shared: any holder sees all."""
        from clients.models import ClientProfile

        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)  # carries view_clientprofile
        baker.make(ClientProfile)
        baker.make(ClientProfile)

        self.assertEqual(visible(ClientProfile.objects.all(), alice, ClientProfile.perms.VIEW).count(), 2)

    def test_unscoped_model_fails_closed(self) -> None:
        """A model not yet declared ScopedResource is reachable by no one through visible()."""
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        self.assertFalse(visible(Note.objects.all(), gso, Note.perms.VIEW).exists())

    def test_scopes_is_memoized_per_request(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        s = scopes(alice, Shelter.perms.VIEW)

        self.assertIsNot(s, ALL)
        self.assertIn("_scope_cache", alice.__dict__)
        self.assertIs(scopes(alice, Shelter.perms.VIEW), s)

    def test_can_checks_authority_in_an_org(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        self.assertTrue(can(alice, Shelter.perms.VIEW, org=self.org_a))
        self.assertFalse(can(alice, Shelter.perms.VIEW, org=self.org_b))
        self.assertTrue(can(gso, Shelter.perms.VIEW, org=self.org_b))

    def test_delegated_authority_answers_with_only_the_target(self) -> None:
        """Org A delegates to C: can(org=C) is true with only the target passed.

        The authority *sources* — membership at the acting org, the direct grant
        there, the delegation row itself — resolve inside ``scopes()``; callers
        never name the topology (ADR 0001 §2.4).  And delegation never amplifies:
        a grant at the principal org without membership does not inherit.
        """
        org_c = organization_recipe.make(name="Selectors Org C")
        shelter_c = shelter_recipe.make(organization=org_c)
        grant_delegate(principal_org=self.org_a, role=self.shelter_role, scope_org=org_c)

        actor = baker.make(User)
        self.org_a.add_user(actor)
        grant_create(user=actor, role=self.shelter_role, scope_org=self.org_a)

        self.assertTrue(can(actor, Shelter.perms.VIEW, org=org_c))
        self.assertIn(
            shelter_c.pk,
            set(visible(Shelter.objects.all(), actor, Shelter.perms.VIEW).values_list("pk", flat=True)),
        )

        outsider = baker.make(User)  # grant at A, not a member of A
        grant_create(user=outsider, role=self.shelter_role, scope_org=self.org_a)

        self.assertFalse(can(outsider, Shelter.perms.VIEW, org=org_c))

    def test_can_obj_is_the_row_filter_on_one_row(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        self.assertTrue(can_obj(alice, Shelter.perms.VIEW, self.shelter_a))
        self.assertFalse(can_obj(alice, Shelter.perms.VIEW, self.shelter_b))

    def test_writable_is_can_obj_as_a_queryset(self) -> None:
        """writable() admits exactly the rows can_obj() admits (one predicate).

        Mutation gates fetch through writable() so the fetch is the gate;
        can_obj() delegates to it, so the fetch-of-one and the check-of-one
        can never disagree.
        """
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        admitted = set(writable(Shelter.objects.all(), alice, Shelter.perms.VIEW).values_list("pk", flat=True))

        self.assertEqual(admitted, {self.shelter_a.pk})
        for shelter in (self.shelter_a, self.shelter_b):
            self.assertEqual(can_obj(alice, Shelter.perms.VIEW, shelter), shelter.pk in admitted)

    def test_writable_shared_tier_is_all_or_none(self) -> None:
        """WRITE_SHARED: every row fetchable iff the perm is held somewhere."""
        from clients.models import ClientProfile

        editor = baker.make(User)
        client_role = Role.objects.create(name="Writable Shared Editor", is_global=False)
        perm = Permission.objects.get(
            codename=ClientProfile.perms.CHANGE.split(".")[1], content_type__app_label="clients"
        )
        client_role.permissions.add(perm)
        grant_create(user=editor, role=client_role, scope_org=self.org_a)
        stranger = baker.make(User)

        self.assertEqual(
            writable(ClientProfile.objects.all(), editor, ClientProfile.perms.CHANGE).count(),
            ClientProfile.objects.count(),
        )
        self.assertFalse(writable(ClientProfile.objects.all(), stranger, ClientProfile.perms.CHANGE).exists())

    def test_can_obj_shared_tier_is_any_holder_anywhere(self) -> None:
        """ClientProfile declares WRITE_SHARED (RFC 0002 #1): can_obj == can_anywhere."""
        from clients.models import ClientProfile

        client = baker.make(ClientProfile)
        editor = baker.make(User)
        client_role = Role.objects.create(name="Client Editor", is_global=False)
        perm = Permission.objects.get(
            codename=ClientProfile.perms.CHANGE.split(".")[1], content_type__app_label="clients"
        )
        client_role.permissions.add(perm)
        grant_create(user=editor, role=client_role, scope_org=self.org_a)
        stranger = baker.make(User)
        admin = baker.make(User, is_superuser=True)

        self.assertTrue(can_obj(editor, ClientProfile.perms.CHANGE, client))
        self.assertFalse(can_obj(stranger, ClientProfile.perms.CHANGE, client))
        self.assertTrue(can_obj(admin, ClientProfile.perms.CHANGE, client))

    def test_shared_write_paths_agree_with_the_read_rule(self) -> None:
        """Pin the equivalence the declarative checkers rely on (consolidation guard).

        For a WRITE_SHARED platform-shared model, ``writable`` and ``visible``
        must admit the same rows for every principal — the ``can_anywhere``
        checkers and the ``visible_rows_for_holder`` list hooks are only correct
        while this equivalence holds (RFC 0002 SHARED class).
        """
        from clients.models import ClientProfile

        client = baker.make(ClientProfile)
        editor = baker.make(User)
        client_role = Role.objects.create(name="Equivalence Editor", is_global=False)
        perm = Permission.objects.get(
            codename=ClientProfile.perms.CHANGE.split(".")[1], content_type__app_label="clients"
        )
        client_role.permissions.add(perm)
        grant_create(user=editor, role=client_role, scope_org=self.org_a)

        stranger = baker.make(User)
        admin = baker.make(User, is_superuser=True)

        qs = ClientProfile.objects.all()
        for user in (editor, stranger, admin):
            self.assertEqual(
                set(writable(qs, user, ClientProfile.perms.CHANGE).values_list("pk", flat=True)),
                set(visible(qs, user, ClientProfile.perms.CHANGE).values_list("pk", flat=True)),
                f"writable()/visible() diverged for {user}",
            )
            self.assertEqual(
                can_obj(user, ClientProfile.perms.CHANGE, client),
                can_anywhere(user, ClientProfile.perms.CHANGE),
                f"can_obj()/can_anywhere() diverged for {user}",
            )

    def test_writable_fails_closed_for_undeclared_platform_shared(self) -> None:
        """A platform-shared ScopedResource model with no declared write class: only the global tier.

        RFC 0002 §Precondition — the read rule never feeds an undeclared write
        (finding C1): a finite org-scoped holder gets the empty queryset (no
        rows, no row-table access — the model is hypothetical); the global
        tier (``scopes`` is ALL) gets the model's rows.  Rows without identity
        (unsaved) are never writable — creates have no row and use ``can``.
        """
        from common.models import ScopedResource

        class UndeclaredShared(ScopedResource):
            org_via = None
            objects: Any = models.Manager()

            class Meta:
                app_label = "common"
                managed = False

        scoped = baker.make(User)
        grant_create(user=scoped, role=self.shelter_role, scope_org=self.org_a)
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        denied = writable(UndeclaredShared.objects.all(), scoped, Shelter.perms.VIEW)
        admitted = writable(UndeclaredShared.objects.all(), gso, Shelter.perms.VIEW)

        self.assertTrue(denied.query.is_empty())
        self.assertFalse(admitted.query.is_empty())
        self.assertFalse(can_obj(scoped, Shelter.perms.VIEW, UndeclaredShared()))

    def test_can_anywhere_holds_for_platform_shared_creates(self) -> None:
        from clients.models import ClientProfile

        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        stranger = baker.make(User)

        self.assertTrue(can_anywhere(alice, ClientProfile.perms.VIEW))
        self.assertFalse(can_anywhere(stranger, ClientProfile.perms.VIEW))


class AccessClassTestCase(TestCase):
    """A model's declared ``access`` slot outranks org reach (ADR 0004).

    ``ContactInfo`` declares the GLOBAL classes: the global tier sees every
    row and a scoped holder of the very same permission sees none — for the
    row filter (:func:`visible`), the single-row check (:func:`can_obj`), and
    the rowless gate (:func:`can_model`) alike.
    """

    def setUp(self) -> None:
        sync_roles()
        self.org = organization_recipe.make(name="Access Class Org")
        self.shelter = shelter_recipe.make(organization=self.org)
        self.contact = baker.make(ContactInfo, shelter=self.shelter, contact_number="+12135551234")
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def _scoped_contact_reader(self) -> User:
        """A scoped Grant holder that DOES carry the ContactInfo perm."""
        alice = baker.make(User)
        role = Role.objects.create(name="Scoped Contact Reader")
        perm, _ = Permission.objects.get_or_create(
            content_type=ContentType.objects.get_for_model(ContactInfo),
            codename=ContactInfo.perms.VIEW.split(".")[1],
            defaults={"name": "Can view contact info"},
        )
        role.permissions.add(perm)
        # Created directly, not via ``grant_create``: admittance now refuses
        # this binding (Grant.clean / permissions.E008), so a hand-made row is
        # exactly the drift the evaluation layer must still refuse.
        Grant.objects.create(principal_user=alice, role=role, scope_org=self.org)
        return alice

    def test_declaration_is_on_the_model(self) -> None:
        self.assertEqual(ContactInfo.access.read, ACCESS_GLOBAL)
        self.assertEqual(ContactInfo.access.write, WRITE_GLOBAL)
        self.assertIsNone(Shelter.access.read)
        self.assertIsNone(Shelter.access.write)

    def test_global_class_visible_is_global_tier_only(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)
        scoped = self._scoped_contact_reader()

        self.assertTrue(visible(ContactInfo.objects.all(), gso, ContactInfo.perms.VIEW).exists())
        self.assertFalse(visible(ContactInfo.objects.all(), scoped, ContactInfo.perms.VIEW).exists())

    def test_global_class_can_obj_is_global_tier_only(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)
        scoped = self._scoped_contact_reader()

        self.assertTrue(can_obj(gso, ContactInfo.perms.VIEW, self.contact))
        self.assertFalse(can_obj(scoped, ContactInfo.perms.VIEW, self.contact))

    def test_can_model_reads_the_declaration(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)
        scoped = self._scoped_contact_reader()
        stranger = baker.make(User)
        bob = baker.make(User)
        grant_create(user=bob, role=self.shelter_role, scope_org=self.org)

        self.assertTrue(can_model(gso, ContactInfo.perms.CHANGE, ContactInfo))
        # The scoped reader HOLDS view in its scope — the class still refuses it.
        self.assertFalse(can_model(scoped, ContactInfo.perms.VIEW, ContactInfo))
        self.assertFalse(can_model(stranger, ContactInfo.perms.VIEW, ContactInfo))
        # Non-GLOBAL models keep today's can_anywhere semantics.
        self.assertTrue(can_model(bob, Shelter.perms.VIEW, Shelter))


class CanGloballyTestCase(TestCase):
    """can_globally is the global arm of scopes — Grant reach never satisfies it."""

    def setUp(self) -> None:
        sync_roles()
        self.org = organization_recipe.make(name="Can Globally Org")
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_global_role_holder_can_act_globally(self) -> None:
        gso = baker.make(User)
        role_assign(user=gso, role=self.gso_role)

        self.assertTrue(can_globally(gso, ContactInfo.perms.CHANGE))

    def test_scoped_grant_holder_cannot_act_globally(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org)

        # The near-miss pinned: ``can_anywhere`` admits this scoped holder, so
        # it can never substitute for a global-only gate.
        self.assertTrue(can_anywhere(alice, Shelter.perms.VIEW))
        self.assertFalse(can_globally(alice, Shelter.perms.VIEW))

    def test_user_without_authority_cannot_act_globally(self) -> None:
        stranger = baker.make(User)

        self.assertFalse(can_globally(stranger, ContactInfo.perms.VIEW))

    def test_superuser_can_act_globally(self) -> None:
        admin = baker.make(User, is_superuser=True)

        self.assertTrue(can_globally(admin, ContactInfo.perms.VIEW))
