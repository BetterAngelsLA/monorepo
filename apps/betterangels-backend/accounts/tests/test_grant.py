"""Tests for the ``Role`` and ``Grant`` models (ADR 0001 §2.2).

Pins the DB-level invariants: exactly one principal, exactly one scope, no
self-delegation, and per-principal uniqueness that does not collide between
org-scoped and object-scoped rows.
"""

from accounts.models import Grant, Role, User
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from model_bakery import baker
from shelters.models import Shelter

from .baker_recipes import organization_recipe


class RoleTestCase(TestCase):
    def test_role_is_a_group_subclass(self) -> None:
        role = Role.objects.create(name="Test Shelter Role")

        self.assertIsInstance(role, Group)
        self.assertFalse(role.is_global)
        self.assertEqual(str(role), "Test Shelter Role")

    def test_a_global_role_carries_a_flag(self) -> None:
        Role.objects.create(name="Test Global Role", is_global=True)

        self.assertTrue(Role.objects.get(name="Test Global Role").is_global)

    def test_a_global_role_in_user_groups_reads_via_django(self) -> None:
        """The global tier is ``user.groups`` on a global Role (ADR 0001 §2.1)."""
        role = Role.objects.create(name="Test GSO", is_global=True)
        user = baker.make(User)
        user.groups.add(role)

        self.assertTrue(user.groups.filter(role__is_global=True).exists())
        self.assertFalse(user.groups.filter(role__is_global=False).exists())


class GrantTestCase(TestCase):
    def setUp(self) -> None:
        self.org_a = organization_recipe.make(name="Grant Org A")
        self.org_b = organization_recipe.make(name="Grant Org B")
        self.user = baker.make(User)
        self.role = Role.objects.create(name="Test Shelter Role")

    def test_user_grant_requires_exactly_one_principal(self) -> None:
        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(role=self.role, scope_org=self.org_a)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(
                principal_user=self.user,
                principal_org=self.org_b,
                role=self.role,
                scope_org=self.org_a,
            )

    def test_grant_requires_exactly_one_scope(self) -> None:
        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(principal_user=self.user, role=self.role)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(
                principal_user=self.user,
                role=self.role,
                scope_org=self.org_a,
                scope_object_type=ContentType.objects.get_for_model(Shelter),
                scope_object_id=1,
            )

    def test_an_organization_cannot_delegate_a_role_to_itself(self) -> None:
        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(principal_org=self.org_b, role=self.role, scope_org=self.org_b)

    def test_user_grants_are_unique_per_role_and_scope(self) -> None:
        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_a)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_a)

    def test_a_user_may_hold_the_same_role_at_multiple_scopes(self) -> None:
        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_a)
        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_b)

        self.assertEqual(Grant.objects.filter(principal_user=self.user).count(), 2)

    def test_org_grants_are_unique_per_role_and_scope(self) -> None:
        Grant.objects.create(principal_org=self.org_b, role=self.role, scope_org=self.org_a)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Grant.objects.create(principal_org=self.org_b, role=self.role, scope_org=self.org_a)

    def test_user_and_org_principal_rows_do_not_collide(self) -> None:
        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_a)
        Grant.objects.create(principal_org=self.org_b, role=self.role, scope_org=self.org_a)

        self.assertEqual(Grant.objects.filter(role=self.role, scope_org=self.org_a).count(), 2)

    def test_two_users_may_hold_the_same_role_at_the_same_scope(self) -> None:
        """User grants never collide through the org-principal uniqueness index."""
        other_user = baker.make(User)

        Grant.objects.create(principal_user=self.user, role=self.role, scope_org=self.org_a)
        Grant.objects.create(principal_user=other_user, role=self.role, scope_org=self.org_a)

        self.assertEqual(
            Grant.objects.filter(role=self.role, scope_org=self.org_a).count(),
            2,
        )

    def test_an_object_scope_is_allowed_at_the_database_level(self) -> None:
        """Object grants are schema-live in PR 1; E003 forbids writing them, not the DB."""
        grant = Grant.objects.create(
            principal_user=self.user,
            role=self.role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        self.assertIsNone(grant.scope_org)
        self.assertEqual(grant.scope_object_id, 1)

    def test_an_org_principal_object_grant_is_allowed(self) -> None:
        """An organization can be granted an object (share-with-org, once wired)."""
        grant = Grant.objects.create(
            principal_org=self.org_b,
            role=self.role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        self.assertIsNotNone(grant.principal_org)
        self.assertIsNone(grant.scope_org)


class GrantCleanTestCase(TestCase):
    """Write-time rules in :meth:`Grant.clean` — shared by every ``full_clean`` writer.

    The DB-level tests above pin what the *schema* permits (rows written through
    ``objects.create``); ``full_clean`` writers — the grant services and the admin
    forms — must refuse the same rows up front (E002/E003/E006), not write rows
    that only a deploy-time check would flag.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(name="Clean Org")
        self.user = baker.make(User)
        self.role = Role.objects.create(name="Test Clean Role")

    def test_clean_refuses_an_object_grant_outside_the_whitelist(self) -> None:
        grant = Grant(
            principal_user=self.user,
            role=self.role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        with self.assertRaises(ValidationError):
            grant.full_clean()

    def test_clean_refuses_an_org_principal_object_grant(self) -> None:
        grant = Grant(
            principal_org=self.org,
            role=self.role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        with self.assertRaises(ValidationError):
            grant.full_clean()

    def test_clean_allows_a_user_principal_org_scope_grant(self) -> None:
        grant = Grant(principal_user=self.user, role=self.role, scope_org=self.org)

        grant.full_clean()  # does not raise
