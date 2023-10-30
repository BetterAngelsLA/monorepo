from accounts.models import User
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse


class LogoutTestCase(TestCase):
    def setUp(self) -> None:
        # Create a test user
        self.email = "testuser@test.com"
        self.password = "testpassword123"
        self.user = User.objects.create_user(email=self.email, password=self.password)
        self.logout_url = reverse("logout")

    def test_logout_clears_session(self) -> None:
        self.client.login(email=self.email, password=self.password)
        session_cache_key = "django.contrib.sessions.cache" + (
            self.client.session.session_key or ""
        )

        self.assertIsNotNone(cache.get(session_cache_key))
        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(cache.get(session_cache_key))
