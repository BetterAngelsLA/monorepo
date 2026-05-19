from unittest.mock import patch

from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from django.core.exceptions import ValidationError
from django.test import TestCase
from organizations.models import OrganizationOwner, OrganizationUser
from shelters.groups import SHELTER_OPERATOR
from shelters.services import shelter_organization_create


class ShelterOrganizationCreateTestCase(TestCase):
    """Tests for shelter_organization_create service."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="operator@example.com",
            first_name="Jane",
            last_name="Doe",
            is_active=True,
        )

    @patch("shelters.services._send_shelter_welcome_email")
    def test_creates_organization(self, mock_email):
        org = shelter_organization_create(
            user=self.user,
            organization_name="Safe Haven Shelter",
        )

        self.assertEqual(org.name, "Safe Haven Shelter")

    @patch("shelters.services._send_shelter_welcome_email")
    def test_user_is_org_owner(self, mock_email):
        org = shelter_organization_create(
            user=self.user,
            organization_name="My Shelter",
        )

        org_user = OrganizationUser.objects.get(user=self.user, organization=org)
        self.assertTrue(org_user.is_admin)
        self.assertTrue(OrganizationOwner.objects.filter(organization=org, organization_user=org_user).exists())

    @patch("shelters.services._send_shelter_welcome_email")
    def test_user_gets_shelter_operator_group(self, mock_email):
        org = shelter_organization_create(
            user=self.user,
            organization_name="Org",
        )

        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR)
        perm_group = PermissionGroup.objects.get(organization=org, template=template)
        self.assertTrue(self.user.groups.filter(pk=perm_group.group_id).exists())

    @patch("shelters.services._send_shelter_welcome_email")
    def test_sends_welcome_email(self, mock_email):
        shelter_organization_create(
            user=self.user,
            organization_name="Org",
        )

        mock_email.assert_called_once()

    @patch("shelters.services._send_shelter_welcome_email")
    def test_empty_org_name_raises(self, mock_email):
        with self.assertRaises(ValidationError) as ctx:
            shelter_organization_create(
                user=self.user,
                organization_name="   ",
            )

        self.assertIn("Organization name", str(ctx.exception))
