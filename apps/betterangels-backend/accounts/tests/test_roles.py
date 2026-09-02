"""Tests for Role provisioning and grant backfill (ADR 0001 §2.2, §4 phase 1)."""

from accounts.models import Grant, PermissionGroup, PermissionGroupTemplate, Role, User
from accounts.services import backfill_global_role_members, backfill_shelter_grants, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.checks import check_role_permissions_models_declare_org_scoping
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from model_bakery import baker
from notes.models import Note
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE


class SyncRolesTestCase(TestCase):
    def test_sync_roles_provisions_scoped_and_global_roles(self) -> None:
        sync_roles()

        shelter_op = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        gso = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

        self.assertFalse(shelter_op.is_global)
        self.assertTrue(gso.is_global)
        self.assertLess(len(shelter_op.permissions.all()), len(gso.permissions.all()))

    def test_sync_roles_is_idempotent(self) -> None:
        sync_roles()
        sync_roles()

        self.assertEqual(
            Role.objects.filter(name__in=[SHELTER_OPERATOR_ROLE.name, GLOBAL_SHELTER_OPERATOR_ROLE.name]).count(),
            2,
        )

    def test_sync_roles_reverts_permission_drift(self) -> None:
        sync_roles()
        shelter_op = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        content_type = ContentType.objects.get_for_model(Note)
        stray, _ = Permission.objects.get_or_create(
            content_type=content_type,
            codename="view_note",
            defaults={"name": "Can view note"},
        )
        shelter_op.permissions.add(stray)

        sync_roles()

        shelter_op.refresh_from_db()
        self.assertNotIn(stray, shelter_op.permissions.all())

    def test_sync_roles_reverts_global_flag_drift(self) -> None:
        sync_roles()
        gso = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)
        gso.is_global = False
        gso.save(update_fields=["is_global"])

        sync_roles()

        gso.refresh_from_db()
        self.assertTrue(gso.is_global)

    def test_e005_is_quiet_for_seeded_scoped_roles(self) -> None:
        """Every model the scoped Shelter Operator role grants is OrgScoped."""
        sync_roles()

        errors = [e for e in check_role_permissions_models_declare_org_scoping(None) if e.id == "permissions.E005"]
        self.assertEqual(errors, [])


class BackfillTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        sync_roles()
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_backfill_shelter_grants_creates_one_grant_per_member(self) -> None:
        # Simulate a pre-teardown org that still had the legacy group.
        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        group = PermissionGroup.objects.create(organization=self.org, template=template)
        member = baker.make(User)
        group.user_set.add(member)

        backfill_shelter_grants()

        grant = Grant.objects.get(principal_user=member, role=self.shelter_role, scope_org=self.org)
        self.assertIsNotNone(grant.pk)

    def test_backfill_shelter_grants_is_idempotent(self) -> None:
        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        group = PermissionGroup.objects.create(organization=self.org, template=template)
        member = baker.make(User)
        group.user_set.add(member)

        backfill_shelter_grants()
        backfill_shelter_grants()

        self.assertEqual(Grant.objects.filter(principal_user=member, role=self.shelter_role).count(), 1)

    def test_backfill_converts_only_the_shelter_role(self) -> None:
        # A hand-made (label-only) role is not a shelter role and must not convert.
        other = PermissionGroup.objects.create(organization=self.org, label="Hand-made Role")
        member = baker.make(User)
        other.user_set.add(member)

        backfill_shelter_grants()

        self.assertFalse(Grant.objects.filter(principal_user=member).exists())

    def test_backfill_global_role_members_moves_gso_members(self) -> None:
        gso_group = PermissionGroup.objects.create(
            organization=self.org,
            template=PermissionGroupTemplate.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name),
        )
        member = baker.make(User)
        gso_group.user_set.add(member)

        backfill_global_role_members()

        self.assertTrue(member.groups.filter(role__is_global=True).exists())
