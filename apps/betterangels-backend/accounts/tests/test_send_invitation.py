from accounts.models import User
from django.test import TestCase


class SendInvitationTest(TestCase):
    def setUp(self) -> None:
        # Create a test user
        self.email = "testuser@test.com"
        self.password = "testpassword123"
        self.user = User.objects.create_user(email=self.email, password=self.password)

    def test_send_invitation_case(self) -> None:
        self.client.login(email=self.email, password=self.password)
