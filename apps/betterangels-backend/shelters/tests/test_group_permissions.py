from django.contrib.auth.models import Permission
from django.test import TestCase

from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.seed import seed_permission_templates
from accounts.signals import _sync_template_permissions
from model_bakery import baker
from organizations.models import Organization


class ShelterGroupPermissionsTestCase(TestCase):
    def test_global_shelter_operator_has_schedule_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        schedule_permissions = set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model="schedule",
            ).values_list("codename", flat=True)
        )

        self.assertSetEqual(
            set(
                template.permissions.filter(
                    content_type__app_label="shelters",
                    content_type__model="schedule",
                ).values_list("codename", flat=True)
            ),
            schedule_permissions,
        )

    def test_global_shelter_operator_has_availability_permissions(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        availability_permissions = set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model="shelteravailability",
            ).values_list("codename", flat=True)
        )

        self.assertSetEqual(
            set(
                template.permissions.filter(
                    content_type__app_label="shelters",
                    content_type__model="shelteravailability",
                ).values_list("codename", flat=True)
            ),
            availability_permissions,
        )

    def test_global_shelter_operator_has_view_private_permission(self) -> None:
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        self.assertTrue(
            template.permissions.filter(
                content_type__app_label="shelters",
                codename="view_private_shelter",
            ).exists()
        )

    def test_global_shelter_operator_group_gets_permissions(self) -> None:
        """
        A PermissionGroup using the Global Shelter Operator template must
        result in an auth.Group with the correct permissions — even when the
        template is NOT registered in the REGISTRY.

        This simulates the real-world migration scenario:
        1. Consolidation migration creates the template (empty perms).
        2. Migration creates PermissionGroups → auth.Groups get empty perms.
        3. post_migrate: seed_permission_templates fills template perms.
        4. post_migrate: _sync_template_permissions syncs auth.Group perms.
        """
        org = Organization.objects.create(name="Test Shelter Org")
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")

        # ── Step 1 & 2: Simulate post-migration state ──
        # Template permissions are empty (migration created it without perms).
        template.permissions.clear()
        self.assertEqual(template.permissions.count(), 0)

        # Create a PermissionGroup — PermissionGroup.save() copies the
        # (empty) template permissions into a new auth.Group.
        pg = PermissionGroup.objects.create(
            organization=org,
            template=template,
            name=template.name,
        )
        auth_group = pg.group
        self.assertEqual(auth_group.permissions.count(), 0)

        # ── Step 3: Seed template permissions ──
        seed_permission_templates()
        template.refresh_from_db()
        self.assertGreater(
            template.permissions.count(),
            0,
            "Template must have permissions after seeding.",
        )

        # ── Step 4: Sync auth.Group permissions ──
        _sync_template_permissions()
        auth_group.refresh_from_db()

        # The group must now have shelter permissions.
        self.assertTrue(
            auth_group.permissions.filter(
                content_type__app_label="shelters",
                codename="view_shelter",
            ).exists(),
            "auth.Group must have view_shelter after sync.",
        )
        self.assertTrue(
            auth_group.permissions.filter(
                content_type__app_label="shelters",
                codename="change_shelter",
            ).exists(),
            "auth.Group must have change_shelter after sync.",
        )

        # ── Step 5: Verify idempotency ──
        permissions_count_before = auth_group.permissions.count()
        _sync_template_permissions()
        auth_group.refresh_from_db()
        self.assertEqual(
            auth_group.permissions.count(),
            permissions_count_before,
            "Syncing template permissions must be idempotent — a second sync should not change the permission count.",
        )
        self.assertTrue(
            auth_group.permissions.filter(
                content_type__app_label="shelters",
                codename="view_shelter",
            ).exists(),
            "auth.Group must still have view_shelter after a second sync.",
        )
        self.assertTrue(
            auth_group.permissions.filter(
                content_type__app_label="shelters",
                codename="change_shelter",
            ).exists(),
            "auth.Group must still have change_shelter after a second sync.",
        )

    def test_global_shelter_operator_admin_module_permission(self) -> None:
        """
        A user assigned to a Global Shelter Operator PermissionGroup must
        be able to see the Shelters admin module (has_module_permission).

        This simulates the real-world scenario where:
        1. Migration creates template + PermissionGroup (empty perms).
        2. post_migrate seeds template perms and syncs group perms.
        3. User should then see the Shelters tab in Django Admin.
        """
        org = Organization.objects.create(name="GSO Admin Org")
        user = baker.make(User, email="khady@example.com", is_staff=True)

        # Simulate migration: template exists but perms are empty.
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        template.permissions.clear()

        # Create PermissionGroup with empty template (migration does this).
        pg = PermissionGroup.objects.create(
            organization=org,
            template=template,
            name=template.name,
        )
        pg.group.user_set.add(user)

        # User should NOT have shelter perms yet (simulates broken state).
        user_perms = user.get_all_permissions()
        self.assertNotIn("shelters.view_shelter", user_perms)

        # Now run the fix: seed + sync.
        seed_permission_templates()
        _sync_template_permissions()

        # Re-fetch user to bypass Django's cached permission set
        # (get_all_permissions caches in _perm_cache).
        user = User.objects.get(pk=user.pk)
        user_perms = user.get_all_permissions()
        self.assertIn("shelters.view_shelter", user_perms)
        self.assertIn("shelters.change_shelter", user_perms)

        # Verify Django admin module permission via the standard
        # user.has_module_perms() / user.has_perm() API.
        self.assertTrue(
            user.has_module_perms("shelters"),
            "User with Global Shelter Operator must have module permission for Shelters admin.",
        )
        self.assertTrue(
            user.has_perm("shelters.view_shelter"),
            "User with Global Shelter Operator must have view_shelter permission.",
        )
