from django.test import TestCase, override_settings
from unittest_parametrize import ParametrizedTestCase, parametrize
from waffle.testutils import override_switch

from hmis.utils import HMIS_PROD_DEMO_SWITCH, is_hmis_login_allowed

ALLOWED_EMAIL = "tester@betterangels.la"


# ---------------------------------------------------------------------------
# is_hmis_login_allowed
# ---------------------------------------------------------------------------
class IsHmisLoginAllowedTestCase(ParametrizedTestCase, TestCase):
    """HMIS login gate.

    Unconfigured allowlists (dev, local) are unrestricted. Where configured,
    logins are allowed only while the prod-demo switch is active and the email
    is allowlisted.
    """

    @parametrize(
        "switch_active, allowed_emails, email, expected",
        [
            # No allowlist configured -> unrestricted, regardless of switch.
            (False, [], ALLOWED_EMAIL, True),
            (True, [], "someone@else.com", True),
            # Configured + switch active: only allowlisted emails may log in.
            (True, [ALLOWED_EMAIL], ALLOWED_EMAIL, True),
            (True, [ALLOWED_EMAIL], "someone@else.com", False),
            # Configured + switch inactive: nobody may log in.
            (False, [ALLOWED_EMAIL], ALLOWED_EMAIL, False),
            # Matching is case-insensitive and whitespace-trimmed on both sides.
            (True, [" Tester@BetterAngels.LA "], ALLOWED_EMAIL, True),
            (True, [ALLOWED_EMAIL], "  TESTER@betterangels.la  ", True),
        ],
    )
    def test_is_hmis_login_allowed(
        self,
        switch_active: bool,
        allowed_emails: list[str],
        email: str,
        expected: bool,
    ) -> None:
        with (
            override_settings(LA_HMIS_PROD_ALLOWED_EMAILS=allowed_emails),
            override_switch(HMIS_PROD_DEMO_SWITCH, active=switch_active),
        ):
            self.assertEqual(is_hmis_login_allowed(email), expected)
