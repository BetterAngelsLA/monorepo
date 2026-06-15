"""Tests for ``accounts.backends.CustomInvitations``."""

from unittest.mock import Mock, patch

from common.permissions.config import TemplateConfig
from django.test import TestCase, override_settings
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization, OrganizationInvitation
from post_office.models import Email

from ..backends import CustomInvitations
from ..models import User


@override_settings(EMAIL_BACKEND="post_office.EmailBackend")
class SendInvitationTestCase(TestCase):
    def setUp(self) -> None:
        self.email = "testuser@test.com"
        self.organization = Organization.objects.create(name="test organization")
        self.invitation_backend = CustomInvitations()

    # ── _resolve_invite_templates ─────────────────────────────────────

    def test_resolve_invite_templates_defaults(self) -> None:
        """Returns class-level defaults when no role_template kwarg."""
        html, txt = self.invitation_backend._resolve_invite_templates({})
        self.assertEqual(html, CustomInvitations.invitation_body_html)
        self.assertEqual(txt, CustomInvitations.invitation_body_txt)

    def test_resolve_invite_templates_defaults_with_non_template_config(self) -> None:
        """Returns class-level defaults when role_template is not a TemplateConfig."""
        html, txt = self.invitation_backend._resolve_invite_templates({"role_template": "not a config"})
        self.assertEqual(html, CustomInvitations.invitation_body_html)
        self.assertEqual(txt, CustomInvitations.invitation_body_txt)

    def test_resolve_invite_templates_defaults_with_none(self) -> None:
        """Returns class-level defaults when role_template is None."""
        html, txt = self.invitation_backend._resolve_invite_templates({"role_template": None})
        self.assertEqual(html, CustomInvitations.invitation_body_html)
        self.assertEqual(txt, CustomInvitations.invitation_body_txt)

    def test_resolve_invite_templates_with_custom_templates(self) -> None:
        """Returns custom invite_html/invite_txt from a TemplateConfig."""
        config = TemplateConfig(
            name="Test",
            permissions=[],
            invite_html="custom/email.html",
            invite_txt="custom/email.txt",
        )
        html, txt = self.invitation_backend._resolve_invite_templates({"role_template": config})
        self.assertEqual(html, "custom/email.html")
        self.assertEqual(txt, "custom/email.txt")

    def test_resolve_invite_templates_with_custom_falls_back_on_none(self) -> None:
        """Falls back to class defaults when TemplateConfig has None invite paths."""
        config = TemplateConfig(name="Test", permissions=[])
        html, txt = self.invitation_backend._resolve_invite_templates({"role_template": config})
        self.assertEqual(html, CustomInvitations.invitation_body_html)
        self.assertEqual(txt, CustomInvitations.invitation_body_txt)

    def test_resolve_invite_templates_with_caseworker(self) -> None:
        """Returns CASEWORKER's custom invite templates when passed as role_template."""
        html, txt = self.invitation_backend._resolve_invite_templates({"role_template": CASEWORKER})
        self.assertEqual(html, CASEWORKER.invite_html)
        self.assertEqual(txt, CASEWORKER.invite_txt)

    # ── send_invitation ────────────────────────────────────────────────

    def test_send_invitation_creates_email(self) -> None:
        """send_invitation creates an email for the user."""
        user = baker.make(User, email=self.email)
        sender = baker.make(User, email="admin@test.com")

        result = self.invitation_backend.send_invitation(
            user,
            sender,
            organization=self.organization,
            domain="localhost:8000",
        )
        self.assertIsInstance(result, int)
        self.assertEqual(Email.objects.filter(to=self.email).count(), 1)

    def test_send_invitation_uses_role_template(self) -> None:
        """send_invitation calls _resolve_invite_templates with role_template kwarg."""
        user = baker.make(User, email=self.email)
        sender = baker.make(User, email="admin@test.com")

        with patch.object(
            self.invitation_backend,
            "email_message",
            return_value=Mock(send=Mock(return_value=1)),
        ), patch.object(
            self.invitation_backend,
            "_resolve_invite_templates",
            return_value=(CustomInvitations.invitation_body_html, CustomInvitations.invitation_body_txt),
        ) as mock_resolve:
            self.invitation_backend.send_invitation(
                user,
                sender,
                organization=self.organization,
                domain="localhost:8000",
                role_template=CASEWORKER,
            )
            mock_resolve.assert_called_once()
            call_kwargs = mock_resolve.call_args[0][0]
            self.assertIs(call_kwargs["role_template"], CASEWORKER)

    def test_send_invitation_raises_without_email(self) -> None:
        """send_invitation raises ValueError if user has no email."""
        user = baker.make(User, email="")
        with self.assertRaisesRegex(ValueError, r"Cannot send invitation"):
            self.invitation_backend.send_invitation(
                user, organization=self.organization, domain="localhost:8000"
            )

    # ── invite_by_email ────────────────────────────────────────────────

    @patch("accounts.backends.CustomInvitations.send_invitation")
    def test_invite_by_email_creates_user(self, mock_send: Mock) -> None:
        """invite_by_email creates a new user and sends invitation."""
        user = self.invitation_backend.invite_by_email(
            self.email, domain="localhost:8000"
        )
        self.assertEqual(user.email, self.email)
        self.assertFalse(user.has_usable_password())
        mock_send.assert_called_once_with(user, None, domain="localhost:8000")

    @patch("accounts.backends.CustomInvitations.send_invitation")
    def test_invite_by_email_existing_user(self, mock_send: Mock) -> None:
        """invite_by_email reuses existing user by email."""
        existing = baker.make(User, email=self.email, username="existing")
        user = self.invitation_backend.invite_by_email(
            self.email, domain="localhost:8000"
        )
        self.assertEqual(user.pk, existing.pk)  # reused
        mock_send.assert_called_once_with(user, None, domain="localhost:8000")

    def test_send_invitation_case(self) -> None:
        """Original smoke test — invite_by_email creates an Email record."""
        self.invitation_backend.invite_by_email(self.email, domain={"domain": "localhost:8000"})
        self.assertEqual(Email.objects.filter(to=self.email).count(), 1)

    # ── create_organization_invite ─────────────────────────────────────

    def test_create_organization_invite(self) -> None:
        """create_organization_invite persists an ExtendedOrganizationInvitation."""
        user = baker.make(User, email=self.email)
        invited_by = baker.make(User, email="inviter@test.com")

        invitation = self.invitation_backend.create_organization_invite(
            organization=self.organization,
            invited_by_user=invited_by,
            invitee_user=user,
        )
        self.assertIsInstance(invitation, OrganizationInvitation)
        self.assertEqual(invitation.organization, self.organization)
        self.assertEqual(invitation.invited_by, invited_by)
        self.assertEqual(invitation.invitee, user)
        self.assertEqual(invitation.invitee_identifier, self.email)