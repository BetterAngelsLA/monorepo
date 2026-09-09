from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.seed import seed_permission_templates, sync_group_permissions
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker


class ShelterGroupPermissionsTestCase(TestCase):
    """Global Shelter Operator is granted by hand, so it has no org type.

    Its permissions still have to reach the ``auth.Group`` that grants them,
    which is what every assertion here checks — the group, not any intermediate
    copy of the permission set.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        self.template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        self.permission_group = PermissionGroup.objects.create(organization=self.org, template=self.template)

    def _group_codenames(self, model: str) -> set[str]:
        return set(
            self.permission_group.permissions.filter(
                content_type__app_label="shelters",
                content_type__model=model,
            ).values_list("codename", flat=True)
        )

    def _all_codenames(self, model: str) -> set[str]:
        return set(
            Permission.objects.filter(
                content_type__app_label="shelters",
                content_type__model=model,
            ).values_list("codename", flat=True)
        )

    def test_group_gets_every_schedule_permission(self) -> None:
        sync_group_permissions()
        self.assertSetEqual(self._group_codenames("schedule"), self._all_codenames("schedule"))

    def test_group_gets_every_availability_permission(self) -> None:
        sync_group_permissions()
        self.assertSetEqual(self._group_codenames("shelteravailability"), self._all_codenames("shelteravailability"))

    def test_group_gets_view_private_shelter(self) -> None:
        sync_group_permissions()
        self.assertTrue(
            self.permission_group.permissions.filter(
                content_type__app_label="shelters", codename="view_private_shelter"
            ).exists()
        )

    def test_sync_populates_an_empty_group_and_is_idempotent(self) -> None:
        self.permission_group.permissions.clear()

        sync_group_permissions()
        first_pass = set(self.permission_group.permissions.values_list("codename", flat=True))
        self.assertIn("view_shelter", first_pass)
        self.assertIn("change_shelter", first_pass)

        sync_group_permissions()
        self.assertSetEqual(set(self.permission_group.permissions.values_list("codename", flat=True)), first_pass)

    def test_member_gains_shelters_admin_access(self) -> None:
        user = baker.make(User, is_staff=True)
        self.permission_group.user_set.add(user)
        self.permission_group.permissions.clear()

        self.assertNotIn("shelters.view_shelter", user.get_all_permissions())

        seed_permission_templates()
        sync_group_permissions()

        # Re-fetch to bypass the cached permission set on the old instance.
        user = User.objects.get(pk=user.pk)
        self.assertIn("shelters.view_shelter", user.get_all_permissions())
        self.assertIn("shelters.change_shelter", user.get_all_permissions())
        self.assertTrue(user.has_module_perms("shelters"))
