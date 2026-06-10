from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from django.test import TestCase
from model_bakery import baker

from .baker_recipes import organization_recipe


class OrgSignalTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_handle_user_added_signal_assigns_member_role(self) -> None:
        """When a user is added to an org, the signal assigns the member-level
        permission group based on the org's org_types, falling back to
        Caseworker for orgs without a profile."""
        org_1 = organization_recipe.make()
        org_2 = organization_recipe.make()
        user = baker.make(User)

        initial_org_1_perm_groups = PermissionGroup.objects.filter(organization=org_1)
        initial_org_2_perm_groups = PermissionGroup.objects.filter(organization=org_2)
        self.assertEqual(initial_org_1_perm_groups.count(), 0)
        self.assertEqual(initial_org_2_perm_groups.count(), 0)

        org_1.add_user(user)
        org_1_perm_groups = PermissionGroup.objects.filter(organization=org_1)
        org_2_perm_groups = PermissionGroup.objects.filter(organization=org_2)
        # Fallback to legacy Caseworker group for orgs without org_types.
        self.assertEqual(org_1_perm_groups.count(), 1)
        self.assertEqual(org_2_perm_groups.count(), 0)

        org_perm_group_names = [pg.name for pg in org_1_perm_groups]
        self.assertCountEqual(org_perm_group_names, [GroupTemplateNames.CASEWORKER])
