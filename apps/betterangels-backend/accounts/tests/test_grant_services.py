"""Tests for the grant write services (ADR 0001 §2.10)."""

from accounts.models import Grant, Role, User
from accounts.services import grant_create, grant_delete, role_assign, role_remove, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE


class GrantServiceTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.org = organization_recipe.make(name="Grant Service Org")
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)
        self.user = baker.make(User)

    def test_grant_create_grants_a_scoped_role(self) -> None:
        grant = grant_create(user=self.user, role=self.shelter_role, scope_org=self.org)

        self.assertEqual(grant.principal_user, self.user)
        self.assertEqual(grant.role, self.shelter_role)
        self.assertEqual(grant.scope_org, self.org)
        self.assertIsNone(grant.principal_org)
        self.assertIsNone(grant.scope_object_type)

    def test_grant_create_validates_before_saving(self) -> None:
        with self.assertRaises(ValidationError):
            grant_create(user=self.user, role=self.shelter_role, scope_org=None)  # type: ignore[arg-type]

        self.assertFalse(Grant.objects.filter(principal_user=self.user).exists())

    def test_grant_delete_revokes(self) -> None:
        grant = grant_create(user=self.user, role=self.shelter_role, scope_org=self.org)

        grant_delete(grant=grant)

        self.assertFalse(Grant.objects.filter(pk=grant.pk).exists())

    def test_role_assign_adds_a_global_role(self) -> None:
        role_assign(user=self.user, role=self.gso_role)

        self.assertTrue(self.user.groups.filter(role__is_global=True).exists())

    def test_role_assign_refuses_a_scoped_role(self) -> None:
        with self.assertRaises(ValidationError):
            role_assign(user=self.user, role=self.shelter_role)

        self.assertFalse(self.user.groups.exists())

    def test_role_remove_removes_a_global_role(self) -> None:
        role_assign(user=self.user, role=self.gso_role)

        role_remove(user=self.user, role=self.gso_role)

        self.assertFalse(self.user.groups.filter(role__is_global=True).exists())
