"""Object-grant arm tests (ADR 0001 §2.5).

Per-record authority: a user with an object grant on a row may exercise the
granted role's permissions on that row even when they hold nothing org-wide —
the mechanism behind cross-org client sharing (ADR §5.1, option 2).
"""

from accounts.models import Grant, Role, User
from accounts.services import grant_create, grant_obj, sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.permissions import checks
from common.permissions.selectors import _object_grant_ancestors, _object_grant_q, can_obj, visible
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE, SHELTER_OPERATOR_ROLE
from shelters.models import Bed, Room, Shelter
from shelters.tests.baker_recipes import shelter_recipe
from typing import Any


class ObjectGrantTestCase(TestCase):
    def setUp(self) -> None:
        sync_roles()
        self.shelter_role = Role.objects.get(name=SHELTER_OPERATOR_ROLE.name)
        self.gso_role = Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name)
        # A scoped role carrying the client CHANGE/DELETE/VIEW perms — the
        # object-granted role must actually carry the permission being checked.
        self.sharer_role, _ = Role.objects.get_or_create(name="Test Client Sharer", is_global=False)
        for perm in (
            "clients.change_clientprofile",
            "clients.delete_clientprofile",
            "clients.view_clientprofile",
        ):
            app_label, codename = perm.split(".")
            self.sharer_role.permissions.add(
                Permission.objects.get(codename=codename, content_type__app_label=app_label)
            )

    def _profile(self) -> Any:
        from clients.models import ClientProfile

        return baker.make(ClientProfile)

    # ── visible() / can_obj() ──────────────────────────────────────────────

    def test_object_grant_grants_permission_on_the_single_row(self) -> None:
        from clients.models import ClientProfile

        sharer = baker.make(User)
        stranger = baker.make(User)
        profile = self._profile()
        other = self._profile()
        grant_obj(user=sharer, role=self.sharer_role, obj=profile)

        # The sharer has no org grant at all — the object grant alone is enough.
        self.assertTrue(can_obj(sharer, ClientProfile.perms.CHANGE, profile))
        self.assertEqual(list(visible(ClientProfile.objects.all(), sharer, ClientProfile.perms.CHANGE)), [profile])
        self.assertFalse(can_obj(sharer, ClientProfile.perms.CHANGE, other))
        # A stranger sees nothing.
        self.assertFalse(can_obj(stranger, ClientProfile.perms.CHANGE, profile))

    def test_object_grant_covers_every_permission_of_the_role(self) -> None:
        from clients.models import ClientProfile

        sharer = baker.make(User)
        profile = self._profile()
        grant_obj(user=sharer, role=self.sharer_role, obj=profile)

        self.assertTrue(can_obj(sharer, ClientProfile.perms.DELETE, profile))
        self.assertTrue(can_obj(sharer, ClientProfile.perms.VIEW, profile))

    def test_object_grant_does_not_change_platform_shared_reads_for_holders(self) -> None:
        from clients.models import ClientProfile

        holder = baker.make(User)
        org = organization_recipe.make(name="Holder Org")
        grant_create(user=holder, role=self.shelter_role, scope_org=org)
        baker.make(ClientProfile)
        baker.make(ClientProfile)

        # A user who holds VIEW anywhere still sees all profiles (unchanged) —
        # SHELTER_OPERATOR carries clients.view_clientprofile.
        self.assertEqual(visible(ClientProfile.objects.all(), holder, ClientProfile.perms.VIEW).count(), 2)

    def test_object_grants_do_not_leak_into_org_scoped_models(self) -> None:
        """Whitelist-only: the object arm is a no-op for non-whitelisted models."""
        self.shelter = shelter_recipe.make()
        room = baker.make(Room, shelter=self.shelter)
        baker.make(Bed, shelter=self.shelter, room=room)

        # Bed/Room/Shelter are not whitelisted — an object grant on them would
        # violate E003, so ``_object_grant_q`` fails closed for them.
        from django.db.models import Q

        from common.permissions.selectors import _object_grant_q

        user = baker.make(User)
        self.assertEqual(_object_grant_q(Bed, user, Bed.perms.VIEW), Q(pk__lt=0))

    def test_object_grant_cascade_derives_ancestor_paths(self) -> None:
        """An object grant on an ancestor covers descendants via org_via (ADR §2.5)."""
        from clients.models import ClientProfile

        # Bed.org_via=("shelter",) → an object grant on the shelter covers its beds.
        self.assertIn(("shelter_id", Shelter), _object_grant_ancestors(Bed))
        self.assertIn(("shelter_id", Shelter), _object_grant_ancestors(Room))
        # Platform-shared models have no org-bearing ancestors.
        self.assertEqual(_object_grant_ancestors(ClientProfile), [])

    # ── grant_obj service ──────────────────────────────────────────────────

    def test_grant_obj_creates_a_valid_object_grant(self) -> None:
        profile = self._profile()
        user = baker.make(User)

        grant = grant_obj(user=user, role=self.sharer_role, obj=profile)

        self.assertIsNone(grant.scope_org)
        self.assertEqual(grant.scope_object_id, profile.pk)
        self.assertEqual(grant.role, self.sharer_role)
        self.assertTrue(Grant.objects.filter(pk=grant.pk).exists())

    def test_grant_obj_refuses_a_non_whitelisted_model(self) -> None:
        from django.core.exceptions import ValidationError

        user = baker.make(User)
        self.shelter = shelter_recipe.make()

        with self.assertRaises(ValidationError):
            grant_obj(user=user, role=self.sharer_role, obj=self.shelter)

        # No OBJECT grant was written (the shared DB has seeded org grants).
        self.assertFalse(Grant.objects.filter(scope_object_type__isnull=False).exists())

    def test_grant_obj_refuses_a_global_role(self) -> None:
        from django.core.exceptions import ValidationError

        user = baker.make(User)
        profile = self._profile()

        with self.assertRaises(ValidationError):
            grant_obj(user=user, role=self.gso_role, obj=profile)

        # No OBJECT grant was written (the shared DB has seeded org grants).
        self.assertFalse(Grant.objects.filter(scope_object_type__isnull=False).exists())

    # ── E003 ───────────────────────────────────────────────────────────────

    def test_e003_flags_object_grants_on_non_whitelisted_models(self) -> None:
        from django.contrib.contenttypes.models import ContentType

        user = baker.make(User)
        self.shelter = shelter_recipe.make()
        Grant.objects.create(
            principal_user=user,
            role=self.sharer_role,
            scope_object_type=ContentType.objects.get_for_model(type(self.shelter)),
            scope_object_id=self.shelter.pk,
        )

        errors = [e for e in checks.check_object_grant_targets_whitelisted_model(None) if e.id == "permissions.E003"]
        self.assertTrue(errors)

    def test_e003_passes_whitelisted_object_grants(self) -> None:
        user = baker.make(User)
        profile = self._profile()
        grant_obj(user=user, role=self.sharer_role, obj=profile)

        errors = [e for e in checks.check_object_grant_targets_whitelisted_model(None) if e.id == "permissions.E003"]
        self.assertEqual(errors, [])

    # ── orphan cleanup (finding F3) ────────────────────────────────────────

    def test_deleting_the_row_removes_its_object_grants(self) -> None:
        from django.contrib.contenttypes.models import ContentType

        user = baker.make(User)
        profile = self._profile()
        grant_obj(user=user, role=self.sharer_role, obj=profile)
        ct = ContentType.objects.get_for_model(type(profile))
        self.assertEqual(Grant.objects.filter(scope_object_type=ct, scope_object_id=profile.pk).count(), 1)

        profile.delete()

        self.assertFalse(Grant.objects.filter(scope_object_type=ct, scope_object_id=profile.pk).exists())
