"""Regression: GSO holders (successors to the legacy 'Shelter Data Entry' /
'Shelter Administration' groups) must be able to add/edit Organizations in the
Django admin.

Migration 0003_consolidate_shelter_operator deleted those global groups and
moved their staff into org-scoped ``Global Shelter Operator`` PermissionGroups.
Because a PermissionGroup *is* an ``auth.Group``, ``ModelBackend`` reads its
permissions globally — but the GSO template originally carried only
``shelters.*``/lookup perms, so those staff lost Django-admin org management
(403 on /admin/organizations/organization/).
"""

from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from accounts.seed import sync_group_permissions
from accounts.tests.baker_recipes import organization_recipe
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker
from organizations.models import Organization
from shelters.groups import GLOBAL_SHELTER_OPERATOR

ORG_ADMIN_PERMS = {
    "organizations.add_organization",
    "organizations.change_organization",
    "organizations.view_organization",
    "organizations.view_organizationuser",
    "accounts.add_organizationprofile",
    "accounts.change_organizationprofile",
    "accounts.view_organizationprofile",
}


class GSOCanManageOrgsTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["shelter"], owner_roles=())
        template = PermissionGroupTemplate.objects.get(name="Global Shelter Operator")
        self.gso_group = PermissionGroup.objects.create(organization=self.org, template=template)
        sync_group_permissions()

        self.staff = baker.make(User, is_staff=True)
        self.gso_group.user_set.add(self.staff)
        self.client.force_login(self.staff)

    def test_template_carries_the_org_admin_perms(self) -> None:
        """GSO is the code-owned successor role — the org perms live in config."""
        self.assertIn("organizations.add_organization", GLOBAL_SHELTER_OPERATOR.permissions)
        self.assertIn("accounts.change_organizationprofile", GLOBAL_SHELTER_OPERATOR.permissions)

    def test_gso_holder_gains_the_org_admin_perms(self) -> None:
        user = User.objects.get(pk=self.staff.pk)  # bypass cached perms
        perms = set(user.get_all_permissions())
        # Sanity: the org-scoped group still grants shelter admin globally.
        self.assertIn("shelters.add_shelter", perms)
        self.assertTrue(ORG_ADMIN_PERMS <= perms)

    def test_gso_holder_can_open_and_save_org_add_page(self) -> None:
        add_url = reverse("admin:organizations_organization_add")

        page = self.client.get(add_url)
        self.assertEqual(page.status_code, 200)

        response = self.client.post(
            add_url,
            {
                "name": "Data Entry Org",
                # Management form for the required profile inline.
                "profile-TOTAL_FORMS": "1",
                "profile-INITIAL_FORMS": "0",
                "profile-MIN_NUM_FORMS": "1",
                "profile-MAX_NUM_FORMS": "1",
                "profile-0-org_types": ["shelter"],
                # The read-only members inline renders for viewers; echo its
                # (empty) management form like the real page would.
                "organization_users-TOTAL_FORMS": "0",
                "organization_users-INITIAL_FORMS": "0",
                "organization_users-MIN_NUM_FORMS": "0",
                "organization_users-MAX_NUM_FORMS": "1000",
            },
        )
        if response.status_code != 302:
            import pathlib

            pathlib.Path("/tmp/gso_add_error.html").write_text(response.content.decode())
            self.fail(f"status {response.status_code}; body written to /tmp/gso_add_error.html")
        organization = Organization.objects.get(name="Data Entry Org")
        # reconcile_org_groups ran from save_related, so the org is provisioned.
        self.assertEqual(organization.profile.org_types, ["shelter"])
        names = set(PermissionGroup.objects.filter(organization=organization).values_list("template__name", flat=True))
        self.assertIn("Shelter Operator", names)

    def test_gso_holder_can_open_org_change_page(self) -> None:
        change_url = reverse("admin:organizations_organization_change", args=[self.org.pk])
        response = self.client.get(change_url)
        self.assertEqual(response.status_code, 200)
