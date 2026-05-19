from unittest.mock import patch

from accounts.models import PermissionGroup, PermissionGroupTemplate, User
from django.core.exceptions import ValidationError
from django.test import TestCase
from organizations.models import Organization, OrganizationOwner, OrganizationUser
from shelters.groups import SHELTER_OPERATOR
from shelters.services import shelter_operator_register


class ShelterOperatorRegisterTestCase(TestCase):
    """Tests for shelter_operator_register service."""

    @patch("shelters.services._send_shelter_welcome_email")
    def test_creates_user_and_organization(self, mock_email):
        user, org = shelter_operator_register(
            email="operator@example.com",
            first_name="Jane",
            last_name="Doe",
            organization_name="Safe Haven Shelter",
        )

        self.assertEqual(user.email, "operator@example.com")
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Doe")
        self.assertTrue(user.is_active)
        self.assertFalse(user.has_usable_password())

        self.assertEqual(org.name, "Safe Haven Shelter")

    @patch("shelters.services._send_shelter_welcome_email")
    def test_user_is_org_owner(self, mock_email):
        user, org = shelter_operator_register(
            email="owner@example.com",
            first_name="John",
            last_name="Smith",
            organization_name="My Shelter",
        )

        org_user = OrganizationUser.objects.get(user=user, organization=org)
        self.assertTrue(org_user.is_admin)
        self.assertTrue(OrganizationOwner.objects.filter(organization=org, organization_user=org_user).exists())

    @patch("shelters.services._send_shelter_welcome_email")
    def test_user_gets_shelter_operator_group(self, mock_email):
        user, org = shelter_operator_register(
            email="groups@example.com",
            first_name="A",
            last_name="B",
            organization_name="Org",
        )

        template = PermissionGroupTemplate.objects.get(name=SHELTER_OPERATOR)
        perm_group = PermissionGroup.objects.get(organization=org, template=template)
        self.assertTrue(user.groups.filter(pk=perm_group.group_id).exists())

    @patch("shelters.services._send_shelter_welcome_email")
    def test_sends_welcome_email(self, mock_email):
        shelter_operator_register(
            email="welcome@example.com",
            first_name="A",
            last_name="B",
            organization_name="Org",
        )

        mock_email.assert_called_once()

    @patch("shelters.services._send_shelter_welcome_email")
    def test_duplicate_email_raises(self, mock_email):
        User.objects.create_user(username="existing", email="dupe@example.com")

        with self.assertRaises(ValidationError) as ctx:
            shelter_operator_register(
                email="dupe@example.com",
                first_name="A",
                last_name="B",
                organization_name="Org",
            )

        self.assertIn("already exists", str(ctx.exception))

    @patch("shelters.services._send_shelter_welcome_email")
    def test_empty_org_name_raises(self, mock_email):
        with self.assertRaises(ValidationError) as ctx:
            shelter_operator_register(
                email="empty@example.com",
                first_name="A",
                last_name="B",
                organization_name="   ",
            )

        self.assertIn("Organization name", str(ctx.exception))

    @patch("shelters.services._send_shelter_welcome_email")
    def test_email_is_normalized(self, mock_email):
        user, _ = shelter_operator_register(
            email="  Mixed@CASE.com  ",
            first_name="A",
            last_name="B",
            organization_name="Org",
        )

        self.assertEqual(user.email, "mixed@case.com")
