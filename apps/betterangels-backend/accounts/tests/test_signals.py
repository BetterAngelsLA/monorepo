from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from accounts.utils import add_user_to_org_group, create_default_org_permission_groups
from django.test import TestCase
from model_bakery import baker

from .baker_recipes import organization_recipe


class OrgSignalTestCase(TestCase):
    def setUp(self) -> None:
        super().setUp()

    def test_explicit_permission_group_creation(self) -> None:
        """Permission groups are created explicitly, not via signals."""
        org_1 = organization_recipe.make()
        user = baker.make(User)

        # No groups exist before explicit creation
        self.assertEqual(PermissionGroup.objects.filter(organization=org_1).count(), 0)

        # Adding a user does NOT auto-create permission groups
        org_1.add_user(user)
        self.assertEqual(PermissionGroup.objects.filter(organization=org_1).count(), 0)

        # Groups are created explicitly
        create_default_org_permission_groups(org_1)
        org_1_perm_groups = PermissionGroup.objects.filter(organization=org_1)
        self.assertEqual(org_1_perm_groups.count(), 3)

        org_perm_group_names = [pg.name for pg in org_1_perm_groups]
        expected_names = [
            GroupTemplateNames.CASEWORKER,
            GroupTemplateNames.ORG_ADMIN,
            GroupTemplateNames.ORG_SUPERUSER,
        ]
        self.assertCountEqual(org_perm_group_names, expected_names)

    def test_explicit_user_group_assignment(self) -> None:
        """Users are assigned to groups explicitly, not via signals."""
        org = organization_recipe.make()
        user = baker.make(User)
        create_default_org_permission_groups(org)

        org.add_user(user)
        # User is NOT auto-assigned to any group
        self.assertEqual(user.groups.count(), 0)

        # Explicit assignment works
        add_user_to_org_group(user, org, GroupTemplateNames.CASEWORKER)
        self.assertEqual(user.groups.count(), 1)
