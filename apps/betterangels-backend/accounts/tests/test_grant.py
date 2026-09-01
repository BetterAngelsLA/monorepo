"""Tests for the ``Role`` and ``Grant`` models (ADR 0001 §2.2).

Pins the DB-level invariants: exactly one principal, exactly one scope, no
self-delegation, and per-principal uniqueness that does not collide between
org-scoped and object-scoped rows.
"""

from accounts.models import Grant, Role, User
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.test import TestCase
from model_bakery import baker
from shelters.models import Shelter

from .baker_recipes import organization_recipe


class RoleTestCase(TestCase):
    def test_role_is_a_group_subclass(self) -> None:
        role = Role.objects.create(name="Shelter Operator")

        self.assertIsInstance(role, Group)
        self.assertFalse(role.is_global)
        self.assertEqual(str(role), "Shelter Operator")

    def test_a_global_role_carries_a_flag(self) -> None:
        Role.objects.create(name="Global Shelter Operator", is_global=True)

        self.assertTrue(Role.objects.get(name="Global Shelter Operator").is_global)

    def test_a_global_role_in_user_groups_reads_via_django(self) -> None:
        """The global tier is ``user.groups`` on a global Role (ADR 0001 §2.1)."""
        role = Role.objects.create(name="GSO", is_global=True)
        user = baker.make(User)
        user.groups.add(role)

        self.assertTrue(user.groups.filter(role__is_global=True).exists())
        self.assertFalse(user.groups.filter(role__is_global=False).exists())


class GrantTestCase(TestCase):
    def setUp(self) -> None:
        self.org_a = organization_recipe.make(name="Grant Org A")
        self.org_b = organization_recipe.make(name="Grant Org B")
        self.user = baker.make(User)
        self.role = Role.objects.create(name="Shelter Operator")

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
