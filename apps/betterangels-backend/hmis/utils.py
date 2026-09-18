"""HMIS utilities."""

import waffle
from django.conf import settings

# Keep in sync with the frontend FeatureSwitches.HMIS_PROD_DEMO_ENABLED.
HMIS_PROD_DEMO_SWITCH = "hmis_prod_demo_enabled"


def is_hmis_login_allowed(email: str) -> bool:
    """Return whether this email may attempt an HMIS login.

    Environments without the allowlist configured (dev, local) are
    unrestricted. Where it is configured, logins are allowed only while the
    ``hmis_prod_demo_enabled`` waffle switch is active and the email is
    allowlisted.
    """
    allowed_emails = {e.strip().lower() for e in settings.LA_HMIS_PROD_ALLOWED_EMAILS}

    if not allowed_emails:
        return True

    if not waffle.switch_is_active(HMIS_PROD_DEMO_SWITCH):
        return False

    return email.strip().lower() in allowed_emails
