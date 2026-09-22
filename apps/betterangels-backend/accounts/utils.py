"""Utilities kept here to avoid circular imports between apps.

Business logic lives in :mod:`accounts.services`.
Read-only queries live in :mod:`accounts.selectors`.
"""

import waffle

# ---------------------------------------------------------------------------
# Demo-environment email helpers
# ---------------------------------------------------------------------------

DEMO_LOGIN_EMAIL_SWITCH = "demo_login_email"


def demo_login_email(email: str) -> str:
    """Return *email* with ``+demo`` inserted before the ``@``.

    The mobile app uses the ``+demo`` tag to route the user to the demo
    API server.
    """
    local, domain = email.rsplit("@", 1)
    return f"{local}+demo@{domain}"


def demo_email_context(email: str) -> dict[str, object]:
    """Return template-context dict for the demo-login-email feature.

    When the ``demo_login_email`` waffle switch is active:
    * ``is_demo`` → ``True``
    * ``login_email`` → ``user+demo@domain``

    Otherwise ``is_demo`` is ``False`` and ``login_email`` equals *email*.
    """
    is_demo: bool = waffle.switch_is_active(DEMO_LOGIN_EMAIL_SWITCH)
    login_email = demo_login_email(email) if is_demo else email
    return {"is_demo": is_demo, "login_email": login_email}
