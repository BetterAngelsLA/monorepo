from unittest.mock import ANY, patch

from accounts.models import User
from accounts.services import send_magic_link
from django.contrib.auth import SESSION_KEY, get_user_model
from django.core.mail import send_mail
from django.template import loader
from django.test import (
    Client,
    RequestFactory,
    TestCase,
    ignore_warnings,
    override_settings,
)
from django.urls import reverse
from model_bakery import baker
from post_office.models import Email
from sesame.utils import get_query_string
from test_utils.mixins import GraphQLTestCaseMixin


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


@ignore_warnings(category=UserWarning)
@override_settings(EMAIL_BACKEND="post_office.EmailBackend")
class MagicLinkGraphQLTests(GraphQLTestCaseMixin, TestCase):
    def test_generate_magic_link(self) -> None:
        user = baker.make(User, email="test@example.com", username="testuser")

        query = """
        mutation GenerateMagicLink($input: MagicLinkInput!) {
            generateMagicLink(input: $input) {
                message
            }
        }
        """
        variables = {"input": {"email": user.email}}
        response = self.execute_graphql_query(query, variables=variables)

        self.assertIsNone(response.get("errors"))
        self.assertEqual(
            response["data"]["generateMagicLink"]["message"], "Email link sent."
        )
        emails = Email.objects.all()
        self.assertEqual(len(emails), 1)
