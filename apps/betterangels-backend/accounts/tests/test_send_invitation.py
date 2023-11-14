from django.test import TestCase, override_settings
from organizations.models import Organization
from post_office.models import Email

from ..backends import CustomInvitations


@override_settings(EMAIL_BACKEND="post_office.EmailBackend")
class SendInvitationTest(TestCase):
    def setUp(self) -> None:
        # Create a test user
        self.email = "testuser@test.com"
        self.password = "testpassword123"
        self.organization = Organization.objects.create(name="test organization")
        self.invitation_backend = CustomInvitations()

    def test_send_invitation_case(self) -> None:
        self.invitation_backend.invite_by_email(self.email)
        self.assertEquals(Email.objects.filter(to=self.email).count(), 1)

    def test_invitation_acceptance(self) -> None:
        pass
