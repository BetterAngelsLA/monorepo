from accounts.services import send_magic_link
from django.contrib.auth import SESSION_KEY, get_user_model
from django.template import loader
from django.test import Client, RequestFactory, TestCase
from django.urls import reverse
from post_office import mail
from post_office.models import Email
from sesame.utils import get_query_string


class SesameLoginTests(TestCase):
    def setUp(self) -> None:
        self.factory = RequestFactory()
        self.client = Client()
        self.user = get_user_model().objects.create_user(
            email="testuser@test.com", password="testpassword"
        )

    def test_magic_link_authentication(self) -> None:
        # Generate a magic login URL for the test user
        base_login_url = reverse("magic-auth-login")
        magic_login_url = base_login_url + get_query_string(self.user)

        # Use the test client to simulate following the magic link
        response = self.client.get(
            magic_login_url, HTTP_CONTENT_TYPE="application/json"
        )

        # Assert the user was properly authenticated
        self.assertEqual(response.status_code, 302)
        self.assertEqual(self.client.session[SESSION_KEY], str(self.user.pk))

        # Additional checks can be added, such as redirect behaviors, content on the page, etc.

    def test_magic_link_email_template_render(self) -> None:
        # Generate a magic login URL for the test user
        base_login_url = reverse("magic-auth-login")
        magic_login_url = base_login_url + get_query_string(self.user)
        context = {"magic_login_link_url": magic_login_url}

        template = loader.get_template("email_magic_link.html")
        html_message = template.render(context)

        text_template = loader.get_template("email_magic_link.txt")
        text_message = text_template.render(context)

        sent = mail.send(
            "test@test.com",
            "from@test.com",
            subject="Login through link",
            html_message=html_message,
            message=text_message,
        )

        # Call the function with the mock request

        found = Email.objects.get(id=sent.id)
        self.assertIn(magic_login_url, found.html_message)
        self.assertIn(magic_login_url, found.message)

    def test_send_magic_link(self) -> None:
        sent, query_string = send_magic_link(self.user.email, "http://localhost")

        found = Email.objects.get(id=sent.id)
        self.assertIn(query_string, found.html_message)
        self.assertIn(query_string, found.message)
