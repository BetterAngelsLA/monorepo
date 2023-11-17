from accounts.services import send_magic_link
from django.contrib.auth import SESSION_KEY, get_user_model
from django.core.mail import send_mail
from django.template import loader
from django.test import Client, RequestFactory, TestCase, override_settings
from django.urls import reverse
from post_office.models import Email
from sesame.utils import get_query_string


@override_settings(EMAIL_BACKEND="post_office.EmailBackend")
class TestMagicLink(TestCase):
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

        # Additional checks can be added, such as redirect behaviors, content on the
        # page, etc.

    def test_magic_link_email_template_render(self) -> None:
        # Generate a magic login URL for the test user
        base_login_url = reverse("magic-auth-login")
        magic_login_url = base_login_url + get_query_string(self.user)
        context = {"magic_login_link_url": magic_login_url}

        template = loader.get_template("account/email/email_magic_link.html")
        html_message = template.render(context)

        text_template = loader.get_template("account/messages/email_magic_link.txt")
        text_message = text_template.render(context)

        send_mail(
            "Login through link",
            text_message,
            "from@test.com",
            ["test@test.com"],
            fail_silently=False,
            html_message=html_message,
        )

        # Call the function with the mock request
        found = Email.objects.first()
        self.assertIn(magic_login_url, found.html_message)
        self.assertIn(magic_login_url, found.message)

    def test_send_magic_link(self) -> None:
        query_string = send_magic_link(self.user.email, "http://localhost")
        found = Email.objects.all().first()
        self.assertIn(query_string, found.html_message)
        self.assertIn(query_string, found.message)

    def test_generate_magic_link_request(self) -> None:
        url = reverse("generate-magic-link")
        response = self.client.post(
            url, data={"email": self.user.email}, HTTP_CONTENT_TYPE="application/json"
        )
        emails = Email.objects.all()
        self.assertEqual(len(emails), 1)
        self.assertEqual(response.status_code, 200)
