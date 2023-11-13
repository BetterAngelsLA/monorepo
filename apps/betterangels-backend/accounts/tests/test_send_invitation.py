from accounts.models import User
from django.conf import settings
from django.test import TestCase, override_settings
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationUser
from post_office.models import Email

from ..backends import CustomInvitations


@override_settings(EMAIL_BACKEND="post_office.EmailBackend")
class SendInvitationTest(TestCase):
    def setUp(self) -> None:
        # Create a test user
        self.email = "testuser@test.com"
        self.password = "testpassword123"
        # self.user = User.objects.create_user(
        #     email=self.email, password=self.password, is_active=False
        # )
        self.organization = Organization.objects.create(name="test organization")
        self.invitation_backend = CustomInvitations()

    def test_send_invitation_case(self) -> None:
        self.client.login(email=self.email, password=self.password)
        self.invitation_backend.invite_by_email(self.email)
        self.assertEquals(Email.objects.filter(to=self.email).count(), 1)
