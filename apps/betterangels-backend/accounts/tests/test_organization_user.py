from accounts.models import User
from accounts.role_manager import OrgRoleManager
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import OrganizationUser

from .baker_recipes import organization_recipe


class OrganizationUserTestCase(TestCase):
    def setUp(self) -> None:
        self.organization1 = organization_recipe.make()
        self.organization2 = organization_recipe.make()

        self.user = baker.make(User)

    def test_add_user_to_organization_with_default_permissions(self) -> None:
        baker.make(
            OrganizationUser,
            user=self.user,
            organization=self.organization1,
        )
        OrgRoleManager(self.organization1).add_roles(self.user, CASEWORKER)

        self.assertTrue(self.user.groups.filter(name=f"{self.organization1.name}_{CASEWORKER.name}").exists())

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
        OrgRoleManager(self.organization1).add_roles(self.user, CASEWORKER)
        OrgRoleManager(self.organization2).add_roles(self.user, CASEWORKER)

        self.user.organizations_organizationuser.get(organization=self.organization1).delete()

        # Roles are no longer auto-removed when membership is deleted.
        # The removed signal (handle_organization_user_removed) was deleted in favor
        # of explicit service-layer role management. Membership deletion alone
        # does not clear roles.
        self.assertTrue(self.user.groups.filter(name=f"{self.organization1.name}_{CASEWORKER.name}").exists())
        self.assertTrue(self.user.groups.filter(name=f"{self.organization2.name}_{CASEWORKER.name}").exists())
