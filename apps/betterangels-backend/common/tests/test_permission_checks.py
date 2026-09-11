"""Tests for the grant system checks (ADR 0001 §2.7, ``permissions.E001``–E007)."""

from accounts.models import Grant, Role, User
from accounts.tests.baker_recipes import organization_recipe
from common.models import Attachment, OrgScoped, WRITE_OBJECT, WRITE_SHARED
from common.permissions.checks import (
    _org_via_errors_for_model,
    check_grant_never_references_global_role,
    check_object_grant_principal_is_a_user,
    check_object_grant_targets_whitelisted_model,
    check_org_via_hops_are_single_valued,
    check_role_permissions_models_declare_org_scoping,
    check_scoped_role_never_in_user_groups,
    check_write_tier_declarations,
)
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import models as django_models
from django.test import TestCase
from model_bakery import baker
from shelters.models import Shelter


def _errors_with(errors: list, code: str) -> list:
    return [error for error in errors if error.id == code]


class GrantSystemChecksTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(name="Checks Org")
        self.user = baker.make(User)

    def test_e001_fires_when_a_scoped_role_sits_in_user_groups(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        self.user.groups.add(role)

        self.assertTrue(any(e.id == "permissions.E001" for e in check_scoped_role_never_in_user_groups(None)))

    def test_e001_is_quiet_for_global_roles_in_groups(self) -> None:
        role = Role.objects.create(name="GSO", is_global=True)
        self.user.groups.add(role)

        self.assertEqual(_errors_with(check_scoped_role_never_in_user_groups(None), "permissions.E001"), [])

    def test_e002_fires_when_a_grant_references_a_global_role(self) -> None:
        role = Role.objects.create(name="GSO", is_global=True)
        Grant.objects.create(principal_user=self.user, role=role, scope_org=self.org)

        self.assertTrue(any(e.id == "permissions.E002" for e in check_grant_never_references_global_role(None)))

    def test_e003_fires_for_any_object_grant_until_the_arm_is_wired(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        Grant.objects.create(
            principal_user=self.user,
            role=role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        self.assertTrue(any(e.id == "permissions.E003" for e in check_object_grant_targets_whitelisted_model(None)))

    def test_e006_fires_for_an_org_principal_object_grant(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        Grant.objects.create(
            principal_org=self.org,
            role=role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        self.assertTrue(any(e.id == "permissions.E006" for e in check_object_grant_principal_is_a_user(None)))

    def test_e006_is_quiet_for_a_user_principal_object_grant(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        Grant.objects.create(
            principal_user=self.user,
            role=role,
            scope_object_type=ContentType.objects.get_for_model(Shelter),
            scope_object_id=1,
        )

        self.assertEqual(_errors_with(check_object_grant_principal_is_a_user(None), "permissions.E006"), [])

    def test_e006_is_quiet_for_an_org_principal_org_scope_grant(self) -> None:
        """Org→org delegation (``scope_org``) is not an object grant."""
        role = Role.objects.create(name="Scoped Role")
        other_org = organization_recipe.make(name="Delegation Target")
        Grant.objects.create(principal_org=self.org, role=role, scope_org=other_org)

        self.assertEqual(_errors_with(check_object_grant_principal_is_a_user(None), "permissions.E006"), [])

    def test_e004_fires_for_a_multi_valued_hop(self) -> None:
        class MultiValued(OrgScoped):
            org_via = ("teams",)
            teams = django_models.ManyToManyField("auth.Group")

            class Meta:
                app_label = "accounts"
                abstract = True

        errors = _org_via_errors_for_model(MultiValued)

        self.assertTrue(any(e.id == "permissions.E004" and "MultiValued" in e.msg for e in errors))

    def test_e004_is_quiet_for_the_shelter_models(self) -> None:
        self.assertEqual(_errors_with(check_org_via_hops_are_single_valued(None), "permissions.E004"), [])

    def test_e005_fires_for_a_role_permission_on_an_unscoped_model(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        content_type = ContentType.objects.get_for_model(Attachment)
        permission, _ = Permission.objects.get_or_create(
            content_type=content_type,
            codename="view_attachment",
            defaults={"name": "Can view attachment"},
        )
        role.permissions.add(permission)

        errors = _errors_with(check_role_permissions_models_declare_org_scoping(None), "permissions.E005")
        self.assertTrue(any("Attachment" in error.msg for error in errors))

    def test_e005_is_quiet_for_a_role_permission_on_an_org_scoped_model(self) -> None:
        role = Role.objects.create(name="Scoped Role")
        content_type = ContentType.objects.get_for_model(Shelter)
        permission, _ = Permission.objects.get_or_create(
            content_type=content_type,
            codename="view_shelter",
            defaults={"name": "Can view shelter"},
        )
        role.permissions.add(permission)

        self.assertEqual(
            _errors_with(check_role_permissions_models_declare_org_scoping(None), "permissions.E005"),
            [],
        )

    def test_e005_is_quiet_for_an_org_root_permission_on_a_scoped_role(self) -> None:
        """The org-root Organization model is identity-scoped (ADR 0001 §5.3).

        A scoped Grant scopes to an organization, so a permission bound to the
        Organization model (member-management ``organizations.*``) is an org-level
        action on the very row the grant scopes to — no ``org_via`` hop exists.
        """
        from organizations.models import Organization

        role = Role.objects.create(name="Scoped Role")
        permission, _ = Permission.objects.get_or_create(
            content_type=ContentType.objects.get_for_model(Organization),
            codename="add_org_member",
            defaults={"name": "Can add organization member"},
        )
        role.permissions.add(permission)

        self.assertEqual(
            _errors_with(check_role_permissions_models_declare_org_scoping(None), "permissions.E005"),
            [],
        )

    def test_e005_is_quiet_for_global_roles_on_unscoped_models(self) -> None:
        """Global roles are never org-filtered, so their models need no declaration yet."""
        role = Role.objects.create(name="Global Ops", is_global=True)
        content_type = ContentType.objects.get_for_model(Attachment)
        permission, _ = Permission.objects.get_or_create(
            content_type=content_type,
            codename="view_attachment",
            defaults={"name": "Can view attachment"},
        )
        role.permissions.add(permission)

        self.assertEqual(
            _errors_with(check_role_permissions_models_declare_org_scoping(None), "permissions.E005"),
            [],
        )


class WriteTierChecksTestCase(TestCase):
    """E007 — ``write_tier`` declarations must be legal (RFC 0002 §Precondition)."""

    def test_e007_is_quiet_for_clientprofile_shared_declaration(self) -> None:
        from clients.models import ClientProfile

        self.assertEqual(ClientProfile.write_tier, WRITE_SHARED)  # guard against a vacuous pass
        self.assertEqual(_errors_with(check_write_tier_declarations(None), "permissions.E007"), [])

    def test_e007_fires_when_an_org_anchored_model_declares_a_tier(self) -> None:
        from unittest.mock import patch

        from shelters.models import Shelter

        with patch.object(Shelter, "write_tier", WRITE_SHARED):
            errors = _errors_with(check_write_tier_declarations(None), "permissions.E007")

        self.assertEqual(len(errors), 1)
        self.assertIn("org-anchored", errors[0].msg)

    def test_e007_fires_when_the_object_tier_is_declared_before_the_arm(self) -> None:
        from unittest.mock import patch

        from clients.models import ClientProfile

        with patch.object(ClientProfile, "write_tier", WRITE_OBJECT):
            errors = _errors_with(check_write_tier_declarations(None), "permissions.E007")

        self.assertEqual(len(errors), 1)
        self.assertIn("reserved", errors[0].msg)
