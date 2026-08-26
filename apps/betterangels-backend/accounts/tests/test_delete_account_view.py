"""The web account-deletion page, the second way a user deletes their own account."""

from accounts.models import User
from accounts.services import organization_transfer_ownership
from django.test import TestCase
from django.urls import reverse
from organizations.models import OrganizationOwner, OrganizationUser

from .baker_recipes import organization_recipe


class DeleteAccountViewTestCase(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(
            username="delete_account_view", email="delete_account_view@example.com", password="password"
        )
        self.client.force_login(self.user)
        self.url = reverse("delete_account")
        self.organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())

    def _join(self) -> None:
        OrganizationUser.objects.create(organization=self.organization, user=self.user)

    def test_an_account_that_owns_nothing_is_deleted(self) -> None:
        user_id = self.user.pk

        response = self.client.post(self.url)

        self.assertRedirects(response, "/", fetch_redirect_response=False)
        self.assertFalse(User.objects.filter(pk=user_id).exists())

    def test_an_owner_is_refused_and_told_why(self) -> None:
        """The cascade would leave the organization with nobody able to administer it."""
        self._join()
        organization_transfer_ownership(organization=self.organization, new_owner_user_id=self.user.pk)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Transfer ownership to another member")
        self.assertContains(response, self.organization.name)
        self.assertTrue(User.objects.filter(pk=self.user.pk).exists())
        self.assertTrue(OrganizationOwner.objects.filter(organization=self.organization).exists())
