"""HMIS utilities."""

from typing import Optional, cast

import waffle
from django.conf import settings

# Keep in sync with the frontend FeatureSwitches.HMIS_PROD_DEMO_ENABLED.
HMIS_PROD_DEMO_SWITCH = "hmis_prod_demo_enabled"


def get_clarity_endpoint(email: str) -> Optional[str]:
    """Return the HMIS REST endpoint this email should authenticate against.

    Allowlisted emails log in against ``LA_CLARITY_REST_URL`` while the
    ``hmis_prod_demo_enabled`` waffle switch is active. Everyone else uses the
    default ``HMIS_REST_URL``.
    """

    default_endpoint: Optional[str] = getattr(settings, "HMIS_REST_URL", None)

    if waffle.switch_is_active(HMIS_PROD_DEMO_SWITCH):
        allowed_emails = {e.strip().lower() for e in settings.LA_HMIS_PROD_ALLOWED_EMAILS}
        email_allowed = email.strip().lower() in allowed_emails

        # TODO: should raise if email_allowed and LA_CLARITY_REST_URL missing
        if settings.LA_CLARITY_REST_URL and email_allowed:
            return cast(str, settings.LA_CLARITY_REST_URL)

    return default_endpoint
