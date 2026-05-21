from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, User
from accounts.services import create_organization
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER


class OrgSignalTestCase(TestCase):
    def test_add_user_to_org_assigns_member_role(self) -> None:
        """Adding a user to a properly-created org assigns the member role group."""
        org = create_organization(name="Test Org", presets=["outreach"])
        user = baker.make(User)

        # Org should already have all 3 groups from create_organization
        org_perm_groups = PermissionGroup.objects.filter(organization=org)
        self.assertEqual(org_perm_groups.count(), 3)
        org_perm_group_names = [pg.name for pg in org_perm_groups]
        self.assertCountEqual(
            org_perm_group_names,
            [CASEWORKER, GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER],
        )

        # Adding user assigns them to the member role group
        org.add_user(user)
        member_group = PermissionGroup.objects.get(organization=org, template__name=CASEWORKER)
        self.assertTrue(user.groups.filter(pk=member_group.group_id).exists())
