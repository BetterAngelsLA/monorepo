"""Tests for the read-side authorization selectors (ADR 0001 §2.4, §2.9)."""

from accounts.models import Role, User
from accounts.services import grant_create, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.selectors import ALL, can, can_anywhere, can_obj, scopes, visible
from django.test import TestCase
from model_bakery import baker
from notes.models import Note
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE
from shelters.models import Shelter
from shelters.tests.baker_recipes import shelter_recipe


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
        """A model not yet declared OrgScoped is reachable by no one through visible()."""
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

    def test_can_obj_is_the_row_filter_on_one_row(self) -> None:
        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)

        self.assertTrue(can_obj(alice, Shelter.perms.VIEW, self.shelter_a))
        self.assertFalse(can_obj(alice, Shelter.perms.VIEW, self.shelter_b))

    def test_can_anywhere_holds_for_platform_shared_creates(self) -> None:
        from clients.models import ClientProfile

        alice = baker.make(User)
        grant_create(user=alice, role=self.shelter_role, scope_org=self.org_a)
        stranger = baker.make(User)

        self.assertTrue(can_anywhere(alice, ClientProfile.perms.VIEW))
        self.assertFalse(can_anywhere(stranger, ClientProfile.perms.VIEW))
