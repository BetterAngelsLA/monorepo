"""Tests for Role provisioning and grant backfill (ADR 0001 §2.2, §4 phase 1)."""

from accounts.models import Grant, PermissionGroup, PermissionGroupTemplate, Role, User
from accounts.seed import _resolve_permissions
from accounts.services import (
    _raise_on_phantom_role_permissions,
    backfill_caseworker_grants,
    backfill_global_role_members,
    backfill_org_admin_grants,
    backfill_shelter_grants,
    sync_roles,
)
from accounts.tests.baker_recipes import organization_recipe
from common.permissions.checks import (
    check_role_permissions_models_declare_org_scoping,
    check_scoped_role_never_in_user_groups,
)
from common.permissions.config import RoleDef
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER_ROLE
from notes.models import Note
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE

from accounts.groups import ORG_ADMIN_ROLE


def _add_legacy_membership(group: PermissionGroup, member: User) -> None:
    """Give *member* the legacy group membership, without the Grant mirror.

    The m2m edge mirrors a Grant for role-backed groups (``accounts.signals``),
    but a pre-cutover membership — the state a backfill exists to convert — has
    none, so drop the mirror the add just created.
    """
    group.user_set.add(member)
    Grant.objects.filter(principal_user=member).delete()


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

    def test_every_provisioned_permission_binds_a_real_model(self) -> None:
        """No RoleDef codename may bind to a phantom ContentType.

        ``_resolve_permissions`` binds each RoleDef permission to a real model's
        ContentType — the model that declares it in ``Meta.permissions``, or
        (for codenames ending in their model name) the synthesized model — and
        only falls back to a phantom ContentType for portal codenames no model
        declares.  ``sync_roles`` refuses those (see the phantom test below),
        so no provisioned Role can hold an unrunnable permission.
        """
        sync_roles()

        for role in Role.objects.all():
            for permission in role.permissions.select_related("content_type"):
                self.assertIsNotNone(
                    permission.content_type.model_class(),
                    f"{role.name} holds {permission.codename} on a phantom ContentType",
                )

    def test_sync_roles_refuses_a_phantom_permission(self) -> None:
        """A RoleDef permission that binds no model raises, not silently provisioned."""
        phantom_ct, _ = ContentType.objects.get_or_create(app_label="shelters", model="reviewed")
        phantom_perm, _ = Permission.objects.get_or_create(
            content_type=phantom_ct,
            codename="change_shelter_is_reviewed",
            defaults={"name": "Can change shelter is reviewed"},
        )
        role_def = RoleDef(name="Phantom Role", permissions=["shelters.change_shelter_is_reviewed"])

        with self.assertRaisesRegex(RuntimeError, "no model class"):
            _raise_on_phantom_role_permissions(role_def, {phantom_perm.pk})


class RoleNameCollisionTestCase(TestCase):
    """A legacy bare ``auth.Group`` holding a ``RoleDef``'s name must not abort provisioning.

    Regression for the 2026-09-11 production incident: ``Role`` and
    ``PermissionGroup`` are MTI subclasses of ``auth.Group``, so they share the
    unique ``auth_group.name``.  A pre-cutover leftover
    ``Group(name="Caseworker")`` (no ``Role``/``PermissionGroup`` child, 0
    members, 0 permissions) made ``Role.objects.get_or_create`` collide on
    ``auth_group_name_key``; ``sync_roles`` is one transaction, so the rollback
    skipped every Role, every grant backfill and the phantom retire for that
    deploy — denying reports/teams to legacy ``PermissionGroup`` holders.
    """

    ROLE_NAME = CASEWORKER_ROLE.name

    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        # Model the pre-provisioning DB: no Role for the name yet — a bare group
        # holds it (any Role the test DB's post_migrate created is withdrawn).
        Role.objects.filter(name=self.ROLE_NAME).delete()
        self.bare_group = Group.objects.create(name=self.ROLE_NAME)

    def _role(self) -> Role:
        return Role.objects.get(name=self.ROLE_NAME)

    def test_adopts_a_memberless_bare_group_as_the_role(self) -> None:
        sync_roles()

        role = self._role()
        self.assertEqual(role.pk, self.bare_group.pk)  # the group itself became the role
        self.assertEqual(Group.objects.filter(name=self.ROLE_NAME).count(), 1)
        self.assertFalse(role.is_global)
        self.assertEqual(
            {p.pk for p in role.permissions.all()},
            set(_resolve_permissions(CASEWORKER_ROLE.permissions)),
        )

    def test_adoption_is_idempotent(self) -> None:
        sync_roles()
        sync_roles()

        self.assertEqual(Role.objects.filter(name=self.ROLE_NAME).count(), 1)
        self.assertEqual(self._role().pk, self.bare_group.pk)

    def test_adopted_role_backfills_grants(self) -> None:
        permission_group = PermissionGroup.objects.get(organization=self.org, template__name=self.ROLE_NAME)
        member = baker.make(User)
        _add_legacy_membership(permission_group, member)

        sync_roles()
        backfill_caseworker_grants()

        self.assertTrue(Grant.objects.filter(principal_user=member, role=self._role(), scope_org=self.org).exists())

    def test_staffed_bare_group_is_renamed_instead_of_adopted(self) -> None:
        member = baker.make(User)
        member.groups.add(self.bare_group)

        sync_roles()

        role = self._role()
        self.assertNotEqual(role.pk, self.bare_group.pk)
        self.bare_group.refresh_from_db()
        self.assertEqual(self.bare_group.name, f"{self.ROLE_NAME} (legacy group {self.bare_group.pk})")
        # The membership moved nowhere: it stays on the renamed group…
        self.assertTrue(member.groups.filter(pk=self.bare_group.pk).exists())
        # …so no scoped Role sits in user.groups (permissions.E001).
        self.assertEqual(check_scoped_role_never_in_user_groups(None), [])

    def test_rename_candidate_that_is_also_taken_still_converges(self) -> None:
        taken = Group.objects.create(name=f"{self.ROLE_NAME} (legacy group {self.bare_group.pk})")
        member = baker.make(User)
        member.groups.add(self.bare_group)

        sync_roles()

        self.bare_group.refresh_from_db()
        self.assertEqual(self.bare_group.name, f"{self.ROLE_NAME} (legacy group {self.bare_group.pk})-1")
        self.assertTrue(Group.objects.filter(pk=taken.pk).exists())
        self.assertTrue(Role.objects.filter(name=self.ROLE_NAME).exists())

    def test_permission_group_holding_the_name_raises_an_actionable_error(self) -> None:
        self.bare_group.delete()  # free the name for the hand-made PermissionGroup
        PermissionGroup.objects.filter(organization=self.org, template__name=self.ROLE_NAME).update(name=self.ROLE_NAME)

        with self.assertRaisesMessage(RuntimeError, "held by a PermissionGroup"):
            sync_roles()

        # Never touched: the row survives, under the colliding name.
        self.assertTrue(PermissionGroup.objects.filter(organization=self.org, name=self.ROLE_NAME).exists())

    def test_migrate_completes_with_a_legacy_bare_group_present(self) -> None:
        """The deploy path — ``manage.py migrate`` (post_migrate) runs the whole chain."""
        permission_group = PermissionGroup.objects.get(organization=self.org, template__name=self.ROLE_NAME)
        member = baker.make(User)
        _add_legacy_membership(permission_group, member)

        call_command("migrate", verbosity=0)

        role = self._role()
        self.assertEqual(role.pk, self.bare_group.pk)  # adopted, not orphaned
        self.assertTrue(Grant.objects.filter(principal_user=member, role=role, scope_org=self.org).exists())
        # Provisioning ran to completion, not only for the colliding RoleDef.
        self.assertTrue(Role.objects.filter(name=ORG_ADMIN_ROLE.name).exists())


class BackfillTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        sync_roles()
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)

    def test_backfill_shelter_grants_creates_one_grant_per_member(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=SHELTER_OPERATOR_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_shelter_grants()

        grant = Grant.objects.get(principal_user=member, role=self.shelter_role, scope_org=self.org)
        self.assertIsNotNone(grant.pk)

    def test_backfill_shelter_grants_is_idempotent(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=SHELTER_OPERATOR_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

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


class OrgAdminAndCaseworkerBackfillTestCase(TestCase):
    """backfill_org_admin_grants / backfill_caseworker_grants (ADR 0001 §2.2).

    These are the basis for existing org admins' / caseworkers' teams authority
    after deploy — a template-name mismatch or wrong role lookup would silently
    strip team management from every existing member.  Mirror the shelter
    backfill coverage: one grant per member, idempotent, converts only the
    intended template.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        sync_roles()
        self.org_admin_role = Role.objects.get(name=ORG_ADMIN_ROLE.name)
        self.caseworker_role = Role.objects.get(name=CASEWORKER_ROLE.name)

    def test_backfill_org_admin_grants_creates_one_grant_per_member(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=ORG_ADMIN_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_org_admin_grants()

        grant = Grant.objects.get(principal_user=member, role=self.org_admin_role, scope_org=self.org)
        self.assertIsNotNone(grant.pk)

    def test_backfill_org_admin_grants_is_idempotent(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=ORG_ADMIN_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_org_admin_grants()
        backfill_org_admin_grants()

        self.assertEqual(Grant.objects.filter(principal_user=member, role=self.org_admin_role).count(), 1)

    def test_backfill_org_admin_converts_only_org_admin(self) -> None:
        # A caseworker membership is not an org-admin membership; a hand-made
        # (label-only) role must not convert either.
        cw_group = PermissionGroup.objects.get(organization=self.org, template__name=CASEWORKER_ROLE.name)
        other = PermissionGroup.objects.create(organization=self.org, label="Hand-made Role")
        member = baker.make(User)
        _add_legacy_membership(cw_group, member)
        other.user_set.add(member)

        backfill_org_admin_grants()

        self.assertFalse(Grant.objects.filter(principal_user=member).exists())

    def test_backfill_caseworker_grants_creates_one_grant_per_member(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=CASEWORKER_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_caseworker_grants()

        grant = Grant.objects.get(principal_user=member, role=self.caseworker_role, scope_org=self.org)
        self.assertIsNotNone(grant.pk)

    def test_backfill_caseworker_grants_is_idempotent(self) -> None:
        group = PermissionGroup.objects.get(organization=self.org, template__name=CASEWORKER_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_caseworker_grants()
        backfill_caseworker_grants()

        self.assertEqual(Grant.objects.filter(principal_user=member, role=self.caseworker_role).count(), 1)

    def test_backfill_caseworker_converts_only_caseworker(self) -> None:
        # An org-admin membership must not be converted into a caseworker grant.
        group = PermissionGroup.objects.get(organization=self.org, template__name=ORG_ADMIN_ROLE.name)
        member = baker.make(User)
        _add_legacy_membership(group, member)

        backfill_caseworker_grants()

        self.assertFalse(Grant.objects.filter(principal_user=member).exists())


class RoleDefTemplateConsistencyTestCase(TestCase):
    """Every scoped ``RoleDef`` bundle must fit inside its template's bundle.

    "Template ≈ Role" is the cutover contract: the template is what the org
    pages and the per-org report read, the Role is what ``can()`` reads.  A
    permission added to one list and forgotten in the other would make the FE
    offer an action the backend refuses (or hide one it allows), and nothing
    else would catch it.
    """

    def test_scoped_role_defs_are_template_subsets(self) -> None:
        from accounts.services import _all_role_defs

        for role_def in _all_role_defs():
            if role_def.is_global:
                continue
            with self.subTest(role=role_def.name):
                template = PermissionGroupTemplate.objects.get(name=role_def.name)
                template_perms = {
                    f"{app_label}.{codename}"
                    for app_label, codename in template.permissions.values_list("content_type__app_label", "codename")
                }
                self.assertLessEqual(
                    set(role_def.permissions),
                    template_perms,
                    f"{role_def.name} grants permissions its template does not",
                )


class ViewPrivateGlobalTierTestCase(TestCase):
    """view_private_shelter is global-tier only (folded from audit #2422).

    Private shelters in the public directory are a global-tier gate: the only
    consumer reads has_perm, which Grant rows don't feed, so the scoped Shelter
    Operator role must not declare an authority it could never exercise.  The
    GSO role keeps it.
    """

    def test_view_private_is_absent_from_scoped_role_and_present_on_global(self) -> None:
        sync_roles()

        shelter_op = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.assertFalse(
            shelter_op.permissions.filter(content_type__app_label="shelters", codename="view_private_shelter").exists()
        )

        gso = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)
        self.assertTrue(
            gso.permissions.filter(content_type__app_label="shelters", codename="view_private_shelter").exists()
        )
