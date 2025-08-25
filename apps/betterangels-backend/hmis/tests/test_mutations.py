from unittest.mock import patch

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from model_bakery import baker

LOGIN_MUTATION = """
mutation Login($email: String!, $password: String!) {
  hmisLogin(email: $email, password: $password) {
    __typename
    ... on HmisLoginSuccess { hmisToken }
    ... on HmisLoginError { message field }
  }
}
"""


@override_settings(AUTHENTICATION_BACKENDS=["django.contrib.auth.backends.ModelBackend"])
class HmisLoginMutationTests(GraphQLBaseTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.existing_user = baker.make(get_user_model(), _fill_optional=["email"])

    def test_hmis_login_success(self) -> None:
        with patch(
            "hmis.schema.create_auth_token",
            return_value="TOK_123",
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "anything"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginSuccess")
        self.assertEqual(payload["hmisToken"], "TOK_123")

        # Session should now contain the logged-in user
        session = self.graphql_client.session
        self.assertIn("_auth_user_id", session)
        self.assertEqual(session["_auth_user_id"], str(self.existing_user.pk))
        self.assertEqual(
            session.get("_auth_user_backend"),
            "django.contrib.auth.backends.ModelBackend",
        )

    def test_hmis_login_invalid_credentials(self) -> None:
        with patch(
            "hmis.schema.create_auth_token",
            return_value=None,
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": self.existing_user.email, "password": "wrong"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginError")
        self.assertIn("Invalid credentials", payload["message"])

    def test_hmis_login_unknown_email_no_autocreate(self) -> None:
        with patch(
            "hmis.schema.create_auth_token",
            return_value="TOK_ABC",
        ):
            resp = self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": "nonexistent_user@example.org", "password": "pw"},
            )

        self.assertIsNone(resp.get("errors"))
        payload = resp["data"]["hmisLogin"]
        self.assertEqual(payload["__typename"], "HmisLoginError")
        self.assertIn("Invalid credentials or HMIS login failed", payload["message"])
