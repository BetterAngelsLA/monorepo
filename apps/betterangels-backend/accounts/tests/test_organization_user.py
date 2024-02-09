from accounts.groups import GroupTemplateNames
from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from django.test import TestCase
from model_bakery import baker
from organizations.models import Organization, OrganizationUser


class OrganizationUserTests(TestCase):
    def setUp(self) -> None:
        self.organization1: Organization = baker.make(
            Organization, name="OrgOne", slug="orgone"
        )
        self.organization2: Organization = baker.make(
            Organization, name="OrgTwo", slug="orgtwo"
        )

        self.user = baker.make(User, username="testuser")

        self.caseworker_template = PermissionGroupTemplate.objects.get(
            name=GroupTemplateNames.CASEWORKER
        )

        baker.make(
            PermissionGroup,
            organization=self.organization1,
            template=self.caseworker_template,
        )
        baker.make(
            PermissionGroup,
            organization=self.organization2,
            template=self.caseworker_template,
        )

    def test_add_user_to_organization_with_default_permissions(self) -> None:
        baker.make(
            OrganizationUser,
            user=self.user,
            organization=self.organization1,
        )
        self.assertTrue(
            self.user.groups.filter(
                name=f"{self.organization1.name}_Caseworker"
            ).exists()
        )

    def test_user_with_multiple_organizations_retains_access(self) -> None:
        baker.make(
            OrganizationUser,
            user=self.user,
            organization=self.organization1,
        )
        baker.make(
            OrganizationUser,
            user=self.user,
            organization=self.organization2,
        )

        self.user.organizations_organizationuser.get(
            organization=self.organization1
        ).delete()

        self.assertFalse(
            self.user.groups.filter(
                name=f"{self.organization1.name}_Caseworker"
            ).exists()
        )
        self.assertTrue(
            self.user.groups.filter(
                name=f"{self.organization2.name}_Caseworker"
            ).exists()
        )
