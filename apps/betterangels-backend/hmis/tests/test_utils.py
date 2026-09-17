from django.test import TestCase, override_settings
from hmis.utils import HMIS_PROD_DEMO_SWITCH, get_clarity_endpoint
from unittest_parametrize import ParametrizedTestCase, parametrize
from waffle.testutils import override_switch

DEFAULT_ENDPOINT = "https://betterangels-sandbox.example.com"
LA_ENDPOINT = "https://la-clarity.example.com"
ALLOWED_EMAIL = "tester@betterangels.la"


# ---------------------------------------------------------------------------
# get_clarity_endpoint
# ---------------------------------------------------------------------------
class GetClarityEndpointTestCase(ParametrizedTestCase, TestCase):
    """Endpoint resolution for HMIS login.

    ``LA_CLARITY_REST_URL`` only applies while the prod-demo switch is active
    and the email is allowlisted; every other combination falls back to the
    default ``HMIS_REST_URL``.
    """

    @parametrize(
        "switch_active, la_endpoint, allowed_emails, email, expected",
        [
            # Switch on + LA configured + email allowlisted -> LA Clarity.
            (True, LA_ENDPOINT, [ALLOWED_EMAIL], ALLOWED_EMAIL, LA_ENDPOINT),
            # Switch off -> default, even though everything else lines up.
            (False, LA_ENDPOINT, [ALLOWED_EMAIL], ALLOWED_EMAIL, DEFAULT_ENDPOINT),
            # LA_CLARITY_REST_URL unset in this environment -> default.
            (True, "", [ALLOWED_EMAIL], ALLOWED_EMAIL, DEFAULT_ENDPOINT),
            # No allowlisted emails -> default.
            (True, LA_ENDPOINT, [], ALLOWED_EMAIL, DEFAULT_ENDPOINT),
            # Email not allowlisted -> default.
            (True, LA_ENDPOINT, ["someone-else@betterangels.la"], ALLOWED_EMAIL, DEFAULT_ENDPOINT),
            # Allowlist entries are matched case-insensitively and trimmed.
            (True, LA_ENDPOINT, [" Tester@BetterAngels.LA "], ALLOWED_EMAIL, LA_ENDPOINT),
            # The login email is normalised the same way before matching.
            (True, LA_ENDPOINT, [ALLOWED_EMAIL], "  TESTER@betterangels.la  ", LA_ENDPOINT),
        ],
    )
    def test_get_clarity_endpoint(
        self,
        switch_active: bool,
        la_endpoint: str,
        allowed_emails: list[str],
        email: str,
        expected: str,
    ) -> None:
        with (
            override_settings(
                HMIS_REST_URL=DEFAULT_ENDPOINT,
                LA_CLARITY_REST_URL=la_endpoint,
                LA_HMIS_PROD_ALLOWED_EMAILS=allowed_emails,
            ),
            override_switch(HMIS_PROD_DEMO_SWITCH, active=switch_active),
        ):
            self.assertEqual(get_clarity_endpoint(email), expected)

    def test_returns_none_when_no_default_endpoint_configured(self) -> None:
        """``None`` can only surface when even ``HMIS_REST_URL`` is missing."""
        with override_settings(HMIS_REST_URL=None), override_switch(HMIS_PROD_DEMO_SWITCH, active=False):
            self.assertIsNone(get_clarity_endpoint(ALLOWED_EMAIL))
