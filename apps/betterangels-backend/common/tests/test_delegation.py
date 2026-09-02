"""Org→org delegation — the inherited arm of ``scopes`` (ADR 0001 §2.4).

Org B delegates role R to org C via ``Grant(principal_org=B, role=R, scope_org=C)``.
B's *acting* people — members of B who also hold a direct Grant at B — inherit R
at C.  Membership alone or a grant alone is NOT enough (no amplification); the
delegation is one hop only (no transitivity).
"""

from accounts.models import Role, User
from accounts.services import grant_create, grant_delegate, role_assign, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.selectors import ALL, can, scopes, visible
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from shelters.groups import SHELTER_OPERATOR_ROLE
from shelters.models import Shelter
from shelters.tests.baker_recipes import shelter_recipe


class DelegationTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.org_b = organization_recipe.make(name="Delegator B")
        self.org_c = organization_recipe.make(name="Delegatee C")
        self.org_d = organization_recipe.make(name="Delegatee D")
        self.shelter_c = shelter_recipe.make(organization=self.org_c)
        self.shelter_d = shelter_recipe.make(organization=self.org_d)
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        # A role carrying only VIEW, for permission-scoping assertions.
        self.view_role, _ = Role.objects.get_or_create(name="Test Delegation Viewer", is_global=False)
        app_label, codename = Shelter.perms.VIEW.split(".")
        self.view_role.permissions.add(Permission.objects.get(codename=codename, content_type__app_label=app_label))

    def _acting_member(self, org: object) -> User:
        """A user who is a member of *org* and holds a direct Grant there."""
        user = baker.make(User)
        org.add_user(user)  # type: ignore[attr-defined]
        grant_create(user=user, role=self.shelter_role, scope_org=org)  # type: ignore[arg-type]
        return user

    def _scoped_orgs(self, user: User, perm: str) -> set[int]:
        """Org ids from ``scopes`` — the union yields ``{"scope_org": id}`` rows."""
        return {row["scope_org"] for row in scopes(user, perm)}

    def _visible_pks(self, user: User, perm: str) -> list[int]:
        return list(visible(Shelter.objects.all(), user, perm).values_list("pk", flat=True))

    def test_member_with_grant_inherits_the_delegated_role(self) -> None:
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_c)
        bob = self._acting_member(self.org_b)

        self.assertEqual(self._scoped_orgs(bob, Shelter.perms.VIEW), {self.org_b.pk, self.org_c.pk})
        self.assertIn(self.shelter_c.pk, self._visible_pks(bob, Shelter.perms.VIEW))
        self.assertTrue(can(bob, Shelter.perms.VIEW, org=self.org_c))

    def test_membership_alone_does_not_inherit(self) -> None:
        """No amplification: membership at B without a direct Grant ⇒ no inheritance."""
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_c)
        charlie = baker.make(User)
        self.org_b.add_user(charlie)

        self.assertEqual(self._scoped_orgs(charlie, Shelter.perms.VIEW), set())
        self.assertEqual(self._visible_pks(charlie, Shelter.perms.VIEW), [])

    def test_grant_alone_does_not_inherit(self) -> None:
        """No amplification: a consultant granted a role at B without membership inherits nothing."""
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_c)
        dave = baker.make(User)
        grant_create(user=dave, role=self.shelter_role, scope_org=self.org_b)

        self.assertEqual(self._scoped_orgs(dave, Shelter.perms.VIEW), {self.org_b.pk})
        self.assertNotIn(self.shelter_c.pk, self._visible_pks(dave, Shelter.perms.VIEW))

    def test_inheritance_is_limited_to_the_delegated_roles_permissions(self) -> None:
        grant_delegate(principal_org=self.org_b, role=self.view_role, scope_org=self.org_c)
        bob = self._acting_member(self.org_b)

        # VIEW is inherited at C...
        self.assertIn(self.shelter_c.pk, self._visible_pks(bob, Shelter.perms.VIEW))
        # ...but DELETE is not on the delegated role, so it is not inherited.
        self.assertFalse(can(bob, Shelter.perms.DELETE, org=self.org_c))

    def test_a_weak_grant_at_b_does_not_amplify_to_b_delegations_at_c(self) -> None:
        """Role-keyed inheritance: a member of B holding only a VIEW role at B
        does not inherit B's Shelter-Operator delegation at C beyond VIEW.

        Regression for the audit's delegation-amplification finding: "acts at B"
        used to key on *any* grant at B, so a member holding the weakest role at
        B inherited everything B had delegated at C — more authority at C than at
        B.  Inheritance now requires a grant at B whose role carries the
        permission being checked.
        """
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_c)
        eve = baker.make(User)
        self.org_b.add_user(eve)
        grant_create(user=eve, role=self.view_role, scope_org=self.org_b)

        # VIEW at C is inherited — eve's B role carries VIEW (role-keyed)...
        self.assertIn(self.shelter_c.pk, self._visible_pks(eve, Shelter.perms.VIEW))
        self.assertTrue(can(eve, Shelter.perms.VIEW, org=self.org_c))
        # ...but CHANGE/DELETE are not: eve holds no role at B that carries them,
        # so B's Shelter-Operator delegation does not amplify her.
        self.assertFalse(can(eve, Shelter.perms.CHANGE, org=self.org_c))
        self.assertFalse(can(eve, Shelter.perms.DELETE, org=self.org_c))

    def test_delegation_is_one_hop_only(self) -> None:
        """B→C and C→D: a user acting at B inherits C but not D (no transitivity)."""
        grant_delegate(principal_org=self.org_b, role=self.shelter_role, scope_org=self.org_c)
        grant_delegate(principal_org=self.org_c, role=self.shelter_role, scope_org=self.org_d)
        bob = self._acting_member(self.org_b)

        visible_pks = self._visible_pks(bob, Shelter.perms.VIEW)
        self.assertIn(self.shelter_c.pk, visible_pks)
        self.assertNotIn(self.shelter_d.pk, visible_pks)

    def test_global_tier_is_unaffected_by_delegation(self) -> None:
        """A global holder's scopes stay ALL; delegation never narrows it."""
        from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE

        gso = baker.make(User)
        role_assign(user=gso, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))

        self.assertIs(scopes(gso, Shelter.perms.VIEW), ALL)
        self.assertEqual(
            set(visible(Shelter.objects.all(), gso, Shelter.perms.VIEW).values_list("pk", flat=True)),
            {self.shelter_c.pk, self.shelter_d.pk},
        )
