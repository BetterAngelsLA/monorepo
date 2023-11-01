from django.contrib.auth import SESSION_KEY, get_user_model
from django.test import Client, TestCase
from django.urls import reverse
from sesame.utils import get_query_string


class SesameLoginTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = get_user_model().objects.create_user(
            email="testuser@test.com", password="testpassword"
        )

    def test_magic_link_authentication(self) -> None:
        # Generate a magic login URL for the test user
        base_login_url = reverse("sesame-login")
        magic_login_url = base_login_url + get_query_string(self.user)

        # Use the test client to simulate following the magic link
        response = self.client.get(
            magic_login_url, HTTP_CONTENT_TYPE="application/json"
        )

        # Assert the user was properly authenticated
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.session[SESSION_KEY], str(self.user.pk))

        # Additional checks can be added, such as redirect behaviors, content on the page, etc.
